-- Create a function to get email by username for authentication
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
  WHERE username = input_username;
  
  RETURN user_email;
END;
$$;

-- Grant execute permission to anonymous users
GRANT EXECUTE ON FUNCTION public.get_email_by_username(text) TO anon;