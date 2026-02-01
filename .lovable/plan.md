

# Comprehensive Data Validation Plan for LabFlow Tables

## Overview
Add robust database-level validation to all LabFlow core tables using CHECK constraints, trigger functions, and unique constraints. This ensures data integrity at the database level regardless of how data is inserted.

---

## Current State Analysis

### Existing Validation
| Table | Current Constraints | Current Triggers |
|-------|---------------------|------------------|
| **patients** | `UNIQUE(lab_id, patient_id)` | `update_updated_at`, `ensure_lab_id_matches_branch` |
| **bills** | `CHECK (status IN ('pending', 'paid', 'partially_paid', 'overdue'))` | `update_updated_at`, `update_bill_after_payment` |
| **test_reports** | None | `update_updated_at` |
| **feedback** | `CHECK (rating >= 1 AND rating <= 5)` | None |

### Identified Gaps
1. **patients**: No validation on full_name length, age range, gender values, phone format, or email format
2. **bills**: No validation on amounts being non-negative, discount limits
3. **test_reports**: Status values not constrained
4. **Phone/email uniqueness**: No unique constraints per lab
5. **Bill number generation**: Currently client-side random string

---

## Database Schema Changes

### 1. Patients Table Validation

```sql
-- Add CHECK constraints for patients table
ALTER TABLE public.patients
  ADD CONSTRAINT patients_full_name_length 
    CHECK (char_length(full_name) >= 2 AND char_length(full_name) <= 100),
  ADD CONSTRAINT patients_age_range 
    CHECK (age IS NULL OR (age >= 0 AND age <= 150)),
  ADD CONSTRAINT patients_age_in_months_range 
    CHECK (age_in_months IS NULL OR (age_in_months >= 0 AND age_in_months <= 1800)),
  ADD CONSTRAINT patients_gender_values 
    CHECK (gender IS NULL OR gender IN ('MALE', 'FEMALE', 'OTHER'));

-- Phone validation trigger (more flexible than regex CHECK)
CREATE OR REPLACE FUNCTION validate_phone_number()
RETURNS TRIGGER AS $$
BEGIN
  -- Allow NULL phones (if field is optional)
  IF NEW.phone IS NOT NULL THEN
    -- Remove spaces and check if it's 10 digits
    NEW.phone := regexp_replace(NEW.phone, '\s', '', 'g');
    IF NOT (NEW.phone ~ '^[0-9]{10}$') THEN
      RAISE EXCEPTION 'Phone number must be exactly 10 digits';
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

**Note**: Phone is currently NOT NULL in the schema, so the trigger will validate all phones.

### 2. Bills Table Validation

```sql
-- Add CHECK constraints for bills table
ALTER TABLE public.bills
  ADD CONSTRAINT bills_total_amount_positive 
    CHECK (total_amount >= 0),
  ADD CONSTRAINT bills_paid_amount_positive 
    CHECK (paid_amount IS NULL OR paid_amount >= 0),
  ADD CONSTRAINT bills_due_amount_positive 
    CHECK (due_amount >= 0),
  ADD CONSTRAINT bills_discount_amount_valid 
    CHECK (discount_amount IS NULL OR discount_amount >= 0),
  ADD CONSTRAINT bills_discount_not_exceed_total 
    CHECK (discount_amount IS NULL OR discount_amount <= total_amount);
```

### 3. Test Reports Table Validation

```sql
-- Add status CHECK constraint for test_reports
ALTER TABLE public.test_reports
  ADD CONSTRAINT test_reports_status_values 
    CHECK (status IN ('pending', 'in_progress', 'completed', 'delivered'));
```

---

## Trigger Functions for Auto-Generation

### 1. Bill Number Auto-Generation

Create a database function to generate bill numbers in the format `LAB-YYYYMM-XXXX`:

```sql
-- Create sequence tracking table for bill numbers (like patient IDs)
CREATE TABLE IF NOT EXISTS public.bill_number_sequences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lab_id UUID NOT NULL REFERENCES public.labs(id) ON DELETE CASCADE,
  year_month TEXT NOT NULL, -- Format: YYYYMM
  last_sequence INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(lab_id, year_month)
);

-- Function to generate bill number
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
  
  -- Get or create sequence for this month
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
```

### 2. Preview Bill Number Function

```sql
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
```

---

## Unique Constraints

### 1. Phone Uniqueness Per Lab

```sql
-- Create partial unique index for phone per lab (allows NULLs)
-- Note: phone is NOT NULL currently, so this is effectively a full unique
CREATE UNIQUE INDEX IF NOT EXISTS idx_patients_phone_lab_unique 
  ON public.patients (lab_id, phone);
