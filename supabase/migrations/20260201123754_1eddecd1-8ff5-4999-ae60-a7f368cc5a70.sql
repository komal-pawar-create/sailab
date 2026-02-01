-- Enable pgcrypto extension for password hashing
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Recreate setup function with proper password hashing
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
  
  -- Create test users in auth.users using pgcrypto
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
  
  -- Create test report (using test_type column, not test_name)
  INSERT INTO test_reports (id, patient_id, lab_id, branch_id, test_type, status, created_by)
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