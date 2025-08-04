-- Update the handle_new_user function to properly handle the enum casting
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (user_id, email, full_name, role, lab_id)
  VALUES (
    new.id,
    new.email,
    COALESCE(new.raw_user_meta_data->>'full_name', ''),
    COALESCE((new.raw_user_meta_data->>'role')::user_role, 'operator_1'::user_role),
    CASE 
      WHEN new.raw_user_meta_data->>'lab_id' IS NOT NULL 
      THEN (new.raw_user_meta_data->>'lab_id')::uuid 
      ELSE NULL 
    END
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;