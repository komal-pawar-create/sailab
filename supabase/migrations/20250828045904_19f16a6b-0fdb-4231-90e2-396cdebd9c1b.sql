-- Create function to clear lab data with proper permissions
CREATE OR REPLACE FUNCTION public.clear_lab_data(
  p_lab_id UUID,
  p_clear_payments BOOLEAN DEFAULT TRUE,
  p_clear_bills BOOLEAN DEFAULT TRUE,
  p_clear_test_reports BOOLEAN DEFAULT TRUE,
  p_clear_documents BOOLEAN DEFAULT TRUE,
  p_clear_followups BOOLEAN DEFAULT TRUE,
  p_clear_feedback BOOLEAN DEFAULT TRUE,
  p_clear_patients BOOLEAN DEFAULT TRUE,
  p_clear_sequences BOOLEAN DEFAULT TRUE,
  p_clear_test_types BOOLEAN DEFAULT FALSE
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
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
BEGIN
  -- Check if user is super admin
  IF NOT is_super_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Only super admins can clear lab data';
  END IF;

  -- Clear bill payments
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

  -- Clear patients
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

  -- Clear test types (optional)
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
$$;

-- Create audit log table for data clearing operations
CREATE TABLE IF NOT EXISTS public.data_clear_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  lab_id UUID NOT NULL,
  lab_name TEXT NOT NULL,
  cleared_by UUID NOT NULL,
  cleared_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  deleted_counts JSON NOT NULL,
  options JSON NOT NULL
);

-- Enable RLS on audit log table
ALTER TABLE public.data_clear_logs ENABLE ROW LEVEL SECURITY;

-- Only super admins can view logs
CREATE POLICY "Super admins can view all data clear logs" 
ON public.data_clear_logs 
FOR SELECT 
USING (is_super_admin(auth.uid()));

-- Only super admins can insert logs
CREATE POLICY "Super admins can create data clear logs" 
ON public.data_clear_logs 
FOR INSERT 
WITH CHECK (is_super_admin(auth.uid()));