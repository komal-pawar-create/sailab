-- Update usernames for existing users
UPDATE profiles 
SET username = CASE
  WHEN email = 'admin@labmaster.com' THEN 'admin'
  WHEN email = 'operator1@centrallab.com' THEN 'shirsath'
  WHEN email = 'operator2@northlab.com' THEN 'saanvi'
  WHEN email = 'operator3@westlab.com' THEN 'sanjeevan'
  WHEN email = 'sagarvarale555@gmail.com' THEN 'superadmin'
  WHEN email = 'sagar.s.varale@gmail.com' THEN 'labadmin'
  ELSE LOWER(SPLIT_PART(email, '@', 1))
END
WHERE username IS NULL;

-- Make username required going forward (if not already)
ALTER TABLE profiles ALTER COLUMN username SET NOT NULL;