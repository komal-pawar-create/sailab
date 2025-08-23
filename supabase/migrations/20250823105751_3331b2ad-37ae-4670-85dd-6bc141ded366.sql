-- Step 9: Create RLS policies for organizations
CREATE POLICY "Super admins can manage all organizations"
ON public.organizations
FOR ALL
USING (is_super_admin(auth.uid()))
WITH CHECK (is_super_admin(auth.uid()));

CREATE POLICY "Lab admins can view their organization"
ON public.organizations
FOR SELECT
USING (id = get_user_organization(auth.uid()));

-- Step 10: Create RLS policies for branches
CREATE POLICY "Super admins can manage all branches"
ON public.branches
FOR ALL
USING (is_super_admin(auth.uid()))
WITH CHECK (is_super_admin(auth.uid()));

CREATE POLICY "Lab admins can manage their organization branches"
ON public.branches
FOR ALL
USING (organization_id = get_user_organization(auth.uid()))
WITH CHECK (organization_id = get_user_organization(auth.uid()));

CREATE POLICY "Branch operators can view their branch"
ON public.branches
FOR SELECT
USING (id = get_user_branch(auth.uid()));

-- Step 11: Update existing RLS policies for multi-tenant access

-- Drop existing policies for labs table
DROP POLICY IF EXISTS "Admins can delete labs" ON public.labs;
DROP POLICY IF EXISTS "Admins can insert labs" ON public.labs;
DROP POLICY IF EXISTS "Admins can update labs" ON public.labs;
DROP POLICY IF EXISTS "Admins can view all labs" ON public.labs;
DROP POLICY IF EXISTS "Operators can view their lab" ON public.labs;

-- Create new policies for labs table
CREATE POLICY "Super admins can manage all labs"
ON public.labs
FOR ALL
USING (is_super_admin(auth.uid()))
WITH CHECK (is_super_admin(auth.uid()));

CREATE POLICY "Lab admins can manage their organization labs"
ON public.labs
FOR ALL
USING (organization_id = get_user_organization(auth.uid()))
WITH CHECK (organization_id = get_user_organization(auth.uid()));

CREATE POLICY "Branch operators can view labs in their organization"
ON public.labs
FOR SELECT
USING (organization_id = get_user_organization(auth.uid()));

-- Step 12: Update profiles policies
DROP POLICY IF EXISTS "Admins can update any profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;

CREATE POLICY "Super admins can manage all profiles"
ON public.profiles
FOR ALL
USING (is_super_admin(auth.uid()))
WITH CHECK (is_super_admin(auth.uid()));

CREATE POLICY "Lab admins can manage profiles in their organization"
ON public.profiles
FOR ALL
USING (
  CASE 
    WHEN branch_id IS NULL THEN false
    ELSE EXISTS (
      SELECT 1 FROM public.branches b 
      WHERE b.id = profiles.branch_id 
      AND b.organization_id = get_user_organization(auth.uid())
    )
  END
)
WITH CHECK (
  CASE 
    WHEN branch_id IS NULL THEN false
    ELSE EXISTS (
      SELECT 1 FROM public.branches b 
      WHERE b.id = profiles.branch_id 
      AND b.organization_id = get_user_organization(auth.uid())
    )
  END
);

-- Step 13: Update data table policies for branch-based access
-- Drop and recreate policies for patients
DROP POLICY IF EXISTS "Admins can view all patients" ON public.patients;
DROP POLICY IF EXISTS "Operators can view patients from their lab" ON public.patients;

CREATE POLICY "Super admins can manage all patients"
ON public.patients
FOR ALL
USING (is_super_admin(auth.uid()))
WITH CHECK (is_super_admin(auth.uid()));

CREATE POLICY "Lab admins can manage patients in their organization"
ON public.patients
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.branches b 
    WHERE b.id = patients.branch_id 
    AND b.organization_id = get_user_organization(auth.uid())
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.branches b 
    WHERE b.id = patients.branch_id 
    AND b.organization_id = get_user_organization(auth.uid())
  )
);

CREATE POLICY "Branch operators can manage patients in their branch"
ON public.patients
FOR ALL
USING (branch_id = get_user_branch(auth.uid()))
WITH CHECK (branch_id = get_user_branch(auth.uid()));

-- Update test reports policies
DROP POLICY IF EXISTS "Admins can view all reports" ON public.test_reports;
DROP POLICY IF EXISTS "Operators can view reports from their lab" ON public.test_reports;

CREATE POLICY "Super admins can manage all test reports"
ON public.test_reports
FOR ALL
USING (is_super_admin(auth.uid()));

CREATE POLICY "Lab admins can manage test reports in their organization"
ON public.test_reports
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.branches b 
    WHERE b.id = test_reports.branch_id 
    AND b.organization_id = get_user_organization(auth.uid())
  )
);

CREATE POLICY "Branch operators can manage test reports in their branch"
ON public.test_reports
FOR ALL
USING (branch_id = get_user_branch(auth.uid()));

-- Update existing functions to have secure search_path
CREATE OR REPLACE FUNCTION public.has_role(user_id uuid, required_role user_role)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.user_id = has_role.user_id AND role = required_role
  )
$$;

CREATE OR REPLACE FUNCTION public.get_user_lab(user_id uuid)
RETURNS uuid
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT lab_id FROM public.profiles WHERE profiles.user_id = get_user_lab.user_id
$$;