-- Update cleanup to handle audit_logs FK constraint
CREATE OR REPLACE FUNCTION public.cleanup_test_environment()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  v_deleted_counts jsonb;
  v_patients_count int := 0;
  v_bills_count int := 0;
  v_payments_count int := 0;
  v_reports_count int := 0;
  v_documents_count int := 0;
  v_feedback_count int := 0;
  v_followups_count int := 0;
  v_branches_count int := 0;
  v_labs_count int := 0;
  v_orgs_count int := 0;
  v_users_count int := 0;
  v_profiles_count int := 0;
  v_login_attempts_count int := 0;
  v_audit_logs_count int := 0;
BEGIN
  -- Delete in order respecting foreign keys
  
  -- Delete login attempts for test users
  DELETE FROM login_attempts WHERE username LIKE 'test_%@test.labflow.com';
  GET DIAGNOSTICS v_login_attempts_count = ROW_COUNT;
  
  -- Delete audit logs for test branches/labs FIRST
  DELETE FROM audit_logs WHERE branch_id IN (
    SELECT id FROM branches WHERE name LIKE 'TEST_%'
  ) OR lab_id IN (
    SELECT id FROM labs WHERE name LIKE 'TEST_%'
  );
  GET DIAGNOSTICS v_audit_logs_count = ROW_COUNT;
  
  -- Delete bill payments for test bills
  DELETE FROM bill_payments WHERE bill_id IN (
    SELECT id FROM bills WHERE bill_number LIKE 'TL-TEST-%' OR bill_number LIKE 'TL2-TEST-%'
  );
  GET DIAGNOSTICS v_payments_count = ROW_COUNT;
  
  -- Delete test followups
  DELETE FROM patient_followups WHERE title LIKE 'TEST_%';
  GET DIAGNOSTICS v_followups_count = ROW_COUNT;
  
  -- Delete test feedback
  DELETE FROM feedback WHERE message LIKE 'TEST FEEDBACK%' OR message LIKE 'TEST_%';
  GET DIAGNOSTICS v_feedback_count = ROW_COUNT;
  
  -- Delete test documents
  DELETE FROM documents WHERE file_name LIKE 'TEST_%';
  GET DIAGNOSTICS v_documents_count = ROW_COUNT;
  
  -- Delete test reports (using test_type column)
  DELETE FROM test_reports WHERE test_type LIKE 'TEST_%';
  GET DIAGNOSTICS v_reports_count = ROW_COUNT;
  
  -- Delete test bills
  DELETE FROM bills WHERE bill_number LIKE 'TL-TEST-%' OR bill_number LIKE 'TL2-TEST-%';
  GET DIAGNOSTICS v_bills_count = ROW_COUNT;
  
  -- Delete test patients
  DELETE FROM patients WHERE full_name LIKE 'TEST %' OR patient_id LIKE '%/TEST%';
  GET DIAGNOSTICS v_patients_count = ROW_COUNT;
  
  -- Delete patient ID sequences for test branches
  DELETE FROM patient_id_sequences WHERE branch_id IN (
    SELECT id FROM branches WHERE name LIKE 'TEST_%'
  );
  
  -- Delete bill number sequences for test labs
  DELETE FROM bill_number_sequences WHERE lab_id IN (
    SELECT id FROM labs WHERE name LIKE 'TEST_%'
  );
  
  -- Delete test profiles
  DELETE FROM profiles WHERE email LIKE 'test_%@test.labflow.com';
  GET DIAGNOSTICS v_profiles_count = ROW_COUNT;
  
  -- Delete test users from auth.users
  DELETE FROM auth.users WHERE email LIKE 'test_%@test.labflow.com';
  GET DIAGNOSTICS v_users_count = ROW_COUNT;
  
  -- Delete test branches
  DELETE FROM branches WHERE name LIKE 'TEST_%';
  GET DIAGNOSTICS v_branches_count = ROW_COUNT;
  
  -- Delete test labs
  DELETE FROM labs WHERE name LIKE 'TEST_%';
  GET DIAGNOSTICS v_labs_count = ROW_COUNT;
  
  -- Delete test organizations
  DELETE FROM organizations WHERE name LIKE 'TEST_%';
  GET DIAGNOSTICS v_orgs_count = ROW_COUNT;
  
  v_deleted_counts := jsonb_build_object(
    'patients', v_patients_count,
    'bills', v_bills_count,
    'payments', v_payments_count,
    'reports', v_reports_count,
    'documents', v_documents_count,
    'feedback', v_feedback_count,
    'followups', v_followups_count,
    'branches', v_branches_count,
    'labs', v_labs_count,
    'organizations', v_orgs_count,
    'users', v_users_count,
    'profiles', v_profiles_count,
    'login_attempts', v_login_attempts_count,
    'audit_logs', v_audit_logs_count
  );
  
  RETURN v_deleted_counts;
END;
$$;