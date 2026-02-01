-- ============================================
-- Test Environment Setup & Cleanup Functions
-- ============================================

-- Function to setup test environment with isolated test data
CREATE OR REPLACE FUNCTION public.setup_test_environment()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  v_org_id uuid;
  v_lab_id uuid;
  v_branch_id uuid;
  v_other_org_id uuid;
  v_other_lab_id uuid;
  v_other_branch_id uuid;
  v_super_admin_id uuid;
  v_lab_admin_id uuid;
  v_operator_id uuid;
  v_other_operator_id uuid;
  v_patient_id uuid;
  v_bill_id uuid;
  v_test_report_id uuid;
  v_document_id uuid;
  v_feedback_id uuid;
  v_followup_id uuid;
BEGIN
  -- Clean up any existing test data first
  PERFORM cleanup_test_environment();
  
  -- Create TEST_ORG_001
  INSERT INTO organizations (id, name, description, created_by)
  VALUES (
    gen_random_uuid(),
    'TEST_ORG_001',
    'Test organization for API testing',
    '00000000-0000-0000-0000-000000000000'::uuid
  )
  RETURNING id INTO v_org_id;
  
  -- Create TEST_LAB_001
  INSERT INTO labs (id, name, initials, organization_id)
  VALUES (
    gen_random_uuid(),
    'TEST_LAB_001',
    'TL',
    v_org_id
  )
  RETURNING id INTO v_lab_id;
  
  -- Create TEST_BRANCH_001
  INSERT INTO branches (id, name, branch_code, organization_id, lab_id, created_by)
  VALUES (
    gen_random_uuid(),
    'TEST_BRANCH_001',
    'TB01',
    v_org_id,
    v_lab_id,
    '00000000-0000-0000-0000-000000000000'::uuid
  )
  RETURNING id INTO v_branch_id;
  
  -- Create second org/lab for cross-tenant testing
  INSERT INTO organizations (id, name, description, created_by)
  VALUES (
    gen_random_uuid(),
    'TEST_ORG_002',
    'Second test organization for cross-tenant testing',
    '00000000-0000-0000-0000-000000000000'::uuid
  )
  RETURNING id INTO v_other_org_id;
  
  INSERT INTO labs (id, name, initials, organization_id)
  VALUES (
    gen_random_uuid(),
    'TEST_LAB_002',
    'TL2',
    v_other_org_id
  )
  RETURNING id INTO v_other_lab_id;
  
  INSERT INTO branches (id, name, branch_code, organization_id, lab_id, created_by)
  VALUES (
    gen_random_uuid(),
    'TEST_BRANCH_002',
    'TB02',
    v_other_org_id,
    v_other_lab_id,
    '00000000-0000-0000-0000-000000000000'::uuid
  )
  RETURNING id INTO v_other_branch_id;
  
  -- Create test users in auth.users (requires service role)
  -- Super admin
  INSERT INTO auth.users (
    id, email, encrypted_password, email_confirmed_at,
    raw_user_meta_data, created_at, updated_at, instance_id, aud, role
  )
  VALUES (
    gen_random_uuid(),
    'test_super_admin@test.labflow.com',
    crypt('TestPass123!', gen_salt('bf')),
    now(),
    jsonb_build_object('full_name', 'Test Super Admin', 'role', 'super_admin', 'skip_email_confirmation', true),
    now(), now(), '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated'
  )
  RETURNING id INTO v_super_admin_id;
  
  -- Lab admin
  INSERT INTO auth.users (
    id, email, encrypted_password, email_confirmed_at,
    raw_user_meta_data, created_at, updated_at, instance_id, aud, role
  )
  VALUES (
    gen_random_uuid(),
    'test_lab_admin@test.labflow.com',
    crypt('TestPass123!', gen_salt('bf')),
    now(),
    jsonb_build_object('full_name', 'Test Lab Admin', 'role', 'lab_admin', 'lab_id', v_lab_id, 'branch_id', v_branch_id, 'skip_email_confirmation', true),
    now(), now(), '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated'
  )
  RETURNING id INTO v_lab_admin_id;
  
  -- Branch operator
  INSERT INTO auth.users (
    id, email, encrypted_password, email_confirmed_at,
    raw_user_meta_data, created_at, updated_at, instance_id, aud, role
  )
  VALUES (
    gen_random_uuid(),
    'test_operator@test.labflow.com',
    crypt('TestPass123!', gen_salt('bf')),
    now(),
    jsonb_build_object('full_name', 'Test Operator', 'role', 'branch_operator', 'lab_id', v_lab_id, 'branch_id', v_branch_id, 'skip_email_confirmation', true),
    now(), now(), '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated'
  )
  RETURNING id INTO v_operator_id;
  
  -- Operator from other lab (for cross-tenant testing)
  INSERT INTO auth.users (
    id, email, encrypted_password, email_confirmed_at,
    raw_user_meta_data, created_at, updated_at, instance_id, aud, role
  )
  VALUES (
    gen_random_uuid(),
    'test_operator_other@test.labflow.com',
    crypt('TestPass123!', gen_salt('bf')),
    now(),
    jsonb_build_object('full_name', 'Test Operator Other', 'role', 'branch_operator', 'lab_id', v_other_lab_id, 'branch_id', v_other_branch_id, 'skip_email_confirmation', true),
    now(), now(), '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated'
  )
  RETURNING id INTO v_other_operator_id;
  
  -- Create test patient
  INSERT INTO patients (id, patient_id, full_name, phone, lab_id, branch_id, created_by)
  VALUES (
    gen_random_uuid(),
    'TL-TB01-20260201/TEST',
    'TEST PATIENT ONE',
    '9999999901',
    v_lab_id,
    v_branch_id,
    v_operator_id
  )
  RETURNING id INTO v_patient_id;
  
  -- Create test bill
  INSERT INTO bills (id, bill_number, patient_id, lab_id, branch_id, total_amount, due_amount, due_date, items, created_by)
  VALUES (
    gen_random_uuid(),
    'TL-TEST-0001',
    v_patient_id,
    v_lab_id,
    v_branch_id,
    1000.00,
    1000.00,
    CURRENT_DATE + INTERVAL '7 days',
    '[{"name": "CBC Test", "price": 500}, {"name": "Lipid Panel", "price": 500}]'::jsonb,
    v_operator_id
  )
  RETURNING id INTO v_bill_id;
  
  -- Create test report
  INSERT INTO test_reports (id, patient_id, lab_id, branch_id, test_name, status, created_by)
  VALUES (
    gen_random_uuid(),
    v_patient_id,
    v_lab_id,
    v_branch_id,
    'TEST_CBC_REPORT',
    'pending',
    v_operator_id
  )
  RETURNING id INTO v_test_report_id;
  
  -- Create test document
  INSERT INTO documents (id, patient_id, lab_id, branch_id, file_name, file_type, uploaded_by)
  VALUES (
    gen_random_uuid(),
    v_patient_id,
    v_lab_id,
    v_branch_id,
    'TEST_DOCUMENT.pdf',
    'application/pdf',
    v_operator_id
  )
  RETURNING id INTO v_document_id;
  
  -- Create test feedback
  INSERT INTO feedback (id, patient_id, lab_id, branch_id, feedback_type, message, rating)
  VALUES (
    gen_random_uuid(),
    v_patient_id,
    v_lab_id,
    v_branch_id,
    'positive',
    'TEST FEEDBACK - Excellent service!',
    5
  )
  RETURNING id INTO v_feedback_id;
  
  -- Create test followup
  INSERT INTO patient_followups (id, patient_id, lab_id, branch_id, title, due_at, assigned_to, created_by)
  VALUES (
    gen_random_uuid(),
    v_patient_id,
    v_lab_id,
    v_branch_id,
    'TEST_FOLLOWUP',
    now() + INTERVAL '7 days',
    v_operator_id,
    v_operator_id
  )
  RETURNING id INTO v_followup_id;
  
  -- Return all created IDs for test reference
  RETURN jsonb_build_object(
    'organization_id', v_org_id,
    'lab_id', v_lab_id,
    'branch_id', v_branch_id,
    'other_organization_id', v_other_org_id,
    'other_lab_id', v_other_lab_id,
    'other_branch_id', v_other_branch_id,
    'super_admin_id', v_super_admin_id,
    'lab_admin_id', v_lab_admin_id,
    'operator_id', v_operator_id,
    'other_operator_id', v_other_operator_id,
    'patient_id', v_patient_id,
    'bill_id', v_bill_id,
    'test_report_id', v_test_report_id,
    'document_id', v_document_id,
    'feedback_id', v_feedback_id,
    'followup_id', v_followup_id
  );
END;
$$;

-- Function to cleanup test environment
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
BEGIN
  -- Delete in order respecting foreign keys
  
  -- Delete login attempts for test users
  DELETE FROM login_attempts WHERE username LIKE 'test_%@test.labflow.com';
  GET DIAGNOSTICS v_login_attempts_count = ROW_COUNT;
  
  -- Delete bill payments for test bills
  DELETE FROM bill_payments WHERE bill_id IN (
    SELECT id FROM bills WHERE bill_number LIKE 'TL-TEST-%'
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
  
  -- Delete test reports
  DELETE FROM test_reports WHERE test_name LIKE 'TEST_%';
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
    'login_attempts', v_login_attempts_count
  );
  
  RETURN v_deleted_counts;
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION public.setup_test_environment() TO service_role;
GRANT EXECUTE ON FUNCTION public.cleanup_test_environment() TO service_role;