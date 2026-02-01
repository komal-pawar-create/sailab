

# Comprehensive API Error Handling Plan

## Overview
Implement a robust, standardized error handling system for LabFlow that provides user-friendly messages while logging detailed error information for debugging. This includes a shared error library, PostgreSQL error mapping, an error_logs table for debugging, and consistent error responses across all edge functions and frontend code.

---

## Current State Analysis

| Component | Current Implementation | Issues |
|-----------|----------------------|--------|
| Edge functions | Basic try/catch with raw `error.message` | Exposes internal errors |
| Frontend RPC calls | Direct Supabase error display | Inconsistent messaging |
| Error logging | None (except audit_logs for data changes) | No error debugging trail |
| Error format | Inconsistent across functions | Hard to parse programmatically |
| PostgreSQL errors | Raw error codes exposed | Not user-friendly |

---

## Architecture Overview

```text
+------------------+     +-------------------+     +------------------+
|  Frontend        |---->| Edge Function /   |---->| Database         |
|  (React)         |     | RPC Call          |     | (PostgreSQL)     |
+------------------+     +-------------------+     +------------------+
       |                        |                        |
       v                        v                        v
+------------------+     +-------------------+     +------------------+
| errorUtils.ts    |     | errorHandler.ts   |     | handle_db_error()|
| - parseApiError  |     | - withErrorHandler|     | - Map PG codes   |
| - getErrorMessage|     | - standardResponse|     | - Log to table   |
+------------------+     +-------------------+     +------------------+
                                |
                                v
                         +-------------------+
                         | error_logs table  |
                         | - Full stack trace|
                         | - Request context |
                         +-------------------+
```

---

## Standardized Error Response Format

### Success Response
```json
{
  "success": true,
  "data": { ... }
}
```

### Error Response
```json
{
  "success": false,
  "error": {
    "code": "PATIENT_NOT_FOUND",
    "message": "Patient with ID xxx not found",
    "field": "patient_id"
  }
}
```

### Error Codes (Enumerated)
| Code | Description | HTTP Status |
|------|-------------|-------------|
| `VALIDATION_ERROR` | Input validation failed | 400 |
| `DUPLICATE_RECORD` | Record already exists | 409 |
| `RECORD_NOT_FOUND` | Requested record not found | 404 |
| `REFERENCE_ERROR` | Foreign key constraint violation | 400 |
| `ACCESS_DENIED` | RLS policy violation | 403 |
| `UNAUTHORIZED` | Authentication required | 401 |
| `RATE_LIMITED` | Too many requests | 429 |
| `INTERNAL_ERROR` | Server-side error (generic) | 500 |
| `SERVICE_UNAVAILABLE` | External service failure | 503 |

---

## Database Schema

### error_logs Table
```sql
CREATE TABLE public.error_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  error_code text NOT NULL,
  error_message text NOT NULL,
  stack_trace text,
  context jsonb,
  user_id uuid,
  request_path text,
  request_method text,
  request_body jsonb,
  ip_address text,
  user_agent text,
  lab_id uuid,
  branch_id uuid,
  pg_error_code text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Index for efficient querying
CREATE INDEX idx_error_logs_created ON error_logs(created_at DESC);
CREATE INDEX idx_error_logs_code ON error_logs(error_code);
CREATE INDEX idx_error_logs_lab ON error_logs(lab_id);
```

### RLS Policies for error_logs
```sql
-- Super admins can view all error logs
CREATE POLICY "Super admins can view error logs"
  ON error_logs FOR SELECT
  USING (is_super_admin(auth.uid()));

-- Lab admins can view error logs from their lab
CREATE POLICY "Lab admins can view lab error logs"
  ON error_logs FOR SELECT
  USING (
    is_lab_admin(auth.uid()) AND 
    lab_id = get_user_lab(auth.uid())
  );

-- System can insert error logs
CREATE POLICY "System can insert error logs"
  ON error_logs FOR INSERT
  WITH CHECK (true);
```