```

### 2. Bill Number Uniqueness Per Lab

```sql
-- Bill number should be unique per lab (not globally)
-- Drop existing global unique if present, add lab-scoped
DROP INDEX IF EXISTS bills_bill_number_key;
CREATE UNIQUE INDEX IF NOT EXISTS idx_bills_number_lab_unique 
  ON public.bills (lab_id, bill_number);
```

---

## Validation Trigger for Data Integrity

### Combined Validation Trigger

```sql
CREATE OR REPLACE FUNCTION public.validate_patient_data()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Normalize phone: remove spaces
  IF NEW.phone IS NOT NULL THEN
    NEW.phone := regexp_replace(NEW.phone, '\s', '', 'g');
    IF NOT (NEW.phone ~ '^[0-9]{10}$') THEN
      RAISE EXCEPTION 'Phone number must be exactly 10 digits';
    END IF;
  END IF;
  
  -- Normalize and validate full_name
  NEW.full_name := UPPER(TRIM(NEW.full_name));
  IF char_length(NEW.full_name) < 2 THEN
    RAISE EXCEPTION 'Patient name must be at least 2 characters';
  END IF;
  
  -- Validate age consistency
  IF NEW.age IS NOT NULL AND NEW.age_in_months IS NULL THEN
    -- Auto-calculate age_in_months if not provided
    NEW.age_in_months := NEW.age * 12;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Apply to patients table
CREATE TRIGGER validate_patient_before_save
  BEFORE INSERT OR UPDATE ON public.patients
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_patient_data();
```

---

## RLS for New Sequence Table

```sql
-- Enable RLS on bill_number_sequences
ALTER TABLE public.bill_number_sequences ENABLE ROW LEVEL SECURITY;

-- Branch operators can access sequences for their lab
CREATE POLICY "Operators can access lab sequences"
  ON bill_number_sequences FOR ALL
  USING (lab_id = get_user_lab(auth.uid()));

-- Super admins can manage all
CREATE POLICY "Super admins manage all sequences"
  ON bill_number_sequences FOR ALL
  USING (is_super_admin(auth.uid()));
```

---

## Frontend Updates Required

### AddBillForm.tsx Changes

Replace the client-side `generateBillNumber` function:

```typescript
// Current (random):
const billNumber = `BILL-${now.getFullYear()}...${random}`;

// New (database-generated):
const { data: billNumber, error } = await supabase
  .rpc('preview_bill_number', { p_lab_id: labId });

// On submit, generate actual bill number:
const { data: actualBillNumber } = await supabase
  .rpc('generate_bill_number', { p_lab_id: labId });
```

---

## Implementation Summary

### Database Migration Contents

| Component | Type | Description |
|-----------|------|-------------|
| `patients_full_name_length` | CHECK | 2-100 characters |
| `patients_age_range` | CHECK | 0-150 |
| `patients_gender_values` | CHECK | MALE, FEMALE, OTHER |
| `validate_patient_data()` | TRIGGER | Phone normalization, name validation |
| `bills_*_positive` | CHECK | Non-negative amounts |
| `bills_discount_not_exceed_total` | CHECK | Discount <= Total |
| `test_reports_status_values` | CHECK | pending, in_progress, completed, delivered |
| `bill_number_sequences` | TABLE | Sequence tracking per lab/month |
| `generate_bill_number()` | FUNCTION | LAB-YYYYMM-XXXX format |
| `preview_bill_number()` | FUNCTION | Preview without consuming |
| `idx_patients_phone_lab_unique` | INDEX | Unique phone per lab |
| `idx_bills_number_lab_unique` | INDEX | Unique bill number per lab |

### Files to Modify

| File | Changes |
|------|---------|
| `supabase/migrations/[new].sql` | All schema changes |
| `src/components/forms/AddBillForm.tsx` | Use RPC for bill numbers |
| `src/components/forms/EditBillForm.tsx` | Keep existing bill number |

---

## Rollback Strategy

Each constraint is added with `IF NOT EXISTS` or wrapped in a DO block to ensure idempotency. Rollback SQL will be included in comments for each constraint.

---

## Existing Data Considerations

Before applying constraints, existing data must be validated:

```sql
-- Check for invalid phone numbers
SELECT id, phone FROM patients WHERE phone !~ '^[0-9]{10}$';

-- Check for invalid ages
SELECT id, age FROM patients WHERE age < 0 OR age > 150;

-- Check for duplicate phones per lab
SELECT lab_id, phone, COUNT(*) FROM patients 
GROUP BY lab_id, phone HAVING COUNT(*) > 1;
```

If invalid data exists, it will be cleaned up as part of the migration with appropriate notifications to super admins.

