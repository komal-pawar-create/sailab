
# RLS Policy Audit and Strengthening Plan

## Executive Summary
Comprehensive security audit and enhancement of Row Level Security (RLS) policies across all LabFlow tables. This plan standardizes multi-tenant isolation, prevents lab_id tampering, creates reusable helper functions, and ensures compliance-ready audit logging.

---

## Current State Analysis

### Existing Security Infrastructure (Already Implemented)
| Component | Status | Notes |
|-----------|--------|-------|
| **audit_logs table** | Exists | Created with triggers on patients, bills, bill_payments, test_reports, profiles |
| **get_user_lab()** | Exists | Returns lab_id from profiles table |
| **get_user_branch()** | Exists | Returns branch_id from profiles table |
| **get_user_organization()** | Exists | Returns organization_id via branch join |
| **is_super_admin()** | Exists | Checks for super_admin role |
| **is_lab_admin()** | Exists | Checks for lab_admin OR admin role |
| **has_role()** | Exists | Generic role check function |
| **ensure_lab_id_matches_branch()** | Exists | Trigger to auto-set lab_id from branch |

### Identified Gaps and Issues

1. **No `get_current_lab_id()` convenience function** - Would simplify policy definitions
2. **Missing UPDATE protection against lab_id modification** - Users could potentially change lab_id
3. **Inconsistent DELETE policies** - Some tables allow delete, others don't
4. **test_types table lacks lab_id isolation** - Uses branch_id only, not lab_id
5. **profiles table missing lab_id constraint** - Can view profiles without lab context
6. **No explicit check preventing lab_id changes on UPDATE**

---

## Proposed Changes

### 1. Create `get_current_lab_id()` Helper Function

A convenience wrapper that gets the current user's lab_id directly from their session:

```sql
CREATE OR REPLACE FUNCTION public.get_current_lab_id()
RETURNS uuid
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT lab_id FROM public.profiles 
  WHERE user_id = auth.uid()
$$;
```

**Benefits:**
- Cleaner policy definitions: `lab_id = get_current_lab_id()`
- Consistent with existing `get_user_lab()` pattern
- Avoids passing `auth.uid()` repeatedly

---

### 2. Create `prevent_lab_id_change()` Trigger Function

Prevents unauthorized modification of lab_id on UPDATE:

```sql
CREATE OR REPLACE FUNCTION public.prevent_lab_id_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Super admins can change lab_id for data migration
  IF is_super_admin(auth.uid()) THEN
    RETURN NEW;
  END IF;
  
  -- Prevent lab_id changes for non-super-admins
  IF OLD.lab_id IS DISTINCT FROM NEW.lab_id THEN
    RAISE EXCEPTION 'Changing lab_id is not permitted';
  END IF;
  
  RETURN NEW;
END;
$$;
```

**Apply to tables:** patients, bills, test_reports, documents, feedback, patient_followups

---

### 3. Standardize RLS Policies Per Table

#### **patients Table**
Current policies are correct but need lab_id change protection:

| Operation | Policy | Notes |
|-----------|--------|-------|
| SELECT | Super admins: all, Lab admins: organization, Branch ops: own branch | Exists |
| INSERT | Verify lab_id matches user's lab | Exists via trigger |
| UPDATE | Same as SELECT, plus prevent lab_id change | Add trigger |
| DELETE | Only super_admin or lab_admin | Confirm exists |

#### **bills Table**
| Operation | Current | Enhancement |
|-----------|---------|-------------|
| SELECT | Correct | No change |
| INSERT | Correct | No change |
| UPDATE | Missing lab_id protection | Add prevent_lab_id_change trigger |
| DELETE | Implicit via FOR ALL | No change |

#### **test_reports Table**
| Operation | Current | Enhancement |
|-----------|---------|-------------|
| SELECT | Correct | No change |
| INSERT | Correct | No change |
| UPDATE | Missing lab_id protection | Add prevent_lab_id_change trigger |
| DELETE | Implicit via FOR ALL | No change |

#### **test_types Table** (Needs Attention)
Current policies use branch_id but table has lab_id column:

| Operation | Current Issue | Fix |
|-----------|---------------|-----|
| SELECT | Uses branch_id only | Add lab_id = get_current_lab_id() alternative |
| INSERT | Missing lab_id check | Verify lab_id matches user's lab |
| UPDATE | No protection | Add prevent_lab_id_change trigger |
| DELETE | Implicit | No change |

#### **documents Table**
| Operation | Current | Enhancement |
|-----------|---------|-------------|
| All | Correct | Add prevent_lab_id_change trigger |

#### **patient_followups Table**
| Operation | Current | Enhancement |
|-----------|---------|-------------|
| All | Correct | Add prevent_lab_id_change trigger |

#### **branches Table**
Current policies are correct:
- Super admins: manage all
- Lab admins: manage organization branches
- Branch operators: view own branch only

#### **profiles Table** (Special Case)
Roles are stored in the profiles table. Current policies:
- Super admins: manage all
- Lab admins: manage profiles in organization
- Users: view own profile

**Note:** Per security guidelines, roles should ideally be in a separate `user_roles` table. However, migrating to a new structure is a significant change. The existing RLS with SECURITY DEFINER functions (`is_super_admin`, `is_lab_admin`) provides protection against privilege escalation.

---

### 4. Labs Table RLS Enhancement

Current policies allow labs to see their organization's labs. Enhancement:

