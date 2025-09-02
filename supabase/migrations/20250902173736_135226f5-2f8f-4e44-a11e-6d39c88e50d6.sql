-- Update the is_lab_admin function to also check for 'admin' role
CREATE OR REPLACE FUNCTION public.is_lab_admin(user_id uuid)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.user_id = is_lab_admin.user_id 
    AND role IN ('lab_admin', 'admin')
  );
$function$;