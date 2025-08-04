-- Insert sample users with profiles
-- Note: These are for testing purposes only

-- First, let's create the sample users by inserting into auth.users
-- We'll use the auth.signup function to properly create users

-- Create admin user
SELECT auth.signup(
  'admin@labmaster.com',
  'admin123',
  'https://jlqocytwodbbebrgboaw.supabase.co',
  jsonb_build_object(
    'full_name', 'Admin User',
    'role', 'admin'
  )
);

-- Create operator users
SELECT auth.signup(
  'operator1@centrallab.com',
  'operator123',
  'https://jlqocytwodbbebrgboaw.supabase.co',
  jsonb_build_object(
    'full_name', 'Operator One',
    'role', 'operator_1',
    'lab_id', '550e8400-e29b-41d4-a716-446655440001'
  )
);

SELECT auth.signup(
  'operator2@northlab.com',
  'operator123',
  'https://jlqocytwodbbebrgboaw.supabase.co',
  jsonb_build_object(
    'full_name', 'Operator Two',
    'role', 'operator_2',
    'lab_id', '550e8400-e29b-41d4-a716-446655440002'
  )
);

SELECT auth.signup(
  'operator3@westlab.com',
  'operator123',
  'https://jlqocytwodbbebrgboaw.supabase.co',
  jsonb_build_object(
    'full_name', 'Operator Three',
    'role', 'operator_3',
    'lab_id', '550e8400-e29b-41d4-a716-446655440003'
  )
);

-- Create a trigger to automatically create profiles when users sign up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (user_id, email, full_name, role, lab_id)
  VALUES (
    new.id,
    new.email,
    COALESCE(new.raw_user_meta_data->>'full_name', ''),
    COALESCE(new.raw_user_meta_data->>'role', 'operator_1'),
    new.raw_user_meta_data->>'lab_id'
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for automatic profile creation
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- Manually insert profiles for any existing users
INSERT INTO public.profiles (user_id, email, full_name, role, lab_id)
SELECT 
  id,
  email,
  COALESCE(raw_user_meta_data->>'full_name', email),
  COALESCE(raw_user_meta_data->>'role', 'operator_1'),
  raw_user_meta_data->>'lab_id'
FROM auth.users
WHERE id NOT IN (SELECT user_id FROM public.profiles)
ON CONFLICT (user_id) DO NOTHING;