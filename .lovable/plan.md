

# LabFlow API Comprehensive Test Suite

## Overview
Create a production-grade test suite for the LabFlow API that includes automated testing for authentication, CRUD operations, RLS policies, validation, edge cases, and performance metrics. The suite runs as a Supabase Edge Function and returns JSON reports for CI/CD integration.

---

## Architecture

```text
+---------------------------+
|     run-tests Edge Fn     |
+---------------------------+
            |
            v
+---------------------------+
|     Test Runner Core      |
|  - Setup / Cleanup        |
|  - Test Categories        |
|  - Result Aggregation     |
+---------------------------+
            |
    +-------+-------+-------+-------+-------+
    |       |       |       |       |       |
    v       v       v       v       v       v
  Auth    CRUD    RLS   Validate  Edge  Perf
  Tests   Tests   Tests  Tests   Cases  Tests
```

---

## Test Data Fixtures

### Test Lab Configuration (TEST_LAB_001)
```
Organization: TEST_ORG_001
Lab: TEST_LAB_001 (initials: "TL")
Branch: TEST_BRANCH_001 (code: "TB01")
Users:
  - test_super_admin@test.labflow.com (super_admin)
  - test_lab_admin@test.labflow.com (lab_admin)
  - test_operator@test.labflow.com (branch_operator)
  - test_operator_other@test.labflow.com (branch_operator - different lab)
```

### Sample Test Data
- Patient: "TEST PATIENT ONE", phone: "9999999901"
- Bill: Standard test bill with 2 items
- Test Report: CBC test in pending status
- Document: Test PDF document
- Feedback: 5-star test feedback

---

## Test Categories

### 1. Authentication Tests (8 tests)
| Test ID | Description | Expected |
|---------|-------------|----------|
| AUTH_001 | Valid login with username/password | Success, session created |
| AUTH_002 | Invalid username | Error, no session |
| AUTH_003 | Invalid password | Error, attempt logged |
| AUTH_004 | Rate limit after 5 failures | Locked for 15 min |
| AUTH_005 | Token refresh | New expiry timestamp |
| AUTH_006 | Logout single session | Session invalidated |
| AUTH_007 | Logout all sessions | All sessions invalidated |
| AUTH_008 | Expired session access | 401 Unauthorized |

### 2. CRUD Tests (Per Table)
Tables: patients, bills, bill_payments, test_reports, documents, feedback, patient_followups, test_types

| Operation | Tests Per Table |
|-----------|-----------------|
| CREATE | Valid insert, required fields, foreign keys |
| READ | Select by ID, list with filters, pagination |
| UPDATE | Valid update, partial update, timestamp update |
| DELETE | Soft/hard delete, cascade verification |

**Total: ~48 CRUD tests** (6 tests x 8 tables)

### 3. RLS Tests (16 tests)
| Test ID | Description | Expected |
|---------|-------------|----------|
| RLS_001 | Super admin reads all labs | Full access |
| RLS_002 | Lab admin reads own org only | Filtered by org |
| RLS_003 | Operator reads own branch only | Filtered by branch |
| RLS_004 | Cross-tenant patient access | Empty result |
| RLS_005 | Cross-tenant bill access | Empty result |
| RLS_006 | Cross-tenant test report access | Empty result |
| RLS_007 | Cross-tenant document access | Empty result |
| RLS_008 | Cross-tenant followup access | Empty result |
| RLS_009 | Operator cannot delete bills | Permission denied |
| RLS_010 | Lab admin can delete in org | Success |
| RLS_011 | Super admin can manage all | Full CRUD |
| RLS_012 | Anonymous cannot access patients | 401 error |
| RLS_013 | Anonymous cannot access bills | 401 error |
| RLS_014 | Audit log visibility by role | Scoped access |
| RLS_015 | Login attempts view (super only) | Scoped access |
| RLS_016 | Global test types visibility | Public read |

