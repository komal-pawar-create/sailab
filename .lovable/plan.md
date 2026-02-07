

# Fix Production Gaps for LabFlow

## Overview
This plan addresses four critical production gaps: authentication RPC accessibility, security headers standardization, patient creation 400 errors, and query join issues for bills/patients.

---

## Current State Analysis

### 1. Authentication Functions
**Status: WORKING** - Functions are properly configured
- `get_email_by_username`, `check_login_rate_limit`, `log_login_attempt`, `create_user_session` all exist in `public` schema
- All use `SECURITY DEFINER` which is correct for bypassing RLS
- Parameter names match the code in `useAuth.ts`
- No `verify_lab_login` RPC exists - the code uses `get_email_by_username` for username-to-email lookup + Supabase Auth

### 2. Security Headers
**Status: PARTIALLY IMPLEMENTED**
- Some edge functions have security headers (health-check, check-alerts, send-sms-notification, send-email-notification)
- Some edge functions are missing or have inconsistent CORS headers
- Need to audit all 14 edge functions for consistent security headers

### 3. Patient Creation
**Status: RLS POLICIES LOOK CORRECT**
- Required fields: `patient_id` (string), `full_name` (string), `phone` (string), `lab_id` (string), `created_by` (string)
- RLS INSERT policy exists with `WITH CHECK` for branch operators
- Code correctly passes all required fields including `lab_id`, `branch_id`, `created_by`
- **Potential issue**: The `patients` table has database-level constraints (phone length, name length, age range, gender values) that might cause 400 errors if validation fails

### 4. Bills-Patients Join
**Status: WORKING** - Foreign key exists
- `bills.patient_id` references `patients.id` via `bills_patient_id_fkey`
- Code correctly uses `patients!bills_patient_id_fkey(...)` hint in queries
- RLS policies allow reading patients if user has access to their branch/organization

---

## Issues Identified

| Issue | Severity | Current State | Action Required |
|-------|----------|--------------|-----------------|
| Missing security headers in some edge functions | Medium | 3 functions missing headers | Standardize all edge functions |
| CORS headers inconsistent | Low | Different patterns used | Standardize CORS config |
| Overly permissive RLS policies | Medium | 10+ policies with `USING (true)` | Review and tighten where needed |
| Database function search_path not set | Low | Linter warning | Add `SET search_path = public` |

---

## Detailed Implementation Plan

### Phase 1: Standardize Edge Function Security Headers

**Files to Update:**
All edge functions need consistent security headers pattern:

```typescript
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

const securityHeaders = {
  'Content-Security-Policy': "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' https:; connect-src 'self' https:;",
  'X-Frame-Options': 'DENY',
  'X-Content-Type-Options': 'nosniff',
  'X-XSS-Protection': '1; mode=block',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
};
```

**Edge Functions Audit:**
| Function | Has CORS | Has Security Headers | Action |
|----------|----------|---------------------|--------|
| admin-update-password | Check | Check | Audit |
| check-alerts | Yes | Yes | OK |
| check-license-expiry | Check | Check | Audit |
| health-check | Yes | Yes | OK |
| monitoring-dashboard | Check | Check | Audit |
| predict-analytics | Check | Check | Audit |
| process-document | Check | Check | Audit |
| run-tests | Check | Check | Audit |
| send-analytics-report | Check | Check | Audit |
| send-email-notification | Yes | Yes | OK |
| send-otp | Check | Check | Audit |
| send-sms-notification | Yes | Yes | OK |
| send-whatsapp-notification | Check | Check | Audit |
| verify-otp | Check | Check | Audit |

### Phase 2: Add Client-Side Form Validation (Patient Creation)

**Problem**: Database constraints may reject data before RLS is evaluated, resulting in 400 errors with cryptic messages.

**Solution**: Add client-side validation matching database constraints:

```typescript
// In AddPatientForm.tsx - validation before submit
const validatePatient = (data: PatientFormData): string[] => {
  const errors: string[] = [];
  
  // Phone: exactly 10 digits
  if (!/^\d{10}$/.test(data.phone)) {
    errors.push('Phone must be exactly 10 digits');
  }
  
  // Name: 2-100 characters
  if (data.full_name.length < 2 || data.full_name.length > 100) {
    errors.push('Name must be 2-100 characters');
  }
  
  // Age: 0-150
  const age = parseInt(data.age);
  if (isNaN(age) || age < 0 || age > 150) {
    errors.push('Age must be between 0 and 150');
  }
  
  // Gender: restricted values
  if (!['MALE', 'FEMALE', 'OTHER'].includes(data.gender)) {
    errors.push('Invalid gender selection');
  }
  
  return errors;
};
```

### Phase 3: Database Migration - Set Function Search Path

**SQL Migration to run:**
```sql
-- Fix function search paths to address linter warnings
ALTER FUNCTION public.get_email_by_username(text) 
  SET search_path = public;

ALTER FUNCTION public.check_login_rate_limit(inet, text) 
  SET search_path = public;

ALTER FUNCTION public.generate_patient_id(uuid, uuid) 
  SET search_path = public;

ALTER FUNCTION public.preview_patient_id(uuid, uuid) 
  SET search_path = public;

ALTER FUNCTION public.log_login_attempt(text, inet, text, boolean, text, uuid)
  SET search_path = public;

ALTER FUNCTION public.create_user_session(uuid, text, inet, text, timestamptz)
  SET search_path = public;

ALTER FUNCTION public.is_super_admin(uuid)
  SET search_path = public;

ALTER FUNCTION public.is_lab_admin(uuid)
  SET search_path = public;

ALTER FUNCTION public.get_user_branch(uuid)
  SET search_path = public;

ALTER FUNCTION public.get_user_lab(uuid)
  SET search_path = public;
```

### Phase 4: Review Overly Permissive RLS Policies

The linter identified 10+ policies using `USING (true)` or `WITH CHECK (true)`. These are intentional for:
- System logging tables (audit_logs, error_logs, endpoint_metrics)
- Feedback submission (anyone can submit)
- Login attempt logging

**Verify these are intentional - no code changes needed if they are for system operations.**

---

## Files to Modify

### Edge Functions (Audit + Update)
1. `supabase/functions/admin-update-password/index.ts`
2. `supabase/functions/check-license-expiry/index.ts`
3. `supabase/functions/monitoring-dashboard/index.ts`
4. `supabase/functions/predict-analytics/index.ts`
5. `supabase/functions/process-document/index.ts`
6. `supabase/functions/run-tests/index.ts`
7. `supabase/functions/send-analytics-report/index.ts`
8. `supabase/functions/send-otp/index.ts`
9. `supabase/functions/send-whatsapp-notification/index.ts`
10. `supabase/functions/verify-otp/index.ts`

### Client-Side Validation
11. `src/components/forms/AddPatientForm.tsx` - Add validation

### Database Migration
12. SQL migration to set search_path on functions

---

## Summary of Findings

| Gap | Status | Resolution |
|-----|--------|------------|
| `verify_lab_login` RPC | Not applicable | App uses `get_email_by_username` + Supabase Auth - already working |
| Security Headers | 4/14 functions verified | Standardize remaining 10 edge functions |
| Patient Creation 400 | Likely validation errors | Add client-side validation for constraints |
| Bills-Patients Join | Already working | FK `bills_patient_id_fkey` exists and is used correctly |

---

## Benefits

1. **Consistent Security** - All edge functions have hardened response headers
2. **Better UX** - Client-side validation catches errors before server round-trip
3. **Linter Clean** - Addresses database function security warnings
4. **Production Ready** - All gaps addressed systematically

