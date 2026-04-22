

# Plan: Fix Follow-up Creation (RLS) + Cleanup Console Errors

## Root Cause: Follow-up 403 Error
The screenshot shows: *"new row violates row-level security policy 'Admins can manage all followups' for table 'patient_followups'"*

The INSERT policy requires: `EXISTS (SELECT 1 FROM profiles WHERE user_id = assigned_to AND lab_id = <my lab>)`. Because the **profiles SELECT policy** only lets operators see *their own* profile, this `EXISTS` check returns false whenever an operator assigns the follow-up to someone else (e.g. the lab admin) → 403.

## Fix 1: Allow Lab Members to See Each Other (Migration)

Add a profiles SELECT policy so any authenticated user can see basic info of other profiles **in the same lab** (needed for assignee dropdowns, team listings, etc.).

```sql
CREATE POLICY "Users can view profiles in their lab"
ON public.profiles FOR SELECT
TO authenticated
USING (lab_id IS NOT NULL AND lab_id = get_user_lab(auth.uid()));
```

This:
- Lets operators see the lab_admin and other operators in their lab → fixes the EXISTS check in the followups INSERT policy → no more 403
- Keeps cross-lab isolation intact (other labs still hidden)
- Profile rows contain no secret data (no password hashes etc.)

## Fix 2: OperatorSelect 400 Error
`src/components/forms/OperatorSelect.tsx` sends `user_id=not.eq.&` (empty value) which Supabase rejects with 400. Remove the `.not('user_id', 'eq', '')` filter — the empty string comparison is invalid for UUID columns and the client-side `.filter(op => op.user_id && op.user_id.trim() !== '')` already handles it.

## Fix 3: Bills Search 400 Error
In the dashboard bills query, `or=(patients.full_name.ilike.%X%)` fails because PostgREST can't apply `or()` to an embedded relation column directly. Fix the bills search to:
- Either filter on the **inner join** using `.ilike('patients.full_name', ...)` with `patients!inner(...)`, OR
- Pre-fetch matching patient IDs and use `.in('patient_id', ids)`

I'll locate the exact file (likely `src/components/dashboard/BillsTable.tsx` or a hook) and apply the inner-join approach so the search works.

## Files Changed

| File | Change |
|------|--------|
| `supabase/migrations/<new>.sql` | Add lab-scoped SELECT policy on `profiles` |
| `src/components/forms/OperatorSelect.tsx` | Remove invalid `.not('user_id','eq','')` filter |
| Bills search query file | Fix `or()` on embedded patients column → use `patients!inner` + `ilike` |

## Out of Scope (Noted but Not Fixed Here)
- "Missing Description for DialogContent" warnings — accessibility only, non-blocking
- i18next/PWA install banner notices — informational