### 4. Validation Tests (20 tests)
| Test ID | Description | Expected |
|---------|-------------|----------|
| VAL_001 | Patient name < 2 chars | Rejected |
| VAL_002 | Phone number != 10 digits | Rejected |
| VAL_003 | Bill total < 0 | Rejected |
| VAL_004 | Invalid email format | Rejected |
| VAL_005 | Missing required lab_id | Rejected |
| VAL_006 | Invalid branch_id FK | FK violation |
| VAL_007 | Invalid patient_id FK | FK violation |
| VAL_008 | Duplicate bill_number | Unique constraint |
| VAL_009 | Duplicate patient_id | Unique constraint |
| VAL_010 | Invalid test status | Check constraint |
| VAL_011 | Bill date in future | Accepted (valid) |
| VAL_012 | Negative payment amount | Rejected |
| VAL_013 | Payment > due amount | Accepted (overpay) |
| VAL_014 | Empty string patient name | Rejected |
| VAL_015 | Whitespace-only fields | Trimmed/rejected |
| VAL_016 | Very long strings (>1000 chars) | Truncated/accepted |
| VAL_017 | Unicode characters in names | Accepted |
| VAL_018 | Special chars in phone | Stripped |
| VAL_019 | HTML in text fields | Stored as-is |
| VAL_020 | JSON injection in JSONB | Parsed/stored |

### 5. Edge Case Tests (15 tests)
| Test ID | Description | Expected |
|---------|-------------|----------|
| EDGE_001 | SQL injection in username | Escaped, no breach |
| EDGE_002 | SQL injection in search | Escaped, no breach |
| EDGE_003 | XSS in patient name | Stored as text |
| EDGE_004 | Null in optional fields | Accepted |
| EDGE_005 | Empty array for bill items | Accepted |
| EDGE_006 | Concurrent bill creation | Sequential numbers |
| EDGE_007 | Concurrent patient ID gen | Sequential IDs |
| EDGE_008 | Zero-amount bill | Accepted |
| EDGE_009 | Past due date | Accepted |
| EDGE_010 | Leap year date handling | Correct |
| EDGE_011 | Timezone edge cases | UTC stored |
| EDGE_012 | Max integer values | Handled |
| EDGE_013 | Delete patient with bills | FK constraint |
| EDGE_014 | Circular FK prevention | Not possible |
| EDGE_015 | Large batch insert (100) | <5s completion |

### 6. Performance Tests (10 tests)
| Test ID | Description | Target |
|---------|-------------|--------|
| PERF_001 | Patient list (1000 rows) | <200ms |
| PERF_002 | Bill search by date range | <200ms |
| PERF_003 | Dashboard stats RPC | <100ms |
| PERF_004 | Patient search by name | <150ms |
| PERF_005 | Outstanding bills query | <200ms |
| PERF_006 | Test reports by status | <200ms |
| PERF_007 | Bill creation transaction | <300ms |
| PERF_008 | Payment insert + update | <200ms |
| PERF_009 | Complex join (bill+patient) | <250ms |
| PERF_010 | Materialized view refresh | <1000ms |

---

## Implementation Details

### File Structure
```
supabase/functions/run-tests/
  index.ts           # Main edge function
  lib/
    test-runner.ts   # Test execution engine
    fixtures.ts      # Test data fixtures
    assertions.ts    # Custom assertion helpers
    cleanup.ts       # Test data cleanup
  tests/
    auth.ts          # Authentication tests
    crud.ts          # CRUD operation tests
    rls.ts           # Row-level security tests
    validation.ts    # Input validation tests
    edge-cases.ts    # Edge case tests
    performance.ts   # Performance benchmark tests
```

### Edge Function Entry Point
```typescript
// Endpoints:
// POST /run-tests - Run all tests
// POST /run-tests?category=auth - Run specific category
// GET /run-tests/coverage - Get test coverage report
// DELETE /run-tests/cleanup - Force cleanup test data
```