---

## Database Functions

### 1. PostgreSQL Error Mapper Function
```sql
CREATE OR REPLACE FUNCTION public.map_pg_error(
  p_sqlstate text,
  p_message text,
  p_detail text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_result jsonb;
  v_user_message text;
  v_error_code text;
  v_field text;
BEGIN
  -- Map PostgreSQL error codes to user-friendly messages
  CASE p_sqlstate
    WHEN '23505' THEN -- unique_violation
      v_error_code := 'DUPLICATE_RECORD';
      v_user_message := 'This record already exists';
      -- Try to extract field name from detail
      IF p_detail LIKE '%Key (%)%' THEN
        v_field := substring(p_detail from 'Key \(([^)]+)\)');
      END IF;
      
    WHEN '23503' THEN -- foreign_key_violation
      v_error_code := 'REFERENCE_ERROR';
      v_user_message := 'Referenced record not found';
      IF p_detail LIKE '%Key (%)%' THEN
        v_field := substring(p_detail from 'Key \(([^)]+)\)');
      END IF;
      
    WHEN '23514' THEN -- check_violation
      v_error_code := 'VALIDATION_ERROR';
      v_user_message := 'Data validation failed';
      
    WHEN '42501' THEN -- insufficient_privilege (RLS)
      v_error_code := 'ACCESS_DENIED';
      v_user_message := 'You do not have permission to perform this action';
      
    WHEN '23502' THEN -- not_null_violation
      v_error_code := 'VALIDATION_ERROR';
      v_user_message := 'Required field is missing';
      IF p_message LIKE '%column "%' THEN
        v_field := substring(p_message from 'column "([^"]+)"');
      END IF;
      
    WHEN '22001' THEN -- string_data_right_truncation
      v_error_code := 'VALIDATION_ERROR';
      v_user_message := 'Value is too long';
      
    WHEN '22P02' THEN -- invalid_text_representation
      v_error_code := 'VALIDATION_ERROR';
      v_user_message := 'Invalid data format';
      
    WHEN 'P0001' THEN -- raise_exception (custom errors)
      v_error_code := 'VALIDATION_ERROR';
      v_user_message := p_message; -- Custom errors are already user-friendly
      
    ELSE
      v_error_code := 'INTERNAL_ERROR';
      v_user_message := 'An unexpected error occurred';
  END CASE;
  
  v_result := jsonb_build_object(
    'code', v_error_code,
    'message', v_user_message
  );
  
  IF v_field IS NOT NULL THEN
    v_result := v_result || jsonb_build_object('field', v_field);
  END IF;
  
  RETURN v_result;
END;
$$;
```

### 2. Error Logging Function
```sql
CREATE OR REPLACE FUNCTION public.log_error(
  p_error_code text,
  p_error_message text,
  p_stack_trace text DEFAULT NULL,
  p_context jsonb DEFAULT NULL,
  p_request_path text DEFAULT NULL,
  p_request_method text DEFAULT NULL,
  p_request_body jsonb DEFAULT NULL,
  p_ip_address text DEFAULT NULL,
  p_user_agent text DEFAULT NULL,
  p_pg_error_code text DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_log_id uuid;
  v_user_id uuid;
  v_lab_id uuid;
  v_branch_id uuid;
BEGIN
  v_user_id := auth.uid();
  
  -- Get user's lab and branch if authenticated
  IF v_user_id IS NOT NULL THEN
    SELECT lab_id, branch_id INTO v_lab_id, v_branch_id
    FROM profiles
    WHERE user_id = v_user_id;
  END IF;
  
  INSERT INTO error_logs (
    error_code,
    error_message,
    stack_trace,
    context,
    user_id,
    request_path,
    request_method,
    request_body,
    ip_address,
    user_agent,
    lab_id,
    branch_id,
    pg_error_code
  ) VALUES (
    p_error_code,
    p_error_message,
    p_stack_trace,
    p_context,
    v_user_id,
    p_request_path,
    p_request_method,
    p_request_body,
    p_ip_address,
    p_user_agent,
    v_lab_id,
    v_branch_id,
    p_pg_error_code
  )
  RETURNING id INTO v_log_id;
  
  RETURN v_log_id;
END;
$$;
```

