CREATE OR REPLACE FUNCTION public.get_current_lab_id()
RETURNS UUID AS $$
DECLARE
  v_lab_id UUID;
BEGIN
  SELECT lab_id INTO v_lab_id
  FROM public.profiles
  WHERE user_id = auth.uid();
  RETURN v_lab_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE SET search_path = public;