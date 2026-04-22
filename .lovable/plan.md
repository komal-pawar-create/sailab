

# Plan: Patient Report Tracking via QR Code on Bills

## Goal
Add a QR code to every printed bill that patients can scan to view/download their lab reports & documents — without needing to log in.

## How It Works

```text
Operator prints bill  →  QR code points to public URL
                            │
                            ▼
Patient scans QR  →  /track/:billId  →  Sees reports + documents
                                          (uploaded by operator)
```

## Implementation

### 1. Database (1 migration)
Add a public-tracking RLS path. We won't expose the whole `test_reports`/`documents` tables — we'll create a **secure RPC function** that takes the bill ID and returns only that bill's patient's reports/documents.

- New function: `get_patient_reports_by_bill(p_bill_id uuid)` — `SECURITY DEFINER`, returns reports + documents (file name, type, status, signed URL paths) only for the patient linked to that bill
- No RLS changes to existing tables (keeps lab data secure)
- Returns: bill number, patient name (first name only for privacy), list of reports with status, list of uploaded documents with download links

### 2. Public Tracking Page (new file)
**`src/pages/TrackReport.tsx`** — public route, no auth required:
- Header with lab name/logo (from bill's branch)
- Bill number + patient first name (privacy-safe)
- **Reports section**: list of test reports with status badges (Pending / Processing / Completed)
- **Documents section**: downloadable PDF/JPG reports uploaded by operator (signed URLs from `lab-files` bucket)
- Friendly empty state: "Your report is being prepared. Please check back later."
- Mobile-first design (most patients will scan from phone)

### 3. Route Registration
**`src/App.tsx`** — add `/track/:billId` to the `noSidebarPages` (public, no sidebar) routes list with lazy import.

### 4. QR Code on Bill Print
**`src/components/bills/BillPrint.tsx`**:
- Install `qrcode` library (lightweight, ~15KB)
- Generate QR code as data URL pointing to: `https://labflow.mywebz.in/track/{bill.id}`
- Display QR code in the bill footer area (right side, ~100×100 px) with caption: **"Scan to track your report"**
- Renders both in preview and printed output

### 5. Storage Access
Documents are in private `lab-files` bucket. The RPC will generate **signed URLs** (valid 1 hour) so patients can download without authentication, while keeping the bucket private.

## Files Changed

| File | Type | Purpose |
|------|------|---------|
| `supabase/migrations/<new>.sql` | New | `get_patient_reports_by_bill` RPC function |
| `src/pages/TrackReport.tsx` | New | Public report tracking page |
| `src/components/bills/BillPrint.tsx` | Edit | Add QR code in footer |
| `src/App.tsx` | Edit | Register `/track/:billId` public route |
| `package.json` | Edit | Add `qrcode` dependency |

## Privacy & Security Notes
- QR links use the bill UUID (random, non-guessable) — no patient ID exposed in URL
- Public page shows only patient's **first name** (e.g., "Reports for Rahul S.") to avoid full PII leak if QR is shared
- Signed URLs expire in 1 hour and are regenerated each visit
- No login needed — frictionless patient experience
- RPC is `SECURITY DEFINER` and only returns data scoped to one bill

