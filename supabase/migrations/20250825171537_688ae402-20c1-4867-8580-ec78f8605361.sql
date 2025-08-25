-- Fix RLS policies for branch operators to only see their branch data

-- Drop existing policies for branch operators
DROP POLICY IF EXISTS "Branch operators can manage patients in their branch" ON patients;
DROP POLICY IF EXISTS "Branch operators can manage test reports in their branch" ON test_reports;
DROP POLICY IF EXISTS "Operators can view bills from their lab" ON bills;
DROP POLICY IF EXISTS "Operators can view documents from their lab" ON documents;
DROP POLICY IF EXISTS "Operators can view feedback from their lab" ON feedback;

-- Patients table - Branch operators only see their branch
CREATE POLICY "Branch operators can manage patients in their branch" ON patients
  FOR ALL 
  USING (branch_id IS NOT NULL AND branch_id = get_user_branch(auth.uid()))
  WITH CHECK (branch_id IS NOT NULL AND branch_id = get_user_branch(auth.uid()));

-- Test reports table - Branch operators only see their branch  
CREATE POLICY "Branch operators can manage test reports in their branch" ON test_reports
  FOR ALL
  USING (branch_id IS NOT NULL AND branch_id = get_user_branch(auth.uid()))
  WITH CHECK (branch_id IS NOT NULL AND branch_id = get_user_branch(auth.uid()));

-- Bills table - Create new policy for branch operators
CREATE POLICY "Branch operators can manage bills in their branch" ON bills
  FOR ALL
  USING (branch_id IS NOT NULL AND branch_id = get_user_branch(auth.uid()))
  WITH CHECK (branch_id IS NOT NULL AND branch_id = get_user_branch(auth.uid()));

-- Keep lab admin policy for bills
CREATE POLICY "Lab admins can view all bills in organization" ON bills
  FOR ALL
  USING (is_lab_admin(auth.uid()) AND EXISTS (
    SELECT 1 FROM branches b 
    WHERE b.id = bills.branch_id 
    AND b.organization_id = get_user_organization(auth.uid())
  ));

-- Documents table - Create new policy for branch operators  
CREATE POLICY "Branch operators can manage documents in their branch" ON documents
  FOR ALL
  USING (branch_id IS NOT NULL AND branch_id = get_user_branch(auth.uid()))
  WITH CHECK (branch_id IS NOT NULL AND branch_id = get_user_branch(auth.uid()));

-- Keep lab admin policy for documents
CREATE POLICY "Lab admins can view all documents in organization" ON documents
  FOR ALL
  USING (is_lab_admin(auth.uid()) AND EXISTS (
    SELECT 1 FROM branches b 
    WHERE b.id = documents.branch_id 
    AND b.organization_id = get_user_organization(auth.uid())
  ));

-- Feedback table - Create new policy for branch operators
CREATE POLICY "Branch operators can manage feedback in their branch" ON feedback
  FOR ALL  
  USING (branch_id IS NOT NULL AND branch_id = get_user_branch(auth.uid()))
  WITH CHECK (branch_id IS NOT NULL AND branch_id = get_user_branch(auth.uid()));

-- Keep lab admin policy for feedback
CREATE POLICY "Lab admins can view all feedback in organization" ON feedback
  FOR ALL
  USING (is_lab_admin(auth.uid()) AND EXISTS (
    SELECT 1 FROM branches b 
    WHERE b.id = feedback.branch_id 
    AND b.organization_id = get_user_organization(auth.uid())
  ));