### 3. RPC Wrapper for Safe Database Operations
```sql
CREATE OR REPLACE FUNCTION public.safe_execute(
  p_operation text,
  p_params jsonb
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_result jsonb;
  v_error_info jsonb;
BEGIN
  -- Execute the operation based on type
  -- This is a template - specific operations would be implemented
  
  RETURN jsonb_build_object(
    'success', true,
    'data', v_result
  );
  
EXCEPTION
  WHEN OTHERS THEN
    -- Map the PostgreSQL error to user-friendly format
    v_error_info := map_pg_error(SQLSTATE, SQLERRM, NULL);
    
    -- Log the error with full details
    PERFORM log_error(
      v_error_info->>'code',
      v_error_info->>'message',
      pg_exception_context(),
      p_params,
      NULL,
      NULL,
      NULL,
      NULL,
      NULL,
      SQLSTATE
    );
    
    RETURN jsonb_build_object(
      'success', false,
      'error', v_error_info
    );
END;
$$;
```

---

## Edge Function Error Handler

### Shared Error Handler Module
Create `supabase/functions/_shared/errorHandler.ts`:

```typescript
// Standard error codes
export enum ErrorCode {
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  DUPLICATE_RECORD = 'DUPLICATE_RECORD',
  RECORD_NOT_FOUND = 'RECORD_NOT_FOUND',
  REFERENCE_ERROR = 'REFERENCE_ERROR',
  ACCESS_DENIED = 'ACCESS_DENIED',
  UNAUTHORIZED = 'UNAUTHORIZED',
  RATE_LIMITED = 'RATE_LIMITED',
  INTERNAL_ERROR = 'INTERNAL_ERROR',
  SERVICE_UNAVAILABLE = 'SERVICE_UNAVAILABLE',
}

// Error response interface
export interface ApiError {
  code: ErrorCode | string;
  message: string;
  field?: string;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: ApiError;
}

// PostgreSQL error code mapping
const PG_ERROR_MAP: Record<string, { code: ErrorCode; message: string }> = {
  '23505': { code: ErrorCode.DUPLICATE_RECORD, message: 'This record already exists' },
  '23503': { code: ErrorCode.REFERENCE_ERROR, message: 'Referenced record not found' },
  '23514': { code: ErrorCode.VALIDATION_ERROR, message: 'Data validation failed' },
  '42501': { code: ErrorCode.ACCESS_DENIED, message: 'You do not have permission' },
  '23502': { code: ErrorCode.VALIDATION_ERROR, message: 'Required field is missing' },
  'PGRST301': { code: ErrorCode.RECORD_NOT_FOUND, message: 'Record not found' },
  'PGRST116': { code: ErrorCode.RECORD_NOT_FOUND, message: 'Record not found' },
};

// Map any error to standardized format
export function mapError(error: unknown): ApiError {
  if (error instanceof Error) {
    // Check for PostgreSQL/PostgREST error codes
    const errorAny = error as any;
    const pgCode = errorAny.code || errorAny.details?.code;
    
    if (pgCode && PG_ERROR_MAP[pgCode]) {
      return {
        code: PG_ERROR_MAP[pgCode].code,
        message: PG_ERROR_MAP[pgCode].message,
      };
    }
    
    // Custom application errors (thrown intentionally)
    if (error.message.startsWith('[')) {
      try {
        const parsed = JSON.parse(error.message);
        return {
          code: parsed.code || ErrorCode.INTERNAL_ERROR,
          message: parsed.message || 'An error occurred',
          field: parsed.field,
        };
      } catch {
        // Not JSON, continue
      }
    }
  }
  
  // Default: never expose internal error details
  return {
    code: ErrorCode.INTERNAL_ERROR,
    message: 'An unexpected error occurred. Please try again.',
  };
}

// Create success response
export function successResponse<T>(data: T, status = 200): Response {
  return new Response(
    JSON.stringify({ success: true, data }),
    {
      status,
      headers: { 'Content-Type': 'application/json' },
    }
  );
}

// Create error response
export function errorResponse(
  error: ApiError,
  status = 400,
  corsHeaders: Record<string, string> = {}
): Response {
  return new Response(
    JSON.stringify({ success: false, error }),
    {
      status,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    }
  );
}

// HTTP status code from error code
export function getStatusFromErrorCode(code: ErrorCode | string): number {
  switch (code) {
    case ErrorCode.VALIDATION_ERROR:
    case ErrorCode.REFERENCE_ERROR:
      return 400;
    case ErrorCode.UNAUTHORIZED:
      return 401;
    case ErrorCode.ACCESS_DENIED:
      return 403;
    case ErrorCode.RECORD_NOT_FOUND:
      return 404;
    case ErrorCode.DUPLICATE_RECORD:
      return 409;
    case ErrorCode.RATE_LIMITED:
      return 429;
    case ErrorCode.SERVICE_UNAVAILABLE:
      return 503;
    default:
      return 500;
  }
}

// Throw custom application error
export function throwAppError(
  code: ErrorCode,
  message: string,
  field?: string
): never {
  throw new Error(JSON.stringify({ code, message, field }));
}
```

