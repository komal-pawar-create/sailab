

## Professional Doctor Referral and Commission Settlement System

Currently, doctor referrals are tracked as free-text fields on the patient record with a basic aggregation report. This plan upgrades it into a full professional system with a doctor master list, configurable commission rates, automatic commission calculation, and payment settlement tracking.

---

### What You Get

1. **Doctor Master List** -- A dedicated table to register referring doctors with their details and commission percentage (e.g., 10% of bill amount)
2. **Auto-suggest on Patient Form** -- When adding a patient, the doctor name field becomes a searchable dropdown from the master list (with option to type new)
3. **Automatic Commission Calculation** -- Commissions are auto-calculated from bills linked to referred patients
4. **Settlement Tracking** -- Record payments made to doctors, track pending vs settled amounts
5. **Enhanced Referral Report** -- Shows commission earned, commission paid, and balance due per doctor with settlement history

---

### Database Changes (3 new tables)

**Table 1: `referring_doctors`** (Master list)
- `id`, `lab_id`, `branch_id`, `doctor_name`, `phone`, `email`, `specialization`, `commission_percentage` (default 10), `commission_type` (percentage/fixed), `is_active`, `created_at`, `created_by`

**Table 2: `doctor_commissions`** (Auto-calculated per bill)
- `id`, `doctor_id` (FK to referring_doctors), `bill_id` (FK to bills), `patient_id`, `bill_amount`, `commission_rate`, `commission_amount`, `lab_id`, `branch_id`, `status` (pending/settled), `settled_in_settlement_id`, `created_at`

**Table 3: `doctor_settlements`** (Payment records)
- `id`, `doctor_id`, `settlement_date`, `total_amount`, `payment_method`, `reference_number`, `notes`, `period_from`, `period_to`, `lab_id`, `branch_id`, `created_by`, `created_at`

RLS policies on all three tables filtering by `lab_id`.

---

### UI Changes

**1. Add Doctor Management Dialog** (new component)
- Form to add/edit referring doctors with name, phone, specialization, commission rate
- Accessible from the Referral Report page via "Manage Doctors" button

**2. Update Patient Form (`AddPatientForm.tsx`)**
- Replace free-text doctor name field with a searchable Select/Combobox that queries `referring_doctors`
- Still allows typing a new name (falls back to free-text for unregistered doctors)
- Auto-fills phone when a registered doctor is selected

**3. Enhanced Referral Report (`DoctorReferralReport.tsx`)**
- Add columns: Commission Rate, Commission Earned, Commission Paid, Balance Due
- Add "Record Settlement" button per doctor row
- Add settlement history expandable section
- Summary stats: Total Commission Earned, Total Paid, Total Pending

**4. Settlement Form** (new component)
- Dialog to record a payment to a doctor
- Fields: Amount, Payment Method (Cash/Online/Cheque), Reference Number, Period (From-To), Notes
- On submit: creates settlement record and marks related commission entries as "settled"

**5. Reports Page** -- No tab changes needed, the existing "Referrals" tab gets the enhanced version

---

### Auto-Commission Logic

When a bill is created for a patient who has a registered referring doctor:
- A database trigger or application-level logic creates a `doctor_commissions` record
- Commission = `bill.total_amount * doctor.commission_percentage / 100`
- This happens automatically -- no manual entry needed

For existing patients with free-text doctor names, the report still works but commission tracking only applies to registered doctors.

---

### Technical Details

**Files to Create:**
- `src/components/reports/DoctorManagement.tsx` -- Add/Edit/List doctors dialog
- `src/components/reports/DoctorSettlementForm.tsx` -- Record settlement dialog
- `src/components/reports/DoctorSettlementHistory.tsx` -- Expandable settlement history
- Migration file for the 3 new tables + RLS policies

**Files to Modify:**
- `src/components/reports/DoctorReferralReport.tsx` -- Enhanced with commission columns, settlement actions, manage doctors button
- `src/components/forms/AddPatientForm.tsx` -- Doctor name field becomes searchable select from master list
- `src/integrations/supabase/types.ts` -- Will auto-update after migration

**Commission Calculation Approach:**
- Application-level: When a bill is created in `AddBillForm`, check if the patient has a `referring_doctor_id`, and if so, insert into `doctor_commissions`
- This avoids needing a database trigger and keeps the logic visible in the codebase

