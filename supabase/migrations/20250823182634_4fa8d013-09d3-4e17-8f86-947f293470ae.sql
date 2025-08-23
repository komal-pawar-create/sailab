-- Add RLS policy to allow admins to view operators in their organization
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
      AND b2.id = (SELECT branch_id FROM profiles WHERE user_id = auth.uid())
    )
  );