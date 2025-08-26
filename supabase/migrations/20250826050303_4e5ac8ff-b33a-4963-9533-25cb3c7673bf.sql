-- Add patient_history column to patients table
ALTER TABLE public.patients ADD COLUMN patient_history TEXT;

-- Make phone required (remove NULL constraint)
ALTER TABLE public.patients ALTER COLUMN phone SET NOT NULL;

-- Drop the email column as it's being replaced with patient_history
ALTER TABLE public.patients DROP COLUMN email;