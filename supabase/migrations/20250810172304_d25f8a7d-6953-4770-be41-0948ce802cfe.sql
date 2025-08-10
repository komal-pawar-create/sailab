-- Add address fields and updated_at to labs
ALTER TABLE public.labs
ADD COLUMN IF NOT EXISTS address_line1 TEXT,
ADD COLUMN IF NOT EXISTS address_line2 TEXT,
ADD COLUMN IF NOT EXISTS city TEXT,
ADD COLUMN IF NOT EXISTS state TEXT,
ADD COLUMN IF NOT EXISTS postal_code TEXT,
ADD COLUMN IF NOT EXISTS phone TEXT,
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT now();

-- Ensure trigger to auto-update updated_at on labs
DROP TRIGGER IF EXISTS update_labs_updated_at ON public.labs;
CREATE TRIGGER update_labs_updated_at
BEFORE UPDATE ON public.labs
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- RLS policies for labs: allow admins full CRUD beyond existing SELECT
-- INSERT policy
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'labs' AND policyname = 'Admins can insert labs'
  ) THEN
    CREATE POLICY "Admins can insert labs"
    ON public.labs
    FOR INSERT
    WITH CHECK (has_role(auth.uid(), 'admin'::user_role));
  END IF;
END$$;

-- UPDATE policy
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'labs' AND policyname = 'Admins can update labs'
  ) THEN
    CREATE POLICY "Admins can update labs"
    ON public.labs
    FOR UPDATE
    USING (has_role(auth.uid(), 'admin'::user_role));
  END IF;
END$$;

-- DELETE policy
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'labs' AND policyname = 'Admins can delete labs'
  ) THEN
    CREATE POLICY "Admins can delete labs"
    ON public.labs
    FOR DELETE
    USING (has_role(auth.uid(), 'admin'::user_role));
  END IF;
END$$;

-- Profiles: allow admins to update any profile
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'profiles' AND policyname = 'Admins can update any profile'
  ) THEN
    CREATE POLICY "Admins can update any profile"
    ON public.profiles
    FOR UPDATE
    USING (has_role(auth.uid(), 'admin'::user_role));
  END IF;
END$$;