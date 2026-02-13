

## Fix: BizFlow CRM "Function Not Found" Error

### Root Cause

When calling a Supabase Edge Function hosted on a **different Supabase project**, the request must include that project's **anon key** in the `apikey` header. Without it, Supabase's API gateway cannot route the request and returns a generic `404 NOT_FOUND` response -- even if the function exists and is deployed.

Our current code only sends `Content-Type` and `x-public-api-key`, but is missing the BizFlow project's `apikey` header.

### Solution

1. **Add a new secret** `BIZFLOW_SUPABASE_ANON_KEY` containing the BizFlow project's Supabase anon/publishable key (this is the public key for project `gcyrapukltxjohjfxgza`).

2. **Update the edge function** `supabase/functions/submit-crm-inquiry/index.ts` to include the `apikey` header when calling the remote endpoint:

```text
Current headers sent:
  - Content-Type: application/json
  - x-public-api-key: <BIZFLOW_API_KEY>

Updated headers:
  - Content-Type: application/json
  - x-public-api-key: <BIZFLOW_API_KEY>
  - apikey: <BIZFLOW_SUPABASE_ANON_KEY>
  - Authorization: Bearer <BIZFLOW_SUPABASE_ANON_KEY>
```

### Technical Details

**File: `supabase/functions/submit-crm-inquiry/index.ts`**

Update the `fetch` call (around line 45-52) to read the new secret and include it in the outgoing request headers:

```typescript
const bizflowAnonKey = Deno.env.get("BIZFLOW_SUPABASE_ANON_KEY");

const response = await fetch(BIZFLOW_API_URL, {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "x-public-api-key": apiKey,
    "apikey": bizflowAnonKey,
    "Authorization": `Bearer ${bizflowAnonKey}`,
  },
  body: JSON.stringify(payload),
});
```

### Steps

1. Add the `BIZFLOW_SUPABASE_ANON_KEY` secret (you will need to provide the anon key from the BizFlow Supabase project)
2. Update the edge function to include the `apikey` and `Authorization` headers
3. Deploy and test the updated function

### What You Need

The **Supabase anon/publishable key** for the BizFlow project (`gcyrapukltxjohjfxgza`). This is typically found in:
- BizFlow Supabase Dashboard -> Settings -> API -> `anon` `public` key
- It usually starts with `eyJhbGciOi...`

