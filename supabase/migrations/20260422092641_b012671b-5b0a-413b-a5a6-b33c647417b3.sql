CREATE OR REPLACE FUNCTION public.get_patient_reports_by_bill(p_bill_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_bill record;
  v_lab record;
  v_branch record;
  v_patient record;
  v_reports jsonb;
  v_documents jsonb;
  v_first_name text;
  v_last_initial text;
BEGIN
  -- Find the bill
  SELECT id, bill_number, patient_id, lab_id, branch_id, bill_date, total_amount
    INTO v_bill
  FROM bills
  WHERE id = p_bill_id;

  IF v_bill.id IS NULL THEN
    RETURN jsonb_build_object('found', false);
  END IF;

  -- Lab info
  SELECT id, name, logo_url, phone INTO v_lab
  FROM labs WHERE id = v_bill.lab_id;

  -- Branch info (optional)
  SELECT id, name, phone, logo_url INTO v_branch
  FROM branches WHERE id = v_bill.branch_id;

  -- Patient info (privacy-safe)
  SELECT id, full_name INTO v_patient
  FROM patients WHERE id = v_bill.patient_id;

  v_first_name := split_part(coalesce(v_patient.full_name, ''), ' ', 1);
  v_last_initial := CASE
    WHEN position(' ' in coalesce(v_patient.full_name, '')) > 0
    THEN left(split_part(v_patient.full_name, ' ', 2), 1) || '.'
    ELSE ''
  END;

  -- Reports for this patient
  SELECT COALESCE(jsonb_agg(jsonb_build_object(
    'id', tr.id,
    'test_type', tr.test_type,
    'status', tr.status,
    'created_at', tr.created_at
  ) ORDER BY tr.created_at DESC), '[]'::jsonb)
  INTO v_reports
  FROM test_reports tr
  WHERE tr.patient_id = v_bill.patient_id
    AND tr.lab_id = v_bill.lab_id;

  -- Documents for this patient (with signed URLs)
  SELECT COALESCE(jsonb_agg(jsonb_build_object(
    'id', d.id,
    'file_name', d.file_name,
    'file_type', d.file_type,
    'created_at', d.created_at,
    'signed_url', CASE
      WHEN d.file_path IS NOT NULL
      THEN (storage.create_signed_url('lab-files', d.file_path, 3600))::jsonb->>'signedURL'
      ELSE NULL
    END
  ) ORDER BY d.created_at DESC), '[]'::jsonb)
  INTO v_documents
  FROM documents d
  WHERE d.patient_id = v_bill.patient_id
    AND d.lab_id = v_bill.lab_id;

  RETURN jsonb_build_object(
    'found', true,
    'bill', jsonb_build_object(
      'id', v_bill.id,
      'bill_number', v_bill.bill_number,
      'bill_date', v_bill.bill_date
    ),
    'lab', jsonb_build_object(
      'name', v_lab.name,
      'logo_url', COALESCE(v_branch.logo_url, v_lab.logo_url),
      'phone', COALESCE(v_branch.phone, v_lab.phone),
      'branch_name', v_branch.name
    ),
    'patient', jsonb_build_object(
      'display_name', trim(v_first_name || ' ' || v_last_initial)
    ),
    'reports', v_reports,
    'documents', v_documents
  );
EXCEPTION WHEN OTHERS THEN
  -- If signed url helper not available, fallback without urls
  RETURN jsonb_build_object('found', false, 'error', SQLERRM);
END;
$$;

-- Allow anonymous + authenticated users to call it
GRANT EXECUTE ON FUNCTION public.get_patient_reports_by_bill(uuid) TO anon, authenticated;