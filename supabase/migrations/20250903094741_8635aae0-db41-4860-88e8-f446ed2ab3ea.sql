-- Add missing foreign key constraints to establish proper relationships

-- 1. Add foreign key from bills to patients
ALTER TABLE public.bills 
ADD CONSTRAINT fk_bills_patient 
FOREIGN KEY (patient_id) 
REFERENCES public.patients(id) 
ON DELETE CASCADE;

-- 2. Add foreign key from bill_payments to bills
ALTER TABLE public.bill_payments 
ADD CONSTRAINT fk_bill_payments_bill 
FOREIGN KEY (bill_id) 
REFERENCES public.bills(id) 
ON DELETE CASCADE;

-- 3. Add foreign key from test_reports to patients
ALTER TABLE public.test_reports 
ADD CONSTRAINT fk_test_reports_patient 
FOREIGN KEY (patient_id) 
REFERENCES public.patients(id) 
ON DELETE CASCADE;

-- 4. Add foreign key from documents to patients
ALTER TABLE public.documents 
ADD CONSTRAINT fk_documents_patient 
FOREIGN KEY (patient_id) 
REFERENCES public.patients(id) 
ON DELETE CASCADE;

-- 5. Add foreign key from patient_followups to patients
ALTER TABLE public.patient_followups 
ADD CONSTRAINT fk_patient_followups_patient 
FOREIGN KEY (patient_id) 
REFERENCES public.patients(id) 
ON DELETE CASCADE;

-- 6. Add foreign key from feedback to patients (if patient_id is provided)
ALTER TABLE public.feedback 
ADD CONSTRAINT fk_feedback_patient 
FOREIGN KEY (patient_id) 
REFERENCES public.patients(id) 
ON DELETE CASCADE;