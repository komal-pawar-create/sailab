-- Add INSERT policy to profiles table so users can be created
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS id uuid DEFAULT gen_random_uuid();

-- Add policy to allow inserting profiles
CREATE POLICY "Users can insert their own profile" 
ON public.profiles 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Add policy to allow updating profiles  
CREATE POLICY "Users can update their own profile" 
ON public.profiles 
FOR UPDATE 
USING (auth.uid() = user_id);

-- Create trigger for automatic profile creation on user signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();