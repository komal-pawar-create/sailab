-- Assign the demo admin to the Sangamner branch
UPDATE profiles 
SET branch_id = '4bf4e845-f3ac-48b2-a760-6cabc0a10a20'
WHERE email = 'admin@labmaster.com';

-- Create a lab for the organization
INSERT INTO labs (id, name, location, organization_id, created_at, updated_at)
VALUES (
  gen_random_uuid(),
  'Sai Lab - Main', 
  'Sangamner', 
  'c5f43d51-c606-4f95-95ab-7088bc20303a',
  now(),
  now()
)
ON CONFLICT DO NOTHING;

-- Get the lab ID and update the branch
UPDATE branches 
SET lab_id = (SELECT id FROM labs WHERE name = 'Sai Lab - Main' AND organization_id = 'c5f43d51-c606-4f95-95ab-7088bc20303a' LIMIT 1)
WHERE id = '4bf4e845-f3ac-48b2-a760-6cabc0a10a20';

-- Also update the demo admin's lab_id to match
UPDATE profiles 
SET lab_id = (SELECT id FROM labs WHERE name = 'Sai Lab - Main' AND organization_id = 'c5f43d51-c606-4f95-95ab-7088bc20303a' LIMIT 1)
WHERE email = 'admin@labmaster.com';

-- Ensure all admin users have proper branch assignments
UPDATE profiles
SET branch_id = (
  SELECT b.id FROM branches b 
  WHERE b.organization_id = (
    SELECT organization_id FROM branches WHERE id = profiles.branch_id
  )
  LIMIT 1
)
WHERE role = 'admin' AND branch_id IS NULL AND lab_id IS NOT NULL;