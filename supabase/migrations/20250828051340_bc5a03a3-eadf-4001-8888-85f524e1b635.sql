-- Drop the existing function
DROP FUNCTION IF EXISTS public.clear_lab_data;

-- Create improved clear_lab_data function with proper dependency handling
CREATE OR REPLACE FUNCTION public.clear_lab_data(
  p_lab_id uuid,
  p_clear_payments boolean DEFAULT true,
  p_clear_bills boolean DEFAULT true,
  p_clear_test_reports boolean DEFAULT true,
  p_clear_documents boolean DEFAULT true,
  p_clear_followups boolean DEFAULT true,
  p_clear_feedback boolean DEFAULT true,
  p_clear_patients boolean DEFAULT true,
  p_clear_sequences boolean DEFAULT true,
  p_clear_test_types boolean DEFAULT false
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
DECLARE
  v_deleted_counts JSON;
  v_payments_count INTEGER := 0;
  v_bills_count INTEGER := 0;
  v_test_reports_count INTEGER := 0;
  v_documents_count INTEGER := 0;
  v_followups_count INTEGER := 0;
  v_feedback_count INTEGER := 0;
  v_patients_count INTEGER := 0;
  v_sequences_count INTEGER := 0;
  v_test_types_count INTEGER := 0;
  v_patient_ids uuid[];
BEGIN
  -- Check if user is super admin
  IF NOT is_super_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Only super admins can clear lab data';
  END IF;

  -- When clearing patients, we need to handle ALL dependencies first
  IF p_clear_patients THEN
    -- Get all patient IDs from this lab
    SELECT ARRAY_AGG(id) INTO v_patient_ids
    FROM patients 
    WHERE lab_id = p_lab_id;
    
    IF v_patient_ids IS NOT NULL THEN
      -- Delete ALL test reports referencing these patients (from ANY lab)
      DELETE FROM test_reports 
      WHERE patient_id = ANY(v_patient_ids);
      GET DIAGNOSTICS v_test_reports_count = ROW_COUNT;
      
      -- Delete ALL documents referencing these patients (from ANY lab)
      DELETE FROM documents 
      WHERE patient_id = ANY(v_patient_ids);
      GET DIAGNOSTICS v_documents_count = ROW_COUNT;
      
      -- Delete ALL followups referencing these patients (from ANY lab)
      DELETE FROM patient_followups 
      WHERE patient_id = ANY(v_patient_ids);
      GET DIAGNOSTICS v_followups_count = ROW_COUNT;
      
      -- Delete ALL feedback referencing these patients (from ANY lab)
      DELETE FROM feedback 
      WHERE patient_id = ANY(v_patient_ids);
      GET DIAGNOSTICS v_feedback_count = ROW_COUNT;
      
      -- Delete ALL bills referencing these patients (from ANY lab)
      -- First delete payments for these bills
      DELETE FROM bill_payments 
      WHERE bill_id IN (SELECT id FROM bills WHERE patient_id = ANY(v_patient_ids));
      GET DIAGNOSTICS v_payments_count = ROW_COUNT;
      
      DELETE FROM bills 
      WHERE patient_id = ANY(v_patient_ids);
      GET DIAGNOSTICS v_bills_count = ROW_COUNT;
    END IF;
  ELSE
    -- If not clearing patients, just clear data from this lab only
    
    -- Clear bill payments first (depends on bills)
    IF p_clear_payments THEN
      DELETE FROM bill_payments 
      WHERE bill_id IN (SELECT id FROM bills WHERE lab_id = p_lab_id);
      GET DIAGNOSTICS v_payments_count = ROW_COUNT;
    END IF;

    -- Clear bills
    IF p_clear_bills THEN
      DELETE FROM bills WHERE lab_id = p_lab_id;
      GET DIAGNOSTICS v_bills_count = ROW_COUNT;
    END IF;

    -- Clear test reports
    IF p_clear_test_reports THEN
      DELETE FROM test_reports WHERE lab_id = p_lab_id;
      GET DIAGNOSTICS v_test_reports_count = ROW_COUNT;
    END IF;

    -- Clear documents
    IF p_clear_documents THEN
      DELETE FROM documents WHERE lab_id = p_lab_id;
      GET DIAGNOSTICS v_documents_count = ROW_COUNT;
    END IF;

    -- Clear follow-ups
    IF p_clear_followups THEN
      DELETE FROM patient_followups WHERE lab_id = p_lab_id;
      GET DIAGNOSTICS v_followups_count = ROW_COUNT;
    END IF;

    -- Clear feedback
    IF p_clear_feedback THEN
      DELETE FROM feedback WHERE lab_id = p_lab_id;
      GET DIAGNOSTICS v_feedback_count = ROW_COUNT;
    END IF;
  END IF;

  -- Clear patients (after all dependencies are cleared)
  IF p_clear_patients THEN
    DELETE FROM patients WHERE lab_id = p_lab_id;
    GET DIAGNOSTICS v_patients_count = ROW_COUNT;
  END IF;

  -- Clear patient ID sequences for all branches of this lab
  IF p_clear_sequences THEN
    DELETE FROM patient_id_sequences 
    WHERE branch_id IN (SELECT id FROM branches WHERE lab_id = p_lab_id);
    GET DIAGNOSTICS v_sequences_count = ROW_COUNT;
  END IF;

  -- Clear test types (optional, independent)
  IF p_clear_test_types THEN
    DELETE FROM test_types WHERE lab_id = p_lab_id;
    GET DIAGNOSTICS v_test_types_count = ROW_COUNT;
  END IF;

  -- Return deleted counts
  v_deleted_counts := json_build_object(
    'payments', v_payments_count,
    'bills', v_bills_count,
    'test_reports', v_test_reports_count,
    'documents', v_documents_count,
    'followups', v_followups_count,
    'feedback', v_feedback_count,
    'patients', v_patients_count,
    'sequences', v_sequences_count,
    'test_types', v_test_types_count
  );

  RETURN v_deleted_counts;
END;
$function$;