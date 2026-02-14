

## Fix BizFlow CRM Integration Based on Official API Docs

### Problem
Lead/inquiry submissions return "404 - Requested function was not found" when calling the BizFlow CRM endpoint.

### Root Cause (from API documentation analysis)
The official BizFlow API docs specify only two required headers: `apikey` and `x-public-api-key`. Our edge function sends an extra `Authorization: Bearer ...` header that is not documented and may interfere with Supabase's API gateway routing.

Additionally, the stored secret values may not match the exact credentials from the documentation.

### Changes Required

**1. Update the `BIZFLOW_SUPABASE_ANON_KEY` secret**

Ensure the stored value exactly matches the anon key from the official docs:
```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdjeXJhcHVrbHR4am9oamZ4Z3phIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjgzMDg3NTksImV4cCI6MjA4Mzg4NDc1OX0.tvwOyTOvbynPjLKp1H8GDUit2g820bvhg5419wFvY4Y
```

**2. Update edge function `supabase/functions/submit-crm-inquiry/index.ts`**

Remove the `Authorization` header (not in the API docs) and keep only the two documented headers:

```text
Before:
  headers: {
    "Content-Type": "application/json",
    "x-public-api-key": apiKey,
    "apikey": bizflowAnonKey,
    "Authorization": `Bearer ${bizflowAnonKey}`,   <-- REMOVE
  }

After:
  headers: {
    "Content-Type": "application/json",
    "apikey": bizflowAnonKey,
    "x-public-api-key": apiKey,
  }
```

**3. Deploy and test**

- Redeploy the edge function
- Test with a sample submission to confirm a 201 success response

### Technical Details

**File:** `supabase/functions/submit-crm-inquiry/index.ts`
- Line 52: Remove the `Authorization` header line
- Lines 48-53: Reorder headers to match the docs (`apikey` first, then `x-public-api-key`)

The rest of the function logic (payload building, `company_name` merging into `message`, error handling) is correct per the API spec.

### Summary of API Spec Compliance

| Aspect | Current | Required (from docs) | Action |
|--------|---------|---------------------|--------|
| Endpoint URL | Correct | Correct | None |
| `apikey` header | Sent | Required | Verify secret value |
| `x-public-api-key` header | Sent | Required | Verify secret value |
| `Authorization` header | Sent | Not documented | Remove |
| Payload fields | Correct | Correct | None |
| `company_name` handling | Merged into message | Not accepted as field | Correct |

