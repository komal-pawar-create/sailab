-- Create test_types table for lab-specific test types
CREATE TABLE public.test_types (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  lab_id UUID NOT NULL,
  branch_id UUID,
  test_name TEXT NOT NULL,
  created_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(lab_id, test_name)
);

-- Enable RLS on test_types
ALTER TABLE public.test_types ENABLE ROW LEVEL SECURITY;

-- Lab admins can manage test types for their organization
CREATE POLICY "Lab admins can manage test types in their organization" 
ON public.test_types 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM branches b
    WHERE b.id = test_types.branch_id
    AND b.organization_id = get_user_organization(auth.uid())
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM branches b
    WHERE b.id = test_types.branch_id
    AND b.organization_id = get_user_organization(auth.uid())
  )
);

-- Branch operators can view test types in their branch
CREATE POLICY "Branch operators can view test types in their branch" 
ON public.test_types 
FOR SELECT 
USING (
  branch_id = get_user_branch(auth.uid())
);

-- Super admins can manage all test types
CREATE POLICY "Super admins can manage all test types" 
ON public.test_types 
FOR ALL 
USING (is_super_admin(auth.uid()))
WITH CHECK (is_super_admin(auth.uid()));

-- Add technician_name column to test_reports
ALTER TABLE public.test_reports 
ADD COLUMN technician_name TEXT;

-- Add trigger for updated_at on test_types
CREATE TRIGGER update_test_types_updated_at
BEFORE UPDATE ON public.test_types
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert some default test types for existing labs
INSERT INTO public.test_types (lab_id, branch_id, test_name, created_by)
SELECT DISTINCT 
  tr.lab_id,
  tr.branch_id,
  'BLOOD TEST',
  tr.created_by
FROM public.test_reports tr
WHERE tr.lab_id IS NOT NULL
ON CONFLICT (lab_id, test_name) DO NOTHING;

INSERT INTO public.test_types (lab_id, branch_id, test_name, created_by)
SELECT DISTINCT 
  tr.lab_id,
  tr.branch_id,
  'URINE TEST',
  tr.created_by
FROM public.test_reports tr
WHERE tr.lab_id IS NOT NULL
ON CONFLICT (lab_id, test_name) DO NOTHING;

INSERT INTO public.test_types (lab_id, branch_id, test_name, created_by)
SELECT DISTINCT 
  tr.lab_id,
  tr.branch_id,
  'X-RAY',
  tr.created_by
FROM public.test_reports tr
WHERE tr.lab_id IS NOT NULL
ON CONFLICT (lab_id, test_name) DO NOTHING;

INSERT INTO public.test_types (lab_id, branch_id, test_name, created_by)
SELECT DISTINCT 
  tr.lab_id,
  tr.branch_id,
  'CT SCAN',
  tr.created_by
FROM public.test_reports tr
WHERE tr.lab_id IS NOT NULL
ON CONFLICT (lab_id, test_name) DO NOTHING;

INSERT INTO public.test_types (lab_id, branch_id, test_name, created_by)
SELECT DISTINCT 
  tr.lab_id,
  tr.branch_id,
  'MRI',
  tr.created_by
FROM public.test_reports tr
WHERE tr.lab_id IS NOT NULL
ON CONFLICT (lab_id, test_name) DO NOTHING;