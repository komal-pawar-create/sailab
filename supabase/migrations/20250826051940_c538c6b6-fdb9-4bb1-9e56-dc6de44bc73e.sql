-- Add technician_name column to test_reports if it doesn't exist
ALTER TABLE public.test_reports 
ADD COLUMN IF NOT EXISTS technician_name TEXT;

-- Insert default test types if not already present
INSERT INTO public.test_types (lab_id, branch_id, test_name, created_by)
SELECT DISTINCT 
  p.lab_id,
  p.branch_id,
  'BLOOD TEST',
  p.user_id
FROM public.profiles p
WHERE p.lab_id IS NOT NULL AND p.role = 'admin'
ON CONFLICT (lab_id, test_name) DO NOTHING;

INSERT INTO public.test_types (lab_id, branch_id, test_name, created_by)
SELECT DISTINCT 
  p.lab_id,
  p.branch_id,
  'URINE TEST',
  p.user_id
FROM public.profiles p
WHERE p.lab_id IS NOT NULL AND p.role = 'admin'
ON CONFLICT (lab_id, test_name) DO NOTHING;

INSERT INTO public.test_types (lab_id, branch_id, test_name, created_by)
SELECT DISTINCT 
  p.lab_id,
  p.branch_id,
  'X-RAY',
  p.user_id
FROM public.profiles p
WHERE p.lab_id IS NOT NULL AND p.role = 'admin'
ON CONFLICT (lab_id, test_name) DO NOTHING;

INSERT INTO public.test_types (lab_id, branch_id, test_name, created_by)
SELECT DISTINCT 
  p.lab_id,
  p.branch_id,
  'CT SCAN',
  p.user_id
FROM public.profiles p
WHERE p.lab_id IS NOT NULL AND p.role = 'admin'
ON CONFLICT (lab_id, test_name) DO NOTHING;

INSERT INTO public.test_types (lab_id, branch_id, test_name, created_by)
SELECT DISTINCT 
  p.lab_id,
  p.branch_id,
  'MRI',
  p.user_id
FROM public.profiles p
WHERE p.lab_id IS NOT NULL AND p.role = 'admin'
ON CONFLICT (lab_id, test_name) DO NOTHING;

INSERT INTO public.test_types (lab_id, branch_id, test_name, created_by)
SELECT DISTINCT 
  p.lab_id,
  p.branch_id,
  'ULTRASOUND',
  p.user_id
FROM public.profiles p
WHERE p.lab_id IS NOT NULL AND p.role = 'admin'
ON CONFLICT (lab_id, test_name) DO NOTHING;

INSERT INTO public.test_types (lab_id, branch_id, test_name, created_by)
SELECT DISTINCT 
  p.lab_id,
  p.branch_id,
  'ECG',
  p.user_id
FROM public.profiles p
WHERE p.lab_id IS NOT NULL AND p.role = 'admin'
ON CONFLICT (lab_id, test_name) DO NOTHING;