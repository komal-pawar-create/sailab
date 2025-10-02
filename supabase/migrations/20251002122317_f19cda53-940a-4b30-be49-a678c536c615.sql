-- Create trigger to auto-populate user's lab_id from their branch
CREATE OR REPLACE FUNCTION public.auto_populate_user_lab_from_branch()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_lab_id uuid;
BEGIN
  -- If branch_id is set, get the lab_id from that branch
  IF NEW.branch_id IS NOT NULL THEN
    SELECT lab_id INTO v_lab_id
    FROM branches
    WHERE id = NEW.branch_id;
    
    -- Set the user's lab_id to match their branch's lab_id
    NEW.lab_id := v_lab_id;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger for INSERT operations
CREATE TRIGGER set_user_lab_on_insert
BEFORE INSERT ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.auto_populate_user_lab_from_branch();

-- Create trigger for UPDATE operations (when branch_id changes)
CREATE TRIGGER set_user_lab_on_update
BEFORE UPDATE ON public.profiles
FOR EACH ROW
WHEN (OLD.branch_id IS DISTINCT FROM NEW.branch_id)
EXECUTE FUNCTION public.auto_populate_user_lab_from_branch();