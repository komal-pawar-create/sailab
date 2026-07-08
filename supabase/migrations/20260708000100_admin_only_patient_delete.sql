-- Restrict patient deletion to admin roles only.
-- The original patient policies used FOR ALL for same-lab users, which also allowed deletes.

DROP POLICY IF EXISTS "Operators can view patients from their lab" ON public.patients;
DROP POLICY IF EXISTS "Admins can view all patients" ON public.patients;
DROP POLICY IF EXISTS "Operators can create patients in their lab" ON public.patients;
DROP POLICY IF EXISTS "Operators can update patients from their lab" ON public.patients;
DROP POLICY IF EXISTS "Admins can manage all patients" ON public.patients;

CREATE POLICY "Operators can view patients from their lab"
ON public.patients
FOR SELECT
USING (lab_id = public.get_user_lab(auth.uid()));

CREATE POLICY "Operators can create patients in their lab"
ON public.patients
FOR INSERT
WITH CHECK (lab_id = public.get_user_lab(auth.uid()));

CREATE POLICY "Operators can update patients from their lab"
ON public.patients
FOR UPDATE
USING (lab_id = public.get_user_lab(auth.uid()))
WITH CHECK (lab_id = public.get_user_lab(auth.uid()));

CREATE POLICY "Admins can manage all patients"
ON public.patients
FOR ALL
USING (public.has_role(auth.uid(), 'admin'::public.user_role) OR public.is_lab_admin(auth.uid()))
WITH CHECK (public.has_role(auth.uid(), 'admin'::public.user_role) OR public.is_lab_admin(auth.uid()));
