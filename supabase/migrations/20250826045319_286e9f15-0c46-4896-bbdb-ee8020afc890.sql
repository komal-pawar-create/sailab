-- Fix search_path for generate_patient_id function
DROP FUNCTION IF EXISTS generate_patient_id(UUID, UUID);

CREATE OR REPLACE FUNCTION generate_patient_id(p_branch_id UUID, p_lab_id UUID)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
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
  
  -- Get or create sequence for today
  INSERT INTO patient_id_sequences (branch_id, sequence_date, last_sequence)
  VALUES (p_branch_id, v_current_date, 1)
  ON CONFLICT (branch_id, sequence_date)
  DO UPDATE SET 
    last_sequence = patient_id_sequences.last_sequence + 1,
    updated_at = NOW()
  RETURNING last_sequence INTO v_sequence;
  
  -- Generate patient ID with branch code
  v_patient_id := v_lab_initials || '-' ||
                  v_branch_code || '-' ||
                  TO_CHAR(v_current_date, 'YYYYMMDD') || 
                  '/' || 
                  LPAD(v_sequence::TEXT, 3, '0');
  
  RETURN v_patient_id;
END;
$$;

-- Fix search_path for get_next_patient_id function
DROP FUNCTION IF EXISTS get_next_patient_id(UUID, UUID);

CREATE OR REPLACE FUNCTION public.get_next_patient_id(p_branch_id UUID, p_lab_id UUID)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN generate_patient_id(p_branch_id, p_lab_id);
END;
$$;