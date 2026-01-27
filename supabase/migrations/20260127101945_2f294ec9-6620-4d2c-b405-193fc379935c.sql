-- Update get_email_by_username function to be case-insensitive
CREATE OR REPLACE FUNCTION public.get_email_by_username(input_username text)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  user_email text;
BEGIN
  SELECT email INTO user_email
  FROM profiles
  WHERE LOWER(username) = LOWER(input_username);
  
  RETURN user_email;
END;
$$;