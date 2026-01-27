-- Update RLS policies for subscriptions table to allow both super_admin and lab_admin

-- Drop existing restrictive policies
DROP POLICY IF EXISTS "Super admins can insert subscriptions" ON subscriptions;
DROP POLICY IF EXISTS "Super admins can view all subscriptions" ON subscriptions;
DROP POLICY IF EXISTS "Super admins can update subscriptions" ON subscriptions;
DROP POLICY IF EXISTS "Super admins can delete subscriptions" ON subscriptions;

-- Create new INSERT policy allowing super_admin and lab_admin
CREATE POLICY "Admins can insert subscriptions" ON subscriptions
  FOR INSERT TO public
  WITH CHECK (
    is_super_admin(auth.uid()) 
    OR 
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.user_id = auth.uid() 
      AND profiles.role = 'lab_admin'
    )
  );

-- Create new SELECT policy allowing super_admin and lab_admin
CREATE POLICY "Admins can view subscriptions" ON subscriptions
  FOR SELECT TO public
  USING (
    is_super_admin(auth.uid()) 
    OR 
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.user_id = auth.uid() 
      AND profiles.role = 'lab_admin'
    )
  );

-- Create new UPDATE policy allowing super_admin and lab_admin
CREATE POLICY "Admins can update subscriptions" ON subscriptions
  FOR UPDATE TO public
  USING (
    is_super_admin(auth.uid()) 
    OR 
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.user_id = auth.uid() 
      AND profiles.role = 'lab_admin'
    )
  );

-- Create new DELETE policy allowing super_admin and lab_admin
CREATE POLICY "Admins can delete subscriptions" ON subscriptions
  FOR DELETE TO public
  USING (
    is_super_admin(auth.uid()) 
    OR 
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.user_id = auth.uid() 
      AND profiles.role = 'lab_admin'
    )
  );