-- =============================================
-- Comprehensive Data Validation for LabFlow Tables
-- First: Clean up existing data, then apply constraints
-- =============================================

-- =============================================
-- 0. DATA CLEANUP (fix existing invalid data)
-- =============================================

-- Fix empty gender strings to NULL
UPDATE public.patients SET gender = NULL WHERE gender = '';

-- Normalize existing gender values to uppercase
UPDATE public.patients SET gender = UPPER(TRIM(gender)) WHERE gender IS NOT NULL;

-- =============================================
-- 1. PATIENTS TABLE VALIDATION
-- =============================================

-- Check constraints for patients table (skip if already exists)
DO $$ BEGIN
  ALTER TABLE public.patients
    ADD CONSTRAINT patients_full_name_length 
      CHECK (char_length(full_name) >= 2 AND char_length(full_name) <= 100);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE public.patients
    ADD CONSTRAINT patients_age_range 
      CHECK (age IS NULL OR (age >= 0 AND age <= 150));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE public.patients
    ADD CONSTRAINT patients_age_in_months_range 
      CHECK (age_in_months IS NULL OR (age_in_months >= 0 AND age_in_months <= 1800));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE public.patients
    ADD CONSTRAINT patients_gender_values 
      CHECK (gender IS NULL OR gender IN ('MALE', 'FEMALE', 'OTHER'));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Validation trigger for patients (phone normalization, name validation)
CREATE OR REPLACE FUNCTION public.validate_patient_data()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Normalize phone: remove spaces and special characters
  IF NEW.phone IS NOT NULL THEN
    NEW.phone := regexp_replace(NEW.phone, '[^0-9]', '', 'g');
    IF NOT (NEW.phone ~ '^[0-9]{10}$') THEN
      RAISE EXCEPTION 'Phone number must be exactly 10 digits';
    END IF;
  END IF;
  
  -- Normalize and validate full_name
  NEW.full_name := UPPER(TRIM(NEW.full_name));
  IF char_length(NEW.full_name) < 2 THEN
    RAISE EXCEPTION 'Patient name must be at least 2 characters';
  END IF;
  
  -- Auto-calculate age_in_months if age provided but months not
  IF NEW.age IS NOT NULL AND NEW.age_in_months IS NULL THEN
    NEW.age_in_months := NEW.age * 12;
  END IF;
  
  -- Normalize gender to uppercase, convert empty to NULL
  IF NEW.gender IS NOT NULL THEN
    NEW.gender := NULLIF(UPPER(TRIM(NEW.gender)), '');
  END IF;
  
  RETURN NEW;
END;
$$;

-- Apply validation trigger to patients table
DROP TRIGGER IF EXISTS validate_patient_before_save ON public.patients;
CREATE TRIGGER validate_patient_before_save
  BEFORE INSERT OR UPDATE ON public.patients
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_patient_data();

-- NOTE: Skipping unique phone per lab constraint since multiple family members 
-- can share the same phone number in clinical settings

-- =============================================
-- 2. BILLS TABLE VALIDATION
-- =============================================

-- Check constraints for bills table
DO $$ BEGIN
  ALTER TABLE public.bills
    ADD CONSTRAINT bills_total_amount_positive 
      CHECK (total_amount >= 0);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE public.bills
    ADD CONSTRAINT bills_paid_amount_positive 
      CHECK (paid_amount IS NULL OR paid_amount >= 0);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE public.bills
    ADD CONSTRAINT bills_due_amount_positive 
      CHECK (due_amount >= 0);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE public.bills
    ADD CONSTRAINT bills_discount_amount_valid 
      CHECK (discount_amount IS NULL OR discount_amount >= 0);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE public.bills
    ADD CONSTRAINT bills_discount_not_exceed_total 
      CHECK (discount_amount IS NULL OR discount_amount <= total_amount);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Unique bill number per lab
CREATE UNIQUE INDEX IF NOT EXISTS idx_bills_number_lab_unique 
  ON public.bills (lab_id, bill_number);

