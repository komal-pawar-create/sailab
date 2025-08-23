-- Step 1: Add new user roles to the enum
ALTER TYPE public.user_role ADD VALUE IF NOT EXISTS 'super_admin';
ALTER TYPE public.user_role ADD VALUE IF NOT EXISTS 'lab_admin'; 
ALTER TYPE public.user_role ADD VALUE IF NOT EXISTS 'branch_operator';