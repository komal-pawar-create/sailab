

# End-to-End Testing Plan for Sample Tracking Module

## Critical Bug Found

The `get_current_lab_id()` database function has a bug that will **block all sample operations**:

```text
Current (BROKEN):   WHERE profiles.id = auth.uid()
Should be:          WHERE profiles.user_id = auth.uid()
```

The `profiles.id` is a separate UUID, not the auth user ID. All other helper functions (`get_user_lab`, `get_user_branch`) correctly use `profiles.user_id`. This means the RLS policies on the `samples` and `sample_id_sequences` tables will return no rows and block all inserts/selects/updates.

## Fix Required (Database Migration)

Run this SQL to fix the function:

```text
CREATE OR REPLACE FUNCTION public.get_current_lab_id()
RETURNS UUID AS $$
DECLARE
  v_lab_id UUID;
BEGIN
  SELECT lab_id INTO v_lab_id
  FROM public.profiles
  WHERE user_id = auth.uid();
  RETURN v_lab_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE SET search_path = public;
```

## Verification Steps (After Fix)

Once the function is fixed, the following E2E tests should pass:

### 1. Authentication
- Navigate to `/auth`, log in with valid credentials
- Verify redirect to `/dashboard`

### 2. Dashboard - Samples Tab
- Click the "Samples" tab on the dashboard
- Verify the table renders (even if empty, it should show "No samples found")
- Confirm the "Collect Sample" button is visible

### 3. Collect a Sample
- Click "+ Collect Sample" button
- Select a patient from the search dropdown
- Select a test type
- Set SLA hours (default 24)
- Add optional notes
- Click "Collect Sample"
- Verify success toast appears
- Verify the new sample appears in the Samples table with status "Collected"
- Verify the sample ID format is `SMP-YYYYMMDD-001`

### 4. Update Sample Status (Lifecycle)
- Click the arrow icon on the new sample row to open Update Status dialog
- Change status to "Received" and submit
- Verify status badge updates
- Repeat: update to "Processing", then "Completed"
- Verify TAT progress bar reflects elapsed time

### 5. Rejection Flow
- Collect another sample
- Click update status, select "Rejected"
- Verify rejection reason field appears (mandatory)
- Submit with reason
- Verify "Rejected" badge and reason displayed in timeline

### 6. QR Code / Barcode
- Click the barcode icon on a sample row
- Verify the QR code label dialog opens with sample ID, patient name, test type

### 7. Timeline View
- Click the eye icon on a sample row
- Verify the timeline dialog shows status progression with timestamps

### 8. Stats Row
- Verify "Samples" count in the dashboard stats row matches the number of samples
- Verify "SLA Breaches" stat reflects any breached samples

## Technical Details

| Component | File | Status |
|-----------|------|--------|
| DB Table `samples` | Migration | Deployed with correct schema |
| DB Table `sample_id_sequences` | Migration | Deployed |
| RLS Policies | `samples_select/insert/update/delete` | Need `get_current_lab_id()` fix |
| `get_next_sample_id()` | DB Function | Working (SECURITY DEFINER) |
| `useSamplesQuery` | `src/hooks/queries/useDashboardQueries.ts` | Implemented |
| `AddSampleForm` | `src/components/forms/AddSampleForm.tsx` | Implemented |
| `SampleTrackingTab` | `src/components/samples/SampleTrackingTab.tsx` | Implemented |
| `SampleUpdateDialog` | `src/components/samples/SampleUpdateDialog.tsx` | Implemented |
| `SampleStatusBadge` | `src/components/samples/SampleStatusBadge.tsx` | Implemented |
| `SampleBarcode` | `src/components/samples/SampleBarcode.tsx` | Implemented |
| `SampleTimeline` | `src/components/samples/SampleTimeline.tsx` | Implemented |

## Summary

The code is fully implemented. The **only blocker** is the `get_current_lab_id()` function using the wrong column (`id` instead of `user_id`). Once fixed, the entire sample tracking module should work end-to-end.

