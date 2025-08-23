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

-- Step 8: Create helper functions for new role system (with secure search_path)
CREATE OR REPLACE FUNCTION public.get_user_organization(user_id uuid)
RETURNS uuid
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
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
SET search_path = public
AS $$
  SELECT branch_id FROM public.profiles WHERE profiles.user_id = get_user_branch.user_id;
$$;

CREATE OR REPLACE FUNCTION public.is_super_admin(user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
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
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.user_id = is_lab_admin.user_id AND role = 'lab_admin'
  );
$$;

-- Add triggers for updated_at columns
CREATE TRIGGER update_organizations_updated_at
BEFORE UPDATE ON public.organizations
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_branches_updated_at
BEFORE UPDATE ON public.branches
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();