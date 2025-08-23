-- Update the handle_new_user function to handle branch_id and skip email confirmation
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
BEGIN
  INSERT INTO public.profiles (user_id, email, full_name, role, lab_id, branch_id)
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
    END
  );
  
  -- If skip_email_confirmation is true (admin creating user), auto-confirm the email
  IF (NEW.raw_user_meta_data->>'skip_email_confirmation')::boolean = true THEN
    -- Mark email as confirmed immediately
    UPDATE auth.users 
    SET email_confirmed_at = now(),
        confirmation_token = NULL,
        confirmation_sent_at = NULL
    WHERE id = NEW.id;
  END IF;
  
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log the error but don't block user creation
    RAISE WARNING 'Failed to create profile for user %: %', NEW.id, SQLERRM;
    RETURN NEW;
END;
$function$;

-- Recreate the trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();