---

## Frontend Error Utilities

### Create `src/lib/errorUtils.ts`:

```typescript
/**
 * Standardized error handling utilities for frontend
 */

export interface ApiError {
  code: string;
  message: string;
  field?: string;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: ApiError;
}

// User-friendly error messages for common codes
const ERROR_MESSAGES: Record<string, string> = {
  VALIDATION_ERROR: 'Please check your input and try again',
  DUPLICATE_RECORD: 'This record already exists',
  RECORD_NOT_FOUND: 'The requested record was not found',
  REFERENCE_ERROR: 'Cannot complete action: related record not found',
  ACCESS_DENIED: 'You do not have permission to perform this action',
  UNAUTHORIZED: 'Please sign in to continue',
  RATE_LIMITED: 'Too many requests. Please wait and try again',
  INTERNAL_ERROR: 'Something went wrong. Please try again later',
  SERVICE_UNAVAILABLE: 'Service temporarily unavailable. Please try later',
  NETWORK_ERROR: 'Network error. Please check your connection',
};

/**
 * Parse API response and extract error information
 */
export function parseApiError(response: unknown): ApiError {
  if (typeof response === 'object' && response !== null) {
    const resp = response as Record<string, unknown>;
    
    // Standard API error format
    if (resp.error && typeof resp.error === 'object') {
      const error = resp.error as Record<string, unknown>;
      return {
        code: String(error.code || 'INTERNAL_ERROR'),
        message: String(error.message || getDefaultMessage('INTERNAL_ERROR')),
        field: error.field ? String(error.field) : undefined,
      };
    }
    
    // Supabase error format
    if (resp.message) {
      return {
        code: String(resp.code || 'INTERNAL_ERROR'),
        message: String(resp.message),
      };
    }
  }
  
  return {
    code: 'INTERNAL_ERROR',
    message: getDefaultMessage('INTERNAL_ERROR'),
  };
}

/**
 * Get user-friendly message for error code
 */
export function getDefaultMessage(code: string): string {
  return ERROR_MESSAGES[code] || ERROR_MESSAGES.INTERNAL_ERROR;
}

/**
 * Get display message (uses custom message or falls back to default)
 */
export function getErrorMessage(error: ApiError | null | undefined): string {
  if (!error) return getDefaultMessage('INTERNAL_ERROR');
  return error.message || getDefaultMessage(error.code);
}

/**
 * Check if error is a specific type
 */
export function isErrorCode(error: unknown, code: string): boolean {
  if (typeof error === 'object' && error !== null) {
    const err = error as Record<string, unknown>;
    return err.code === code || (err.error as Record<string, unknown>)?.code === code;
  }
  return false;
}

/**
 * Handle Supabase query errors with standardized format
 */
export function handleSupabaseError(error: {
  code?: string;
  message?: string;
  details?: string;
  hint?: string;
}): ApiError {
  // Map Supabase/PostgREST error codes
  const pgCodeMap: Record<string, string> = {
    '23505': 'DUPLICATE_RECORD',
    '23503': 'REFERENCE_ERROR',
    '23514': 'VALIDATION_ERROR',
    '42501': 'ACCESS_DENIED',
    '23502': 'VALIDATION_ERROR',
    'PGRST301': 'RECORD_NOT_FOUND',
    'PGRST116': 'RECORD_NOT_FOUND',
  };
  
  const mappedCode = error.code ? pgCodeMap[error.code] : undefined;
  
  if (mappedCode) {
    return {
      code: mappedCode,
      message: getDefaultMessage(mappedCode),
    };
  }
  
  // For other errors, don't expose internal details
  console.error('Database error:', error);
  return {
    code: 'INTERNAL_ERROR',
    message: getDefaultMessage('INTERNAL_ERROR'),
  };
}
```

