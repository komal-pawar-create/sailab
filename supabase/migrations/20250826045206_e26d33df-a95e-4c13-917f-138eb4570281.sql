-- Add initials column to labs table
ALTER TABLE labs ADD COLUMN IF NOT EXISTS initials TEXT;

-- Update existing labs with initials
UPDATE labs SET initials = 
  CASE 
    WHEN name LIKE 'Sai Lab%' THEN 'SL'
    ELSE UPPER(LEFT(REGEXP_REPLACE(name, '[^A-Za-z]', '', 'g'), 2))
  END
WHERE initials IS NULL;

ALTER TABLE labs ALTER COLUMN initials SET NOT NULL;

-- Add branch_code column to branches table
ALTER TABLE branches ADD COLUMN IF NOT EXISTS branch_code TEXT;

-- Update existing branches with codes
UPDATE branches SET branch_code = 
  CASE 
    WHEN name = 'Sangamner' THEN 'SAN'
    WHEN name = 'pune' THEN 'PUN'
    WHEN name = 'Loni' THEN 'LON'
    WHEN name = 'Sinner' THEN 'SIN'
    ELSE UPPER(LEFT(REGEXP_REPLACE(name, '[^A-Za-z]', '', 'g'), 3))
  END
WHERE branch_code IS NULL;

ALTER TABLE branches ALTER COLUMN branch_code SET NOT NULL;

-- Add unique constraint to ensure branch codes are unique within an organization
ALTER TABLE branches ADD CONSTRAINT unique_branch_code_per_org 
  UNIQUE (organization_id, branch_code);

-- Create sequence tracking table
CREATE TABLE IF NOT EXISTS patient_id_sequences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  branch_id UUID REFERENCES branches(id) NOT NULL,
  sequence_date DATE NOT NULL,
  last_sequence INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(branch_id, sequence_date)
);

-- Enable RLS
ALTER TABLE patient_id_sequences ENABLE ROW LEVEL SECURITY;

-- Create policies for patient_id_sequences
CREATE POLICY "Branch operators can manage sequences in their branch" ON patient_id_sequences
  FOR ALL USING (branch_id = get_user_branch(auth.uid()))
  WITH CHECK (branch_id = get_user_branch(auth.uid()));

CREATE POLICY "Lab admins can manage sequences in their organization" ON patient_id_sequences
  FOR ALL USING (EXISTS (
    SELECT 1 FROM branches b 
    WHERE b.id = patient_id_sequences.branch_id 
    AND b.organization_id = get_user_organization(auth.uid())
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM branches b 
    WHERE b.id = patient_id_sequences.branch_id 
    AND b.organization_id = get_user_organization(auth.uid())
  ));

CREATE POLICY "Super admins can manage all sequences" ON patient_id_sequences
  FOR ALL USING (is_super_admin(auth.uid()))
  WITH CHECK (is_super_admin(auth.uid()));

-- Create function to generate patient IDs with branch code
CREATE OR REPLACE FUNCTION generate_patient_id(p_branch_id UUID, p_lab_id UUID)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
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

-- Create RPC endpoint
CREATE OR REPLACE FUNCTION public.get_next_patient_id(p_branch_id UUID, p_lab_id UUID)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN generate_patient_id(p_branch_id, p_lab_id);
END;
$$;