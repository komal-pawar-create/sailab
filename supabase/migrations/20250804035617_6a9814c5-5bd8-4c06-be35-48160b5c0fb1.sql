-- Create sample users manually by inserting into auth.users table
-- These users will have their passwords hashed properly

-- Note: In a real production environment, users should be created through the signup flow
-- This is only for testing purposes

INSERT INTO auth.users (
  instance_id,
  id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  raw_user_meta_data,
  created_at,
  updated_at,
  confirmation_token,
  email_change,
  email_change_token_new,
  recovery_token
) VALUES 
-- Admin user: admin@labmaster.com / admin123
(
  '00000000-0000-0000-0000-000000000000',
  '550e8400-e29b-41d4-a716-446655440100',
  'authenticated',
  'authenticated',
  'admin@labmaster.com',
  crypt('admin123', gen_salt('bf')),
  NOW(),
  '{"full_name": "Admin User", "role": "admin"}'::jsonb,
  NOW(),
  NOW(),
  '',
  '',
  '',
  ''
),
-- Operator 1: operator1@centrallab.com / operator123
(
  '00000000-0000-0000-0000-000000000000',
  '550e8400-e29b-41d4-a716-446655440101',
  'authenticated',
  'authenticated',
  'operator1@centrallab.com',
  crypt('operator123', gen_salt('bf')),
  NOW(),
  '{"full_name": "Operator One", "role": "operator_1", "lab_id": "550e8400-e29b-41d4-a716-446655440001"}'::jsonb,
  NOW(),
  NOW(),
  '',
  '',
  '',
  ''
),
-- Operator 2: operator2@northlab.com / operator123
(
  '00000000-0000-0000-0000-000000000000',
  '550e8400-e29b-41d4-a716-446655440102',
  'authenticated',
  'authenticated',
  'operator2@northlab.com',
  crypt('operator123', gen_salt('bf')),
  NOW(),
  '{"full_name": "Operator Two", "role": "operator_2", "lab_id": "550e8400-e29b-41d4-a716-446655440002"}'::jsonb,
  NOW(),
  NOW(),
  '',
  '',
  '',
  ''
),
-- Operator 3: operator3@westlab.com / operator123
(
  '00000000-0000-0000-0000-000000000000',
  '550e8400-e29b-41d4-a716-446655440103',
  'authenticated',
  'authenticated',
  'operator3@westlab.com',
  crypt('operator123', gen_salt('bf')),
  NOW(),
  '{"full_name": "Operator Three", "role": "operator_3", "lab_id": "550e8400-e29b-41d4-a716-446655440003"}'::jsonb,
  NOW(),
  NOW(),
  '',
  '',
  '',
  ''
)
ON CONFLICT (email) DO NOTHING;

-- Now create the corresponding profiles
INSERT INTO public.profiles (user_id, email, full_name, role, lab_id) VALUES
('550e8400-e29b-41d4-a716-446655440100', 'admin@labmaster.com', 'Admin User', 'admin', NULL),
('550e8400-e29b-41d4-a716-446655440101', 'operator1@centrallab.com', 'Operator One', 'operator_1', '550e8400-e29b-41d4-a716-446655440001'),
('550e8400-e29b-41d4-a716-446655440102', 'operator2@northlab.com', 'Operator Two', 'operator_2', '550e8400-e29b-41d4-a716-446655440002'),
('550e8400-e29b-41d4-a716-446655440103', 'operator3@westlab.com', 'Operator Three', 'operator_3', '550e8400-e29b-41d4-a716-446655440003')
ON CONFLICT (user_id) DO NOTHING;

-- Create trigger for future user signups to automatically create profiles
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();