

# Sample Tracking Module

## Overview
Build a complete sample lifecycle tracking system with barcode/QR generation, status management, and TAT (Turnaround Time) monitoring with SLA breach alerts. This adds a new "Samples" tab to the Dashboard and integrates sample status into Patient History.

---

## 1. Database Migration

Create a `samples` table with full lifecycle tracking:

```text
samples
  - id (uuid, PK)
  - sample_id (text, unique per lab -- auto-generated like "SMP-YYYYMMDD-001")
  - patient_id (uuid, FK -> patients)
  - bill_id (uuid, FK -> bills, nullable)
  - test_report_id (uuid, FK -> test_reports, nullable)
  - test_type (text) -- test name
  - barcode (text, unique) -- for barcode/QR scanning
  - status (text) -- collected, received, processing, completed, rejected
  - rejection_reason (text, nullable)
  - collected_at (timestamptz)
  - collected_by (uuid, FK -> auth.users)
  - received_at (timestamptz, nullable)
  - received_by (uuid, nullable)
  - processing_at (timestamptz, nullable)
  - completed_at (timestamptz, nullable)
  - rejected_at (timestamptz, nullable)
  - sla_hours (integer, default 24) -- expected TAT in hours
  - sla_breached (boolean, default false)
  - notes (text, nullable)
  - lab_id (uuid, FK -> labs)
  - branch_id (uuid, FK -> branches, nullable)
  - created_at (timestamptz)
  - updated_at (timestamptz)
```

Create a `sample_id_sequences` table for auto-numbering (same pattern as `bill_number_sequences`).

RLS policies will follow the existing pattern:
- Branch operators see only their branch's samples
- Lab admins see all samples in their lab
- Uses existing `get_current_lab_id()` and branch-level isolation

A trigger `ensure_lab_id_matches_branch()` will be attached (matching the existing data integrity pattern).

---

## 2. New Components

### a) `src/components/forms/AddSampleForm.tsx`
- Dialog form triggered by "+ Collect Sample" button
- Fields: Patient (reuses `PatientSearchSelect`), Test Type (from `test_types`), SLA Hours (default 24), Notes
- Auto-generates `sample_id` (SMP-YYYYMMDD-NNN) and `barcode` (unique UUID-based string)
- Sets initial status to "collected" with `collected_at = now()`
- Supports OperatorSelect for admin role

### b) `src/components/samples/SampleStatusBadge.tsx`
- Color-coded badge per status: collected (blue), received (yellow), processing (orange), completed (green), rejected (red)
- Shows SLA breach indicator (red clock icon) when breached

### c) `src/components/samples/SampleBarcode.tsx`
- Uses existing `qrcode.react` dependency to render QR code
- Printable label layout: QR code + patient name + sample ID + test type + date
- Print button opens a print-optimized dialog

### d) `src/components/samples/SampleTimeline.tsx`
- Visual vertical timeline showing: Collected -> Received -> Processing -> Completed/Rejected
- Each step shows timestamp and who performed it
- Highlights current step, grays out future steps

### e) `src/components/samples/SampleUpdateDialog.tsx`
- Quick status update dialog with dropdown: advance to next status or reject
- Rejection requires reason text
- Auto-records timestamp and user for each transition

### f) `src/components/samples/SampleTrackingTab.tsx`
- Main samples list view (table) for the Dashboard "Samples" tab
- Columns: Sample ID, Patient, Test, Status Badge, Collected At, TAT Progress, Actions
- TAT Progress: shows time elapsed vs SLA with a progress bar (green/yellow/red)
- Filter by status, search by sample ID or patient name
- Actions: View QR, Update Status, View Timeline

### g) `src/components/samples/SampleTATReport.tsx`
- Summary cards: Total Samples, Avg TAT, SLA Breach Count, On-Time %
- Table of breached samples with details
- Filterable by date range and branch

---

## 3. Dashboard Integration

- Add "Samples" tab to `DataTabs` component alongside existing tabs (patients, reports, bills, etc.)
- Add a new stat card "Samples" to `StatsRow` showing today's sample count
- Add a "SLA Breaches" stat card with red highlight when breaches > 0

---

## 4. Patient History Integration

- Add a "Samples" tab in `PatientHistory` page
- Shows all samples for the patient with status timeline
- Integrate sample events into `PatientTimeline.tsx`

---

## 5. Sidebar Navigation

- No new sidebar item needed -- samples live inside Dashboard (Samples tab) and Patient History

---

## 6. SLA Breach Detection

- A computed approach: when loading samples, calculate `sla_breached` client-side by comparing `collected_at + sla_hours` vs current time (for non-completed/rejected samples)
- Optionally update `sla_breached` flag via a database function that can be called periodically
- Breached samples show a red pulsing indicator in the table

---

## 7. Barcode/QR Label Printing

- Printable label component using `qrcode.react` (already installed)
- Layout: 2x3 labels per A4 page for batch printing
- Each label: QR code encoding sample_id, patient name, test type, collection date
- Single-label and batch-print modes

---

## Technical Notes

- All queries follow the existing PostgREST join hint pattern (e.g., `patients!samples_patient_id_fkey(full_name, patient_id)`)
- RLS policies use `get_current_lab_id()` and branch isolation matching existing tables
- The `ensure_lab_id_matches_branch` trigger ensures data integrity
- TanStack Query hooks follow the `useDashboardQueries.ts` pattern with pagination and search
- i18n keys will be added to `en.json`, `hi.json`, `mr.json`
- Export functionality (Excel/PDF) reuses existing `ExportButtons` component

