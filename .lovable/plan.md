

# What Can Be Improved in LabFlow

Based on my analysis of the codebase, security scan, and database linter, here are the key areas for improvement, ranked by priority.

---

## 1. Security Issues (Critical)

### A. 11 Overly Permissive RLS Policies
Multiple tables have `USING (true)` or `WITH CHECK (true)` on INSERT/UPDATE/DELETE operations. This means **any authenticated user can modify any row** in those tables, regardless of which lab they belong to. These need to be tightened to filter by `lab_id` using `get_current_lab_id()`.

### B. 2 Functions Missing `search_path`
Two database functions don't set `search_path = public`, making them vulnerable to search path injection attacks. They need `SET search_path = public` added.

### C. Leaked Password Protection Disabled
Supabase's built-in leaked password protection is turned off. Enable it in the Supabase dashboard under Auth > Settings.

### D. OTP Expiry Too Long
The OTP expiry window exceeds the recommended threshold. Reduce it in Auth settings.

### E. Postgres Version Needs Upgrade
Security patches are available for the current Postgres version.

---

## 2. Auth Session Error (Active Bug)

The console shows `AuthApiError: Invalid Refresh Token: Refresh Token Not Found`. The `useAuth` hook doesn't gracefully handle expired/invalid refresh tokens. When this error occurs, the app should automatically clear the stale session and redirect to `/auth` instead of leaving the user in a broken state.

**Fix:** Add error handling in the `onAuthStateChange` listener to catch `refresh_token_not_found` and call `signOut()`.

---

## 3. Type Safety

Throughout the codebase, `any` types are used extensively:
- `supabase.from("samples" as any) as any` -- the `samples` table isn't in the generated types
- `DataTabs` props use `any[]` for all data arrays
- `SampleTrackingTab` uses `(sample as any).patients?.full_name`

**Fix:** Regenerate the Supabase types to include the `samples` table, then replace `any` with proper types.

---

## 4. Missing Features for Production Readiness

### A. Dark Mode Support for Dashboard
The app has `ThemeProvider` with `next-themes` but the dashboard components don't appear to be styled for dark mode.

### B. Error Boundaries
No React error boundaries exist. A crash in one component takes down the whole page.

### C. Offline/PWA Improvements
The service worker is registered but there's no offline fallback UI or caching strategy for API data.

### D. Real-time Updates
Sample status changes by one operator aren't visible to others without manual refresh. Supabase Realtime subscriptions on the `samples` table would fix this.

---

## 5. Performance

### A. Dashboard Over-fetching
The Dashboard component creates **8 separate queries** on mount, regardless of which tab is active. Only the active tab's data should be fetched eagerly; others should load on tab switch.

### B. Patient Search in AddSampleForm
`fetchTestTypes` loads up to 500 patients on dialog open. This should use a server-side search with debounce instead.

---

## Summary of Recommended Actions

| Priority | Item | Effort |
|----------|------|--------|
| Critical | Fix 11 permissive RLS policies | Medium |
| Critical | Enable leaked password protection | Quick (dashboard toggle) |
| High | Handle expired refresh tokens gracefully | Small code change |
| High | Fix function search_path settings | Quick SQL migration |
| Medium | Regenerate Supabase types for `samples` table | Small |
| Medium | Add React error boundaries | Small |
| Medium | Lazy-load inactive tab data | Medium |
| Low | Add Supabase Realtime for samples | Medium |
| Low | Upgrade Postgres version | Quick (dashboard) |
| Low | Reduce OTP expiry | Quick (dashboard) |

Would you like me to tackle any of these? I'd recommend starting with the **security fixes** (RLS policies + auth error handling) as they are the most impactful.

