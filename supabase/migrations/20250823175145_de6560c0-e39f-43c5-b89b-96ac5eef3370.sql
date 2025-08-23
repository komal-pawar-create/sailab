-- Assign branch_id to the lab_admin user
UPDATE profiles 
SET branch_id = '4bf4e845-f3ac-48b2-a760-6cabc0a10a20' 
WHERE email = 'sagar.s.varale@gmail.com';

-- Assign branch_id to all operators who don't have one
UPDATE profiles 
SET branch_id = '4bf4e845-f3ac-48b2-a760-6cabc0a10a20' 
WHERE role IN ('operator_1', 'operator_2', 'operator_3') 
AND (branch_id IS NULL OR branch_id = '');

-- Also update the demo admin to have the branch_id
UPDATE profiles 
SET branch_id = '4bf4e845-f3ac-48b2-a760-6cabc0a10a20' 
WHERE email = 'admin@labmaster.com';