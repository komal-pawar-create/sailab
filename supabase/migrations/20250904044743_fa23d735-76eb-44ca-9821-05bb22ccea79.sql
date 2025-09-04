-- Add username and mobile_number to profiles table
ALTER TABLE public.profiles 
ADD COLUMN username TEXT UNIQUE,
ADD COLUMN mobile_number TEXT;

-- Create index for faster username lookups
CREATE INDEX idx_profiles_username ON public.profiles(username);

-- Add admin_mobile_number to labs table for centralized OTP recovery
ALTER TABLE public.labs
ADD COLUMN admin_mobile_number TEXT;

-- Create password_reset_otps table for OTP management
CREATE TABLE public.password_reset_otps (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  otp_code TEXT NOT NULL,
  mobile_number TEXT NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  used BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on password_reset_otps
ALTER TABLE public.password_reset_otps ENABLE ROW LEVEL SECURITY;

-- Create policies for password_reset_otps
CREATE POLICY "Users can view their own OTPs" 
ON public.password_reset_otps 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "System can create OTPs" 
ON public.password_reset_otps 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "System can update OTPs" 
ON public.password_reset_otps 
FOR UPDATE 
USING (true);

-- Create function to get user by username
CREATE OR REPLACE FUNCTION public.get_user_by_username(p_username TEXT)
RETURNS TABLE (
  user_id UUID,
  email TEXT,
  mobile_number TEXT,
  lab_id UUID,
  admin_mobile TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.user_id,
    p.email,
    p.mobile_number,
    p.lab_id,
    l.admin_mobile_number
  FROM profiles p
  LEFT JOIN labs l ON l.id = p.lab_id
  WHERE p.username = p_username
  LIMIT 1;
END;
$$;

-- Update handle_new_user trigger to generate username
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_username TEXT;
  v_base_username TEXT;
  v_counter INTEGER := 1;
BEGIN
  -- Generate username from full_name or email
  v_base_username := LOWER(
    REGEXP_REPLACE(
      COALESCE(NEW.raw_user_meta_data->>'full_name', SPLIT_PART(NEW.email, '@', 1)),
      '[^a-zA-Z0-9]', '_', 'g'
    )
  );
  
  -- Ensure username is unique
  v_username := v_base_username;
  WHILE EXISTS (SELECT 1 FROM profiles WHERE username = v_username) LOOP
    v_username := v_base_username || '_' || v_counter;
    v_counter := v_counter + 1;
  END LOOP;

  INSERT INTO public.profiles (user_id, email, full_name, role, lab_id, branch_id, username, mobile_number)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    COALESCE((NEW.raw_user_meta_data->>'role')::public.user_role, 'branch_operator'::public.user_role),
    CASE 
      WHEN NEW.raw_user_meta_data->>'lab_id' IS NOT NULL AND NEW.raw_user_meta_data->>'lab_id' != ''
      THEN (NEW.raw_user_meta_data->>'lab_id')::uuid 
      ELSE NULL 
    END,
    CASE 
      WHEN NEW.raw_user_meta_data->>'branch_id' IS NOT NULL AND NEW.raw_user_meta_data->>'branch_id' != ''
      THEN (NEW.raw_user_meta_data->>'branch_id')::uuid 
      ELSE NULL 
    END,
    v_username,
    NEW.raw_user_meta_data->>'mobile_number'
  );
  
  -- If skip_email_confirmation is true (admin creating user), auto-confirm the email
  IF (NEW.raw_user_meta_data->>'skip_email_confirmation')::boolean = true THEN
    UPDATE auth.users 
    SET email_confirmed_at = now(),
        confirmation_token = NULL,
        confirmation_sent_at = NULL
    WHERE id = NEW.id;
  END IF;
  
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    RAISE WARNING 'Failed to create profile for user %: %', NEW.id, SQLERRM;
    RETURN NEW;
END;
$$;