-- =============================================
-- 3. TEST REPORTS TABLE VALIDATION
-- =============================================

-- Add status check constraint for test_reports
DO $$ BEGIN
  ALTER TABLE public.test_reports
    ADD CONSTRAINT test_reports_status_values 
      CHECK (status IN ('pending', 'in_progress', 'completed', 'delivered'));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- =============================================
-- 4. BILL NUMBER AUTO-GENERATION
-- =============================================

-- Create sequence tracking table for bill numbers
CREATE TABLE IF NOT EXISTS public.bill_number_sequences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lab_id UUID NOT NULL REFERENCES public.labs(id) ON DELETE CASCADE,
  year_month TEXT NOT NULL,
  last_sequence INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(lab_id, year_month)
);

-- Enable RLS on bill_number_sequences
ALTER TABLE public.bill_number_sequences ENABLE ROW LEVEL SECURITY;

-- RLS Policies for bill_number_sequences (use DO block to avoid errors)
DO $$ BEGIN
  CREATE POLICY "Operators can access lab sequences"
    ON public.bill_number_sequences FOR ALL
    USING (lab_id = get_user_lab(auth.uid()));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Super admins manage all sequences"
    ON public.bill_number_sequences FOR ALL
    USING (is_super_admin(auth.uid()));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Function to generate bill number: LAB-YYYYMM-XXXX
CREATE OR REPLACE FUNCTION public.generate_bill_number(p_lab_id UUID)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_lab_initials TEXT;
  v_year_month TEXT;
  v_sequence INTEGER;
  v_bill_number TEXT;
BEGIN
  -- Get lab initials
  SELECT initials INTO v_lab_initials
  FROM labs WHERE id = p_lab_id;
  
  IF v_lab_initials IS NULL THEN
    RAISE EXCEPTION 'Lab not found or initials not set';
  END IF;
  
  -- Get current year-month
  v_year_month := TO_CHAR(CURRENT_DATE, 'YYYYMM');
  
  -- Get or create sequence for this month (atomic operation)
  INSERT INTO bill_number_sequences (lab_id, year_month, last_sequence)
  VALUES (p_lab_id, v_year_month, 1)
  ON CONFLICT (lab_id, year_month)
  DO UPDATE SET 
    last_sequence = bill_number_sequences.last_sequence + 1,
    updated_at = NOW()
  RETURNING last_sequence INTO v_sequence;
  
  -- Generate bill number: LAB-YYYYMM-XXXX
  v_bill_number := v_lab_initials || '-' || v_year_month || '-' || LPAD(v_sequence::TEXT, 4, '0');
  
  RETURN v_bill_number;
END;
$$;

-- Function to preview bill number without consuming sequence
CREATE OR REPLACE FUNCTION public.preview_bill_number(p_lab_id UUID)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_lab_initials TEXT;
  v_year_month TEXT;
  v_sequence INTEGER;
  v_bill_number TEXT;
BEGIN
  SELECT initials INTO v_lab_initials FROM labs WHERE id = p_lab_id;
  
  IF v_lab_initials IS NULL THEN
    RAISE EXCEPTION 'Lab not found or initials not set';
  END IF;
  
  v_year_month := TO_CHAR(CURRENT_DATE, 'YYYYMM');
  
  -- Get next sequence without incrementing
  SELECT COALESCE(last_sequence, 0) + 1 INTO v_sequence
  FROM bill_number_sequences
  WHERE lab_id = p_lab_id AND year_month = v_year_month;
  
  IF v_sequence IS NULL THEN
    v_sequence := 1;
  END IF;
  
  v_bill_number := v_lab_initials || '-' || v_year_month || '-' || LPAD(v_sequence::TEXT, 4, '0');
  
  RETURN v_bill_number;
END;
$$;

-- =============================================
-- 5. BILL PAYMENTS VALIDATION
-- =============================================

-- Add check constraint for payment amounts
DO $$ BEGIN
  ALTER TABLE public.bill_payments
    ADD CONSTRAINT bill_payments_amount_positive 
      CHECK (payment_amount > 0);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;