-- Step 1: Update user_role enum to include new roles
ALTER TYPE public.user_role ADD VALUE IF NOT EXISTS 'super_admin';
ALTER TYPE public.user_role ADD VALUE IF NOT EXISTS 'lab_admin';
ALTER TYPE public.user_role ADD VALUE IF NOT EXISTS 'branch_operator';

-- Step 2: Create organizations table
CREATE TABLE public.organizations (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    contact_email TEXT,
    contact_phone TEXT,
    address_line1 TEXT,
    address_line2 TEXT,
    city TEXT,
    state TEXT,
    postal_code TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    created_by UUID NOT NULL
);

-- Step 3: Create branches table
CREATE TABLE public.branches (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    organization_id UUID NOT NULL,
    lab_id UUID,
    location TEXT,
    address_line1 TEXT,
    address_line2 TEXT,
    city TEXT,
    state TEXT,
    postal_code TEXT,
    phone TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    created_by UUID NOT NULL,
    CONSTRAINT fk_branches_organization FOREIGN KEY (organization_id) REFERENCES public.organizations(id) ON DELETE CASCADE,
    CONSTRAINT fk_branches_lab FOREIGN KEY (lab_id) REFERENCES public.labs(id) ON DELETE CASCADE
);

-- Step 4: Add organization_id to labs table
ALTER TABLE public.labs ADD COLUMN IF NOT EXISTS organization_id UUID;
ALTER TABLE public.labs ADD CONSTRAINT fk_labs_organization FOREIGN KEY (organization_id) REFERENCES public.organizations(id) ON DELETE CASCADE;

-- Step 5: Add branch_id to profiles table
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS branch_id UUID;
ALTER TABLE public.profiles ADD CONSTRAINT fk_profiles_branch FOREIGN KEY (branch_id) REFERENCES public.branches(id) ON DELETE SET NULL;

-- Step 6: Add branch_id to all data tables
ALTER TABLE public.patients ADD COLUMN IF NOT EXISTS branch_id UUID;
ALTER TABLE public.patients ADD CONSTRAINT fk_patients_branch FOREIGN KEY (branch_id) REFERENCES public.branches(id) ON DELETE CASCADE;

ALTER TABLE public.test_reports ADD COLUMN IF NOT EXISTS branch_id UUID;
ALTER TABLE public.test_reports ADD CONSTRAINT fk_test_reports_branch FOREIGN KEY (branch_id) REFERENCES public.branches(id) ON DELETE CASCADE;

ALTER TABLE public.documents ADD COLUMN IF NOT EXISTS branch_id UUID;
ALTER TABLE public.documents ADD CONSTRAINT fk_documents_branch FOREIGN KEY (branch_id) REFERENCES public.branches(id) ON DELETE CASCADE;

ALTER TABLE public.feedback ADD COLUMN IF NOT EXISTS branch_id UUID;
ALTER TABLE public.feedback ADD CONSTRAINT fk_feedback_branch FOREIGN KEY (branch_id) REFERENCES public.branches(id) ON DELETE CASCADE;

ALTER TABLE public.bills ADD COLUMN IF NOT EXISTS branch_id UUID;
ALTER TABLE public.bills ADD CONSTRAINT fk_bills_branch FOREIGN KEY (branch_id) REFERENCES public.branches(id) ON DELETE CASCADE;

ALTER TABLE public.bill_payments ADD COLUMN IF NOT EXISTS branch_id UUID;
ALTER TABLE public.bill_payments ADD CONSTRAINT fk_bill_payments_branch FOREIGN KEY (branch_id) REFERENCES public.branches(id) ON DELETE CASCADE;

ALTER TABLE public.patient_followups ADD COLUMN IF NOT EXISTS branch_id UUID;
ALTER TABLE public.patient_followups ADD CONSTRAINT fk_patient_followups_branch FOREIGN KEY (branch_id) REFERENCES public.branches(id) ON DELETE CASCADE;

-- Step 7: Enable RLS on new tables
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.branches ENABLE ROW LEVEL SECURITY;

-- Step 8: Create helper functions for new role system
CREATE OR REPLACE FUNCTION public.get_user_organization(user_id uuid)
RETURNS uuid
LANGUAGE sql
STABLE SECURITY DEFINER
AS $$
  SELECT o.id FROM public.organizations o
  JOIN public.branches b ON b.organization_id = o.id
  JOIN public.profiles p ON p.branch_id = b.id
  WHERE p.user_id = get_user_organization.user_id
  LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION public.get_user_branch(user_id uuid)
RETURNS uuid
LANGUAGE sql
STABLE SECURITY DEFINER
AS $$
  SELECT branch_id FROM public.profiles WHERE profiles.user_id = get_user_branch.user_id;
$$;

CREATE OR REPLACE FUNCTION public.is_super_admin(user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.user_id = is_super_admin.user_id AND role = 'super_admin'
  );
$$;

CREATE OR REPLACE FUNCTION public.is_lab_admin(user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.user_id = is_lab_admin.user_id AND role = 'lab_admin'
  );
$$;

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

-- Apply similar pattern to all other data tables
-- Test reports
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

-- Add triggers for updated_at columns
CREATE TRIGGER update_organizations_updated_at
BEFORE UPDATE ON public.organizations
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_branches_updated_at
BEFORE UPDATE ON public.branches
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();