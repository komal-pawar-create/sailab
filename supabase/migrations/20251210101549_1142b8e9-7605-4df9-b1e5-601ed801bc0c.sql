-- Add missing bills_patient_id_fkey constraint (if not exists)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'bills_patient_id_fkey' 
    AND table_name = 'bills'
  ) THEN
    ALTER TABLE public.bills 
    ADD CONSTRAINT bills_patient_id_fkey 
    FOREIGN KEY (patient_id) REFERENCES public.patients(id) ON DELETE CASCADE;
  END IF;
END $$;