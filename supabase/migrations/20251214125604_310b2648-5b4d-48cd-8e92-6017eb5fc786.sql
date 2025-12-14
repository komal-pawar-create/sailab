-- Fix critical data isolation issue: Add is_lab_admin() check to all "Lab admins" policies
-- Without this check, any user in the organization can see all data from all branches

-- 1. Fix patients table
DROP POLICY IF EXISTS "Lab admins can manage patients in their organization" ON patients;

CREATE POLICY "Lab admins can manage patients in their organization"
  ON patients FOR ALL
  USING (
    is_lab_admin(auth.uid()) AND 
    EXISTS (
      SELECT 1 FROM branches b
      WHERE b.id = patients.branch_id 
      AND b.organization_id = get_user_organization(auth.uid())
    )
  )
  WITH CHECK (
    is_lab_admin(auth.uid()) AND 
    EXISTS (
      SELECT 1 FROM branches b
      WHERE b.id = patients.branch_id 
      AND b.organization_id = get_user_organization(auth.uid())
    )
  );

-- 2. Fix test_reports table
DROP POLICY IF EXISTS "Lab admins can manage test reports in their organization" ON test_reports;

CREATE POLICY "Lab admins can manage test reports in their organization"
  ON test_reports FOR ALL
  USING (
    is_lab_admin(auth.uid()) AND 
    EXISTS (
      SELECT 1 FROM branches b
      WHERE b.id = test_reports.branch_id 
      AND b.organization_id = get_user_organization(auth.uid())
    )
  )
  WITH CHECK (
    is_lab_admin(auth.uid()) AND 
    EXISTS (
      SELECT 1 FROM branches b
      WHERE b.id = test_reports.branch_id 
      AND b.organization_id = get_user_organization(auth.uid())
    )
  );

-- 3. Fix documents table
DROP POLICY IF EXISTS "Lab admins can view all documents in organization" ON documents;

CREATE POLICY "Lab admins can view all documents in organization"
  ON documents FOR ALL
  USING (
    is_lab_admin(auth.uid()) AND 
    EXISTS (
      SELECT 1 FROM branches b
      WHERE b.id = documents.branch_id 
      AND b.organization_id = get_user_organization(auth.uid())
    )
  )
  WITH CHECK (
    is_lab_admin(auth.uid()) AND 
    EXISTS (
      SELECT 1 FROM branches b
      WHERE b.id = documents.branch_id 
      AND b.organization_id = get_user_organization(auth.uid())
    )
  );

-- 4. Fix bills table
DROP POLICY IF EXISTS "Lab admins can view all bills in organization" ON bills;

CREATE POLICY "Lab admins can view all bills in organization"
  ON bills FOR ALL
  USING (
    is_lab_admin(auth.uid()) AND 
    EXISTS (
      SELECT 1 FROM branches b
      WHERE b.id = bills.branch_id 
      AND b.organization_id = get_user_organization(auth.uid())
    )
  )
  WITH CHECK (
    is_lab_admin(auth.uid()) AND 
    EXISTS (
      SELECT 1 FROM branches b
      WHERE b.id = bills.branch_id 
      AND b.organization_id = get_user_organization(auth.uid())
    )
  );

-- 5. Fix feedback table
DROP POLICY IF EXISTS "Lab admins can view all feedback in organization" ON feedback;

CREATE POLICY "Lab admins can view all feedback in organization"
  ON feedback FOR ALL
  USING (
    is_lab_admin(auth.uid()) AND 
    EXISTS (
      SELECT 1 FROM branches b
      WHERE b.id = feedback.branch_id 
      AND b.organization_id = get_user_organization(auth.uid())
    )
  )
  WITH CHECK (
    is_lab_admin(auth.uid()) AND 
    EXISTS (
      SELECT 1 FROM branches b
      WHERE b.id = feedback.branch_id 
      AND b.organization_id = get_user_organization(auth.uid())
    )
  );