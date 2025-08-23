-- Update super_admin profiles to remove lab_id and branch_id
-- Super admins should not be tied to specific labs or branches
UPDATE public.profiles 
SET 
  lab_id = NULL,
  branch_id = NULL
WHERE role = 'super_admin';

-- Add a comment for clarity
COMMENT ON COLUMN profiles.lab_id IS 'Lab ID for lab admins and operators. Should be NULL for super_admin users.';
COMMENT ON COLUMN profiles.branch_id IS 'Branch ID for branch operators. Should be NULL for super_admin and lab_admin users.';