
# Fix RLS Policy for Subscriptions Table - Onboarding Wizard

## Problem Summary

When completing the Lab Onboarding Wizard at the final "Subscription" step, clicking "Activate & Complete" fails with the error: **"new row violates row-level security policy for table 'subscriptions'"**.

This happens because the subscriptions table only allows `super_admin` users to insert records, but `lab_admin` users can also access the Super Admin page and run the onboarding wizard.

---

## Root Cause

The `subscriptions` table has an RLS INSERT policy:
```sql
WITH CHECK (is_super_admin(auth.uid()))
```

The `is_super_admin()` function only returns true for users with role `'super_admin'` in the profiles table. However, the Super Admin page allows `lab_admin` users to access the onboarding wizard, creating a mismatch.

---

## Solution Options

### Option A: Update RLS Policy (Recommended)

Create a new database migration to allow both `super_admin` and `lab_admin` roles to manage subscriptions:

```sql
-- Drop existing restrictive policy
DROP POLICY IF EXISTS "Super admins can insert subscriptions" ON subscriptions;

-- Create new policy allowing super_admin and lab_admin
CREATE POLICY "Admins can insert subscriptions" ON subscriptions
  FOR INSERT TO public
  WITH CHECK (
    is_super_admin(auth.uid()) 
    OR 
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.user_id = auth.uid() 
      AND profiles.role = 'lab_admin'
    )
  );

-- Also update SELECT, UPDATE, DELETE policies similarly
DROP POLICY IF EXISTS "Super admins can view all subscriptions" ON subscriptions;
CREATE POLICY "Admins can view subscriptions" ON subscriptions
  FOR SELECT TO public
  USING (
    is_super_admin(auth.uid()) 
    OR 
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.user_id = auth.uid() 
      AND profiles.role = 'lab_admin'
    )
  );

DROP POLICY IF EXISTS "Super admins can update subscriptions" ON subscriptions;
CREATE POLICY "Admins can update subscriptions" ON subscriptions
  FOR UPDATE TO public
  USING (
    is_super_admin(auth.uid()) 
    OR 
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.user_id = auth.uid() 
      AND profiles.role = 'lab_admin'
    )
  );

DROP POLICY IF EXISTS "Super admins can delete subscriptions" ON subscriptions;
CREATE POLICY "Admins can delete subscriptions" ON subscriptions
  FOR DELETE TO public
  USING (
    is_super_admin(auth.uid()) 
    OR 
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.user_id = auth.uid() 
      AND profiles.role = 'lab_admin'
    )
  );
```

### Option B: Create Helper Function

Alternatively, create an `is_admin()` helper function for cleaner policies:

```sql
CREATE OR REPLACE FUNCTION is_admin(user_id uuid)
RETURNS boolean AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.user_id = is_admin.user_id 
    AND role IN ('super_admin', 'lab_admin')
  );
$$ LANGUAGE sql SECURITY DEFINER;
```

Then update policies to use `is_admin(auth.uid())`.

### Option C: Restrict Onboarding to Super Admin Only

If subscriptions should truly only be created by super admins, update the frontend to hide the onboarding wizard from lab_admin users:

In `src/pages/SuperAdmin.tsx`, modify the tab visibility or restrict the "Onboard Lab" tab.

---

## Recommended Approach

**Option A** is recommended because:
1. Lab admins managing their organization's subscriptions is a valid use case
2. It maintains the existing UI/UX flow
3. The security model still restricts access to admin-level roles only

---

## Implementation Steps

1. **Create a new Supabase migration file**:
   - Path: `supabase/migrations/[timestamp]_update_subscriptions_rls_policies.sql`

2. **Add the updated RLS policies** as shown in Option A

3. **Test the fix**:
   - Log in as a lab_admin user
   - Complete the onboarding wizard through all 5 steps
   - Verify subscription is created successfully

---

## Files to Create/Modify

| File | Action |
|------|--------|
| `supabase/migrations/[timestamp]_update_subscriptions_rls_policies.sql` | Create new migration with updated RLS policies |

---

## Security Considerations

- Lab admins will be able to create/view/update/delete subscriptions
- Consider adding additional constraints (e.g., lab admins can only manage subscriptions for their own lab) if stricter isolation is needed
- For stricter control, the policy could include a lab_id check to ensure lab_admins only manage their own lab's subscriptions