### Response Format
```json
{
  "success": true,
  "timestamp": "2026-02-01T12:30:00Z",
  "duration_ms": 15420,
  "summary": {
    "total": 117,
    "passed": 115,
    "failed": 2,
    "skipped": 0
  },
  "categories": {
    "auth": { "passed": 8, "failed": 0, "duration_ms": 1200 },
    "crud": { "passed": 48, "failed": 0, "duration_ms": 5400 },
    "rls": { "passed": 14, "failed": 2, "duration_ms": 3200 },
    "validation": { "passed": 20, "failed": 0, "duration_ms": 2100 },
    "edge_cases": { "passed": 15, "failed": 0, "duration_ms": 1800 },
    "performance": { "passed": 10, "failed": 0, "duration_ms": 1720 }
  },
  "failures": [
    {
      "test_id": "RLS_005",
      "category": "rls",
      "description": "Cross-tenant bill access",
      "expected": "Empty result",
      "actual": "Returned 1 row",
      "error": "RLS policy not filtering correctly"
    }
  ],
  "coverage": {
    "tables_tested": ["patients", "bills", "test_reports", "..."],
    "rpc_functions_tested": ["check_login_rate_limit", "generate_patient_id", "..."],
    "untested_tables": [],
    "coverage_percent": 95.2
  }
}
```

---

## Technical Implementation

### 1. Test Data Isolation
- All test data prefixed with `TEST_` or uses specific test IDs
- Cleanup runs automatically after tests
- Manual cleanup endpoint for stuck test data

### 2. Authentication Simulation
```typescript
// Create test users with service role key
const supabaseAdmin = createClient(url, serviceRoleKey);

// Simulate user auth for RLS testing
const userClient = createClient(url, anonKey, {
  global: { headers: { Authorization: `Bearer ${userToken}` } }
});
```

### 3. Performance Measurement
```typescript
const startTime = performance.now();
await query();
const duration = performance.now() - startTime;
assert(duration < 200, `Query took ${duration}ms, expected <200ms`);
```

### 4. CI/CD Integration
- Webhook-compatible endpoint
- Supports `X-Webhook-Secret` header for security
- Returns non-200 status on failures for CI pipelines

---

## Database Migration

### Test Data Functions
```sql
-- Function to setup test environment
CREATE OR REPLACE FUNCTION setup_test_environment()
RETURNS jsonb SECURITY DEFINER AS $$
  -- Creates TEST_ORG_001, TEST_LAB_001, TEST_BRANCH_001
  -- Creates test users
  -- Returns created IDs for test reference
$$;

-- Function to cleanup test data
CREATE OR REPLACE FUNCTION cleanup_test_environment()
RETURNS void SECURITY DEFINER AS $$
  -- Deletes all records with TEST_ prefix
  -- Removes test users
$$;
```

---

## Configuration

### supabase/config.toml addition
```toml
[functions.run-tests]
verify_jwt = false  # Uses X-Webhook-Secret for auth
```

### Environment Variables
- Uses existing `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY`
- Optional: `TEST_WEBHOOK_SECRET` for CI/CD security

---

## Deliverables

1. **Edge Function**: `supabase/functions/run-tests/index.ts`
   - Main test runner with all categories
   - JSON report generation
   - Webhook support for CI/CD

2. **Database Migration**: Test environment setup/cleanup functions
   - `setup_test_environment()` RPC
   - `cleanup_test_environment()` RPC

3. **Test Coverage Endpoint**:
   - Lists all tables and their test coverage
   - Shows untested areas
   - Generates coverage percentage

4. **Documentation**:
   - Test case descriptions
   - Expected behaviors
   - CI/CD integration guide

---

## Test Execution Flow

```text
1. Request received
      |
2. Validate webhook secret (if provided)
      |
3. Setup test environment
   - Create TEST_ORG_001, TEST_LAB_001, TEST_BRANCH_001
   - Create test users and get auth tokens
      |
4. Run test categories (parallel where safe)
   - Auth tests (sequential - rate limiting)
   - CRUD tests (parallel by table)
   - RLS tests (sequential - user switching)
   - Validation tests (parallel)
   - Edge case tests (parallel)
   - Performance tests (sequential - timing)
      |
5. Aggregate results
      |
6. Cleanup test environment
   - Delete all TEST_ prefixed data
   - Remove test users
      |
7. Return JSON report
```

---

## Security Considerations

1. **Test data isolation**: All test data uses distinct prefixes
2. **No production data access**: Tests only touch TEST_ records
3. **Service role key**: Only used for setup/cleanup
4. **Webhook secret**: Prevents unauthorized test runs
5. **Rate limiting**: Auth tests respect rate limits
6. **Audit logging**: Test actions excluded from audit logs

