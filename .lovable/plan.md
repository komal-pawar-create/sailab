
## Fix Console Warnings and CRM 409 Error Handling

### Issues Identified

1. **CRM API 409 "Conflict" Error** -- When a lead with the same phone number already exists in BizFlow CRM, the API returns HTTP 409. The current edge function treats this as a generic error, showing "CRM API returned 409" in a toast -- confusing and unhelpful for users.

2. **"Missing Description" Warning for DialogContent** -- The `InquiryDialog` only renders `DialogDescription` when the `description` prop is passed. Many callers don't pass it, triggering the Radix UI accessibility warning.

3. **Preloaded Resources Not Used** -- `index.html` preloads 3 resources (2 font files + dots.svg pattern) that may not be consumed quickly enough on all routes, causing browser warnings.

---

### Changes

#### 1. Handle 409 gracefully in edge function (`supabase/functions/submit-crm-inquiry/index.ts`)
- Detect `response.status === 409` specifically
- Return a friendly message: "We already have your inquiry! Our team will contact you shortly."
- Mark it as `success: true` from the user's perspective (their info is already captured)

#### 2. Handle 409 on client side (`src/lib/api.ts`)
- No changes needed if the edge function returns `success: true` for 409

#### 3. Always render DialogDescription (`src/components/InquiryDialog.tsx`)
- Add a default `DialogDescription` with `sr-only` class when no description prop is provided, satisfying the accessibility requirement without changing the visual layout

#### 4. Remove unnecessary font preloads (`index.html`)
- Remove the two `<link rel="preload">` tags for specific Google Fonts woff2 files (lines 22-23) -- the browser already loads them via the `<link rel="stylesheet">` on line 29
- Change the dots.svg preload (line 26) from `preload` to `prefetch` since it's a background decoration, not critical for first paint

---

### Summary

| File | Change |
|------|--------|
| `supabase/functions/submit-crm-inquiry/index.ts` | Handle 409 as a friendly "already received" success |
| `src/components/InquiryDialog.tsx` | Always render a DialogDescription (visually hidden default) |
| `index.html` | Remove font preloads, change dots.svg to prefetch |
