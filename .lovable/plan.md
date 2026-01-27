
# Fix Login Issues for Newly Created Lab Users

## Problem Summary

After completing the Lab Onboarding Wizard, users cannot log in with the password set during onboarding, and even after super admin changes the password, login may still fail due to **case-sensitive username matching**.

---

## Root Cause Analysis

### Issue 1: Case-Sensitive Username Lookup
The `get_email_by_username` database function performs an **exact case-sensitive match**:
```sql
WHERE username = input_username
```

**Example:**
- Stored username: `metropolis_labs` (lowercase)
- User types: `Metropolis_Labs` → Returns NULL → "Invalid username or password"

### Issue 2: Password Set During Onboarding
During onboarding (Step 4), the password is set via `supabase.auth.signUp()`. This works correctly, but since the **user was created from the super admin's session**, the admin might need to log in as the new user separately to verify.

### Verification Results
- User `admin@1.com` (username: `metropolis_labs`) exists with confirmed email
- Password change from super admin at 10:10:55Z was **successful** (auth logs confirm)
- Username lookup with exact match works: `get_email_by_username('metropolis_labs')` → `admin@1.com`
- Username lookup with different case fails: `get_email_by_username('Metropolis_Labs')` → NULL

---

## Solution

### Database Migration: Make Username Lookup Case-Insensitive

Update the `get_email_by_username` function to use case-insensitive matching:

```sql
CREATE OR REPLACE FUNCTION public.get_email_by_username(input_username text)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  user_email text;
BEGIN
  SELECT email INTO user_email
  FROM profiles
  WHERE LOWER(username) = LOWER(input_username);
  
  RETURN user_email;
END;
$$;
```

---

## Implementation Steps

1. **Create new database migration** to update the `get_email_by_username` function with case-insensitive matching using `LOWER()` on both sides of the comparison

2. **Test login** with the following credentials:
   - Username: `metropolis_labs` (or any case variation like `Metropolis_Labs`)
   - Password: `11223344` (the password set by super admin)

---

## Files to Modify

| File | Action |
|------|--------|
| `supabase/migrations/[timestamp]_fix_username_case_sensitivity.sql` | Create migration with case-insensitive username lookup |

---

## Why This Works

- Users can enter their username in any case (e.g., `SuperAdmin`, `superadmin`, `SUPERADMIN`)
- The system will match it against the stored lowercase username
- This is a common UX best practice for login forms

---

## Additional Notes

- The password change from super admin **did work** - the auth logs confirm the modification was successful
- The user should be able to log in now with username `metropolis_labs` (exact lowercase) and password `11223344`
- After the fix, any case variation of the username will work