---

## Files to Create/Modify

| File | Action | Purpose |
|------|--------|---------|
| `supabase/migrations/[timestamp]_error_handling.sql` | Create | error_logs table, RPC functions |
| `supabase/functions/_shared/errorHandler.ts` | Create | Shared error handling for edge functions |
| `src/lib/errorUtils.ts` | Create | Frontend error handling utilities |
| `src/hooks/useApiError.ts` | Create | React hook for error state management |
| `supabase/functions/verify-otp/index.ts` | Modify | Update to use new error handler |
| `supabase/functions/admin-update-password/index.ts` | Modify | Update to use new error handler |
| All edge functions | Modify | Standardize error responses |

---

## Implementation Summary

### Database Migration Contents
- 1 new table (`error_logs`)
- 3 new functions (`map_pg_error`, `log_error`, `safe_execute`)
- 3 RLS policies for secure access
- 2 indexes for query performance

### Frontend Changes
- New `errorUtils.ts` library with standardized parsing
- All Supabase query error handlers updated to use `handleSupabaseError()`
- Toast messages use `getErrorMessage()` for consistency

### Edge Function Changes
- All functions import from `_shared/errorHandler.ts`
- All responses follow `{ success, data?, error? }` format
- All internal errors logged to `error_logs` table
- No raw PostgreSQL errors exposed to clients

---

## Security Considerations

1. **Never expose internal errors**: All PostgreSQL errors mapped to generic user-friendly messages
2. **Stack traces logged only**: Detailed error info in `error_logs`, not in API responses
3. **RLS on error_logs**: Only super_admins and lab_admins can view error logs
4. **Request body sanitization**: Sensitive fields (passwords) stripped before logging
5. **Consistent error codes**: Prevents information leakage through error variation

---

## Example Usage

### Edge Function (After)
```typescript
import { errorResponse, successResponse, mapError, throwAppError, ErrorCode } from '../_shared/errorHandler.ts';

serve(async (req) => {
  try {
    // Validate input
    if (!userId) {
      throwAppError(ErrorCode.VALIDATION_ERROR, 'User ID is required', 'userId');
    }
    
    // Business logic...
    
    return successResponse({ user: userData });
    
  } catch (error) {
    const apiError = mapError(error);
    await logErrorToDb(apiError, req); // Log internally
    return errorResponse(apiError, getStatusFromErrorCode(apiError.code), corsHeaders);
  }
});
```

### Frontend (After)
```typescript
import { handleSupabaseError, getErrorMessage } from '@/lib/errorUtils';

const { data, error } = await supabase.from('patients').insert(patient);

if (error) {
  const apiError = handleSupabaseError(error);
  toast.error(getErrorMessage(apiError));
  return;
}
```

