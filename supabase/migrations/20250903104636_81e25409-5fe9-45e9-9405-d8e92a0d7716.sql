-- Add new columns for referring doctor information
ALTER TABLE public.patients 
ADD COLUMN IF NOT EXISTS referred_by_doctor_name TEXT,
ADD COLUMN IF NOT EXISTS referred_by_doctor_phone TEXT,
ADD COLUMN IF NOT EXISTS age_in_months INTEGER;

-- Migrate existing age data to age_in_months (assuming current age is in years)
UPDATE public.patients 
SET age_in_months = age * 12 
WHERE age IS NOT NULL AND age_in_months IS NULL;

-- Create a function to preview patient ID without consuming sequence
CREATE OR REPLACE FUNCTION public.preview_patient_id(p_branch_id uuid, p_lab_id uuid)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
DECLARE
  v_lab_initials TEXT;
  v_branch_code TEXT;
  v_current_date DATE;
  v_sequence INTEGER;
  v_patient_id TEXT;
BEGIN
  -- Get lab initials
  SELECT initials INTO v_lab_initials
  FROM labs 
  WHERE id = p_lab_id;
  
  IF v_lab_initials IS NULL THEN
    RAISE EXCEPTION 'Lab not found or initials not set';
  END IF;
  
  -- Get branch code
  SELECT branch_code INTO v_branch_code
  FROM branches 
  WHERE id = p_branch_id;
  
  IF v_branch_code IS NULL THEN
    RAISE EXCEPTION 'Branch not found or branch code not set';
  END IF;
  
  -- Get current date
  v_current_date := CURRENT_DATE;
  
  -- Get the next sequence number without updating it
  SELECT COALESCE(last_sequence, 0) + 1 INTO v_sequence
  FROM patient_id_sequences
  WHERE branch_id = p_branch_id AND sequence_date = v_current_date;
  
  -- If no sequence exists for today, start with 1
  IF v_sequence IS NULL THEN
    v_sequence := 1;
  END IF;
  
  -- Generate patient ID preview
  v_patient_id := v_lab_initials || '-' ||
                  v_branch_code || '-' ||
                  TO_CHAR(v_current_date, 'YYYYMMDD') || 
                  '/' || 
                  LPAD(v_sequence::TEXT, 3, '0');
  
  RETURN v_patient_id;
END;
$function$;