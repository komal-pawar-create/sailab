-- Step 1: Update log_audit_event to properly handle system-level updates (null user)
CREATE OR REPLACE FUNCTION public.log_audit_event(p_action text, p_table_name text, p_record_id uuid, p_old_data jsonb DEFAULT NULL::jsonb, p_new_data jsonb DEFAULT NULL::jsonb)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_user_email text := 'system';
  v_user_role text := 'system';
  v_branch_id uuid := NULL;
  v_lab_id uuid := NULL;
  v_audit_id UUID;
  v_user_id uuid;
BEGIN
  v_user_id := auth.uid();
  
  -- Get user profile information if user is authenticated
  IF v_user_id IS NOT NULL THEN
    SELECT 
      p.email,
      p.role::TEXT,
      p.branch_id,
      p.lab_id
    INTO v_user_email, v_user_role, v_branch_id, v_lab_id
    FROM profiles p
    WHERE p.user_id = v_user_id;
  END IF;
  
  -- Insert audit log with system user fallback for migrations
  INSERT INTO audit_logs (
    user_id,
    user_email,
    user_role,
    action,
    table_name,
    record_id,
    old_data,
    new_data,
    branch_id,
    lab_id
  ) VALUES (
    COALESCE(v_user_id, '00000000-0000-0000-0000-000000000000'::uuid),
    COALESCE(v_user_email, 'system'),
    COALESCE(v_user_role, 'system'),
    p_action,
    p_table_name,
    p_record_id,
    p_old_data,
    p_new_data,
    v_branch_id,
    v_lab_id
  )
  RETURNING id INTO v_audit_id;
  
  RETURN v_audit_id;
END;
$function$;

-- Step 2: Fix existing profiles - set lab_id from branch's lab_id
UPDATE profiles p
SET lab_id = b.lab_id
FROM branches b
WHERE p.branch_id = b.id
AND (p.lab_id IS NULL OR p.lab_id != b.lab_id);

-- Step 3: Fix existing patients - derive lab_id from branch_id
UPDATE patients p
SET lab_id = b.lab_id
FROM branches b
WHERE p.branch_id = b.id
AND p.lab_id != b.lab_id;

-- Step 4: Fix existing test_reports
UPDATE test_reports tr
SET lab_id = b.lab_id
FROM branches b
WHERE tr.branch_id = b.id
AND tr.lab_id != b.lab_id;

-- Step 5: Fix existing documents
UPDATE documents d
SET lab_id = b.lab_id
FROM branches b
WHERE d.branch_id = b.id
AND d.lab_id != b.lab_id;

-- Step 6: Fix existing bills
UPDATE bills bl
SET lab_id = b.lab_id
FROM branches b
WHERE bl.branch_id = b.id
AND bl.lab_id != b.lab_id;

-- Step 7: Fix existing patient_followups
UPDATE patient_followups pf
SET lab_id = b.lab_id
FROM branches b
WHERE pf.branch_id = b.id
AND pf.lab_id != b.lab_id;

-- Step 8: Fix existing feedback
UPDATE feedback f
SET lab_id = b.lab_id
FROM branches b
WHERE f.branch_id = b.id
AND f.lab_id != b.lab_id;

-- Step 9: Create function to enforce lab_id matches branch
CREATE OR REPLACE FUNCTION public.ensure_lab_id_matches_branch()
RETURNS TRIGGER AS $$
DECLARE
  v_lab_id uuid;
BEGIN
  -- If branch_id is set, automatically set lab_id from branch
  IF NEW.branch_id IS NOT NULL THEN
    SELECT lab_id INTO v_lab_id
    FROM branches
    WHERE id = NEW.branch_id;
    
    IF v_lab_id IS NOT NULL THEN
      NEW.lab_id := v_lab_id;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Step 10: Create triggers on all data tables to enforce lab_id alignment
-- Drop if exists first to avoid errors
DROP TRIGGER IF EXISTS ensure_lab_id_patients ON patients;
DROP TRIGGER IF EXISTS ensure_lab_id_test_reports ON test_reports;
DROP TRIGGER IF EXISTS ensure_lab_id_documents ON documents;
DROP TRIGGER IF EXISTS ensure_lab_id_bills ON bills;
DROP TRIGGER IF EXISTS ensure_lab_id_patient_followups ON patient_followups;
DROP TRIGGER IF EXISTS ensure_lab_id_feedback ON feedback;

CREATE TRIGGER ensure_lab_id_patients
  BEFORE INSERT OR UPDATE ON patients
  FOR EACH ROW
  EXECUTE FUNCTION ensure_lab_id_matches_branch();

CREATE TRIGGER ensure_lab_id_test_reports
  BEFORE INSERT OR UPDATE ON test_reports
  FOR EACH ROW
  EXECUTE FUNCTION ensure_lab_id_matches_branch();

CREATE TRIGGER ensure_lab_id_documents
  BEFORE INSERT OR UPDATE ON documents
  FOR EACH ROW
  EXECUTE FUNCTION ensure_lab_id_matches_branch();

CREATE TRIGGER ensure_lab_id_bills
  BEFORE INSERT OR UPDATE ON bills
  FOR EACH ROW
  EXECUTE FUNCTION ensure_lab_id_matches_branch();

CREATE TRIGGER ensure_lab_id_patient_followups
  BEFORE INSERT OR UPDATE ON patient_followups
  FOR EACH ROW
  EXECUTE FUNCTION ensure_lab_id_matches_branch();

CREATE TRIGGER ensure_lab_id_feedback
  BEFORE INSERT OR UPDATE ON feedback
  FOR EACH ROW
  EXECUTE FUNCTION ensure_lab_id_matches_branch();