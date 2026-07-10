-- Transactional pathology save/update for the web workflow.
-- The function keeps report, bill, payment, and pending commission changes together.

CREATE TABLE IF NOT EXISTS public.branch_report_sequences (
  branch_id UUID PRIMARY KEY REFERENCES public.branches(id) ON DELETE CASCADE,
  prefix TEXT NOT NULL DEFAULT 'RPT',
  next_number INTEGER NOT NULL DEFAULT 1,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.branch_report_sequences ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view report sequence for their branch" ON public.branch_report_sequences;
CREATE POLICY "Users can view report sequence for their branch"
ON public.branch_report_sequences FOR SELECT
USING (
  branch_id = public.get_user_branch(auth.uid())
  OR (public.is_lab_admin(auth.uid()) AND EXISTS (
    SELECT 1 FROM public.branches b WHERE b.id = branch_id AND b.lab_id = public.get_user_lab(auth.uid())
  ))
  OR public.has_role(auth.uid(), 'admin'::public.user_role)
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_test_reports_branch_report_number
ON public.test_reports(branch_id, report_number)
WHERE report_number IS NOT NULL;

CREATE OR REPLACE FUNCTION public.save_pathology_report(
  p_report_id UUID DEFAULT NULL,
  p_patient_id UUID DEFAULT NULL,
  p_branch_id UUID DEFAULT NULL,
  p_lab_id UUID DEFAULT NULL,
  p_doctor_id UUID DEFAULT NULL,
  p_test_type TEXT DEFAULT NULL,
  p_results JSONB DEFAULT '[]'::jsonb,
  p_test_date DATE DEFAULT CURRENT_DATE,
  p_status TEXT DEFAULT 'pending',
  p_technician_name TEXT DEFAULT NULL,
  p_modality TEXT DEFAULT 'OUTSIDE',
  p_study_notes TEXT DEFAULT NULL,
  p_total_amount NUMERIC DEFAULT 0,
  p_created_by UUID DEFAULT NULL,
  p_create_bill BOOLEAN DEFAULT FALSE,
  p_paid_amount NUMERIC DEFAULT 0,
  p_payment_method TEXT DEFAULT 'cash'
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_report public.test_reports%ROWTYPE;
  v_branch_code TEXT;
  v_report_number TEXT;
  v_sequence INTEGER;
  v_bill_id UUID;
  v_bill_number TEXT;
  v_total NUMERIC := 0;
  v_paid NUMERIC := GREATEST(COALESCE(p_paid_amount, 0), 0);
  v_doctor RECORD;
  v_commission NUMERIC;
  v_commission_id UUID;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Authentication required'; END IF;
  IF p_patient_id IS NULL OR p_branch_id IS NULL OR p_lab_id IS NULL THEN RAISE EXCEPTION 'Patient, branch, and lab are required'; END IF;
  IF p_branch_id <> public.get_user_branch(auth.uid())
     AND NOT public.is_lab_admin(auth.uid())
     AND NOT public.has_role(auth.uid(), 'admin'::public.user_role)
     AND NOT public.has_role(auth.uid(), 'super_admin'::public.user_role) THEN
    RAISE EXCEPTION 'You can only save reports for your assigned branch';
  END IF;
  IF p_lab_id <> public.get_user_lab(auth.uid())
     AND NOT public.has_role(auth.uid(), 'admin'::public.user_role)
     AND NOT public.has_role(auth.uid(), 'super_admin'::public.user_role) THEN
    RAISE EXCEPTION 'You can only save reports for your assigned lab';
  END IF;

  SELECT COALESCE(NULLIF(trim(b.branch_code), ''), 'RPT') INTO v_branch_code
  FROM public.branches b WHERE b.id = p_branch_id;
  IF v_branch_code IS NULL THEN v_branch_code := 'RPT'; END IF;

  SELECT * INTO v_report FROM public.test_reports WHERE id = p_report_id FOR UPDATE;
  IF p_report_id IS NOT NULL AND v_report.id IS NULL THEN RAISE EXCEPTION 'Report not found'; END IF;

  SELECT COALESCE(sum(NULLIF(regexp_replace(value->>'amount', '[^0-9.\\-]', '', 'g'), '')::numeric), 0)
  INTO v_total
  FROM jsonb_array_elements(CASE WHEN jsonb_typeof(p_results) = 'array' THEN p_results ELSE '[]'::jsonb END) AS item(value);
  IF COALESCE(p_total_amount, 0) > 0 THEN v_total := p_total_amount; END IF;

  IF v_report.id IS NULL THEN
    INSERT INTO public.branch_report_sequences(branch_id, prefix, next_number)
    VALUES (p_branch_id, v_branch_code, 2)
    ON CONFLICT (branch_id) DO UPDATE SET next_number = public.branch_report_sequences.next_number + 1, updated_at = now()
    RETURNING next_number - 1 INTO v_sequence;
    v_report_number := v_branch_code || '-' || to_char(CURRENT_DATE, 'YYYY') || '-' || lpad(v_sequence::text, 6, '0');

    INSERT INTO public.test_reports (
      patient_id, test_type, test_date, status, technician_name, results, department, modality,
      study_notes, referring_doctor_id, lab_id, branch_id, created_by, source, report_number
    ) VALUES (
      p_patient_id, p_test_type, p_test_date, p_status, p_technician_name, p_results, 'pathology', p_modality,
      p_study_notes, p_doctor_id, p_lab_id, p_branch_id, COALESCE(p_created_by, auth.uid()), 'cloud', v_report_number
    ) RETURNING * INTO v_report;
  ELSE
    IF v_report.branch_id IS DISTINCT FROM p_branch_id OR v_report.lab_id IS DISTINCT FROM p_lab_id THEN RAISE EXCEPTION 'Report belongs to another branch'; END IF;
    UPDATE public.test_reports SET
      patient_id = p_patient_id, test_type = p_test_type, test_date = p_test_date, status = p_status,
      technician_name = p_technician_name, results = p_results, department = 'pathology', modality = p_modality,
      study_notes = p_study_notes, referring_doctor_id = p_doctor_id,
      pdf_url = CASE WHEN p_status = 'completed' THEN NULL ELSE pdf_url END,
      finalized_at = CASE WHEN p_status = 'completed' THEN NULL ELSE finalized_at END,
      finalized_by = CASE WHEN p_status = 'completed' THEN NULL ELSE finalized_by END,
      updated_at = now()
    WHERE id = p_report_id
    RETURNING * INTO v_report;
  END IF;

  v_bill_id := v_report.bill_id;
  IF p_create_bill AND v_bill_id IS NULL THEN
    v_bill_number := public.generate_bill_number(p_lab_id);
    INSERT INTO public.bills (
      bill_number, patient_id, total_amount, due_amount, paid_amount, due_date, items,
      lab_id, branch_id, created_by, status, source
    ) VALUES (
      v_bill_number, p_patient_id, v_total, GREATEST(v_total - v_paid, 0), LEAST(v_paid, v_total), p_test_date,
      p_results, p_lab_id, p_branch_id, COALESCE(p_created_by, auth.uid()),
      CASE WHEN v_paid >= v_total AND v_total > 0 THEN 'paid' WHEN v_paid > 0 THEN 'partially_paid' ELSE 'pending' END, 'cloud'
    ) RETURNING id INTO v_bill_id;
    UPDATE public.test_reports SET bill_id = v_bill_id WHERE id = v_report.id;
    IF v_paid > 0 THEN
      INSERT INTO public.bill_payments (bill_id, branch_id, created_by, payment_amount, payment_method, source)
      VALUES (v_bill_id, p_branch_id, COALESCE(p_created_by, auth.uid()), LEAST(v_paid, v_total), p_payment_method, 'cloud');
    END IF;
  ELSIF v_bill_id IS NOT NULL THEN
    SELECT COALESCE(paid_amount, 0) INTO v_paid FROM public.bills WHERE id = v_bill_id FOR UPDATE;
    UPDATE public.bills SET total_amount = v_total, due_amount = GREATEST(v_total - v_paid, 0),
      status = CASE WHEN v_paid >= v_total AND v_total > 0 THEN 'paid' WHEN v_paid > 0 THEN 'partially_paid' ELSE 'pending' END,
      items = p_results, updated_at = now() WHERE id = v_bill_id;
  END IF;

  IF v_bill_id IS NOT NULL AND p_doctor_id IS NOT NULL THEN
    SELECT commission_type, commission_percentage, fixed_commission_amount INTO v_doctor
    FROM public.referring_doctors WHERE id = p_doctor_id;
    IF FOUND THEN
      v_commission := CASE WHEN v_doctor.commission_type = 'percentage' THEN v_total * COALESCE(v_doctor.commission_percentage, 0) / 100 ELSE COALESCE(v_doctor.fixed_commission_amount, 0) END;
      SELECT id INTO v_commission_id FROM public.doctor_commissions WHERE bill_id = v_bill_id AND status = 'pending' LIMIT 1;
      IF v_commission_id IS NULL THEN
        INSERT INTO public.doctor_commissions (bill_id, doctor_id, patient_id, bill_amount, commission_rate, commission_amount, lab_id, branch_id, status, source)
        VALUES (v_bill_id, p_doctor_id, p_patient_id, v_total, CASE WHEN v_doctor.commission_type = 'percentage' THEN COALESCE(v_doctor.commission_percentage, 0) ELSE COALESCE(v_doctor.fixed_commission_amount, 0) END, v_commission, p_lab_id, p_branch_id, 'pending', 'cloud');
      ELSE
        UPDATE public.doctor_commissions SET doctor_id = p_doctor_id, bill_amount = v_total, commission_amount = v_commission WHERE id = v_commission_id;
      END IF;
    END IF;
  END IF;

  RETURN jsonb_build_object('reportId', v_report.id, 'reportNumber', v_report.report_number, 'billId', v_bill_id, 'totalAmount', v_total, 'pendingAmount', GREATEST(v_total - v_paid, 0));
END;
$$;

REVOKE ALL ON FUNCTION public.save_pathology_report(UUID, UUID, UUID, UUID, UUID, TEXT, JSONB, DATE, TEXT, TEXT, TEXT, TEXT, NUMERIC, UUID, BOOLEAN, NUMERIC, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.save_pathology_report(UUID, UUID, UUID, UUID, UUID, TEXT, JSONB, DATE, TEXT, TEXT, TEXT, TEXT, NUMERIC, UUID, BOOLEAN, NUMERIC, TEXT) TO authenticated;
