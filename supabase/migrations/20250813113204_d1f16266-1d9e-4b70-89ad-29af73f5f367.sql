-- Create patient_followups table for patient follow-up tasks
CREATE TABLE IF NOT EXISTS public.patient_followups (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lab_id uuid NOT NULL,
  patient_id uuid NOT NULL,
  title text NOT NULL,
  details text,
  due_at timestamptz NOT NULL,
  remind_at timestamptz,
  priority text NOT NULL DEFAULT 'medium',
  status text NOT NULL DEFAULT 'open',
  assigned_to uuid NOT NULL,
  created_by uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz
);

-- Enable RLS
ALTER TABLE public.patient_followups ENABLE ROW LEVEL SECURITY;

-- Policies
-- Admins: full access
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'patient_followups' AND policyname = 'Admins can manage all followups'
  ) THEN
    CREATE POLICY "Admins can manage all followups"
    ON public.patient_followups
    AS RESTRICTIVE
    FOR ALL
    USING (has_role(auth.uid(), 'admin'::user_role))
    WITH CHECK (has_role(auth.uid(), 'admin'::user_role));
  END IF;
END $$;

-- Operators: select rows from their lab
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'patient_followups' AND policyname = 'Operators can view followups from their lab'
  ) THEN
    CREATE POLICY "Operators can view followups from their lab"
    ON public.patient_followups
    FOR SELECT
    USING (lab_id = get_user_lab(auth.uid()));
  END IF;
END $$;

-- Operators: insert rows for their lab, assignee must belong to same lab, created_by must be self
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'patient_followups' AND policyname = 'Operators can create followups in their lab'
  ) THEN
    CREATE POLICY "Operators can create followups in their lab"
    ON public.patient_followups
    FOR INSERT
    WITH CHECK (
      lab_id = get_user_lab(auth.uid())
      AND created_by = auth.uid()
      AND EXISTS (
        SELECT 1 FROM public.profiles p
        WHERE p.user_id = assigned_to AND p.lab_id = get_user_lab(auth.uid())
      )
    );
  END IF;
END $$;

-- Operators: update rows in their lab when creator or assignee
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'patient_followups' AND policyname = 'Operators can update own-lab followups when creator or assignee'
  ) THEN
    CREATE POLICY "Operators can update own-lab followups when creator or assignee"
    ON public.patient_followups
    FOR UPDATE
    USING (
      lab_id = get_user_lab(auth.uid()) AND (created_by = auth.uid() OR assigned_to = auth.uid())
    )
    WITH CHECK (
      lab_id = get_user_lab(auth.uid())
    );
  END IF;
END $$;

-- Optional: Only admins can delete
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'patient_followups' AND policyname = 'Only admins can delete followups'
  ) THEN
    CREATE POLICY "Only admins can delete followups"
    ON public.patient_followups
    FOR DELETE
    USING (has_role(auth.uid(), 'admin'::user_role));
  END IF;
END $$;

-- Trigger to update updated_at
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'update_patient_followups_updated_at'
  ) THEN
    CREATE TRIGGER update_patient_followups_updated_at
    BEFORE UPDATE ON public.patient_followups
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
  END IF;
END $$;

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_patient_followups_lab_due ON public.patient_followups (lab_id, due_at);
CREATE INDEX IF NOT EXISTS idx_patient_followups_assigned_due ON public.patient_followups (assigned_to, due_at);
CREATE INDEX IF NOT EXISTS idx_patient_followups_patient ON public.patient_followups (patient_id);
