-- Fix infinite recursion in RLS policy by dropping and recreating it
-- First, drop the problematic policy that's causing infinite recursion
DROP POLICY IF EXISTS "Admins can view operators in their organization" ON public.profiles;

-- Add the corrected policy using get_user_branch function (which is SECURITY DEFINER and bypasses RLS)
CREATE POLICY "Admins can view operators in their organization" 
  ON public.profiles 
  FOR SELECT 
  USING (
    has_role(auth.uid(), 'admin'::user_role) 
    AND role IN ('operator_1', 'operator_2', 'operator_3')
    AND EXISTS (
      SELECT 1 
      FROM branches b1 
      JOIN branches b2 ON b1.organization_id = b2.organization_id
      WHERE b1.id = profiles.branch_id 
      AND b2.id = get_user_branch(auth.uid())
    )
  );