```sql
-- Add explicit policy for lab admins to see only their assigned lab for non-super-admins
CREATE POLICY "Users can only view their own lab"
ON public.labs
FOR SELECT
USING (
  id = get_current_lab_id()
  OR is_lab_admin(auth.uid())  -- Lab admins see org labs
  OR is_super_admin(auth.uid()) -- Super admins see all
);
```

---

### 5. Audit Logs Table Enhancement

Current implementation is solid. Minor enhancements:

1. **Add branch operator view policy** (currently only super_admin and lab_admin can view):

```sql
CREATE POLICY "Branch operators can view logs from their branch"
ON public.audit_logs
FOR SELECT
USING (
  branch_id = get_user_branch(auth.uid())
);
```

2. **Ensure no UPDATE/DELETE policies** (audit logs should be immutable):
- Confirm no UPDATE policies exist
- Confirm no DELETE policies exist (except super_admin cleanup)

---

### 6. SECURITY DEFINER Functions for Admin Operations

Existing admin functions that use SECURITY DEFINER:
- `log_audit_event()` - Inserts audit logs
- `clear_lab_data()` - Data cleanup (super_admin only)
- `generate_patient_id()` - ID generation
- `check_login_rate_limit()` - Rate limiting
- `log_login_attempt()` - Login tracking

**New admin function needed:**

```sql
CREATE OR REPLACE FUNCTION public.admin_change_user_lab(
  p_target_user_id uuid,
  p_new_lab_id uuid,
  p_new_branch_id uuid
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only super admins can reassign users
  IF NOT is_super_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Only super admins can reassign users to different labs';
  END IF;
  
  UPDATE profiles
  SET lab_id = p_new_lab_id,
      branch_id = p_new_branch_id
  WHERE user_id = p_target_user_id;
  
  -- Log the change
  PERFORM log_audit_event(
    'USER_LAB_CHANGE',
    'profiles',
    (SELECT id FROM profiles WHERE user_id = p_target_user_id),
    jsonb_build_object('old_lab_id', get_user_lab(p_target_user_id)),
    jsonb_build_object('new_lab_id', p_new_lab_id, 'new_branch_id', p_new_branch_id)
  );
  
  RETURN true;
END;
$$;
```

---

## Implementation Summary

### Database Migration Contents

```text
1. Helper Functions:
   - get_current_lab_id()
   - prevent_lab_id_change()
   - admin_change_user_lab()

2. Triggers for lab_id Protection:
   - patients: prevent_lab_id_change
   - bills: prevent_lab_id_change
   - test_reports: prevent_lab_id_change
   - documents: prevent_lab_id_change
   - feedback: prevent_lab_id_change
   - patient_followups: prevent_lab_id_change

3. RLS Policy Updates:
   - test_types: Add lab_id-based policies
   - audit_logs: Add branch operator view policy

4. Policy Verification Queries:
   - Test each policy with different auth contexts
```

---

## Tables Summary

| Table | SELECT | INSERT | UPDATE | DELETE | Lab_id Protection |
|-------|--------|--------|--------|--------|-------------------|
| patients | Super/Lab/Branch | Branch | Branch + Trigger | Lab Admin+ | Trigger |
| bills | Super/Lab/Branch | Branch | Branch + Trigger | Lab Admin+ | Trigger |
| test_reports | Super/Lab/Branch | Branch | Branch + Trigger | Lab Admin+ | Trigger |
| test_types | Super/Lab/Branch | Branch | Branch + Trigger | Lab Admin+ | Trigger (new) |
| documents | Super/Lab/Branch | Branch | Branch + Trigger | Lab Admin+ | Trigger |
| patient_followups | Lab | Lab | Creator/Assignee | Admin only | Trigger |
| feedback | Super/Lab/Branch | Anyone | Branch | Lab Admin+ | Trigger |
| branches | Super/Lab/Branch(view) | Lab Admin+ | Lab Admin+ | Super only | N/A |
| profiles | Super/Lab/Own | System | Super/Own | Super only | N/A |
| labs | Super/Org | Super | Super/Lab Admin | Super only | N/A |
| audit_logs | Super/Lab/Branch | System | None | None | N/A |

---

## Testing Strategy

After implementation, verify with these test scenarios:

1. **Branch Operator Tests:**
   - Can only see data from own branch
   - Cannot modify lab_id on any record
   - Cannot see other branches' data

2. **Lab Admin Tests:**
   - Can see all data within organization
   - Cannot see data from other organizations
   - Cannot modify lab_id without super_admin

3. **Super Admin Tests:**
   - Can see all data
   - Can modify lab_id for data migration
   - Can run admin functions

4. **Audit Log Tests:**
   - All CRUD operations logged
   - Logs cannot be modified
   - Branch operators can see own branch logs

---

## Files to Modify/Create

| File | Action | Purpose |
|------|--------|---------|
| `supabase/migrations/[timestamp]_rls_hardening.sql` | Create | All security enhancements |

---

## Security Compliance Notes

1. **HIPAA/GDPR Alignment:** Audit logs retained for 7 years per existing policy
2. **Multi-tenant Isolation:** All tables filter by lab_id or branch_id
3. **Privilege Escalation Prevention:** SECURITY DEFINER functions with explicit search_path
4. **Data Immutability:** Audit logs cannot be modified or deleted by regular users
5. **Role-based Access:** Three-tier access (super_admin > lab_admin > branch_operator)
