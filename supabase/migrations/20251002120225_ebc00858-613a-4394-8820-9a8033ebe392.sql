-- Update the handle_new_user trigger to fix the confirmation_token scan error
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
  
  -- If skip_email_confirmation is true, only set email_confirmed_at
  -- Don't touch confirmation_token as it causes SQL scan errors
  IF (NEW.raw_user_meta_data->>'skip_email_confirmation')::boolean = true THEN
    UPDATE auth.users 
    SET email_confirmed_at = now()
    WHERE id = NEW.id;
  END IF;
  
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    RAISE WARNING 'Failed to create profile for user %: %', NEW.id, SQLERRM;
    RETURN NEW;
END;
$$;