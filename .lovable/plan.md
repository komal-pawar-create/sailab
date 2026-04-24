

# Plan: WhatsApp Report Sharing via MyOperator API

## Goal
Let lab admins (and operators) send a one-tap WhatsApp message to the patient containing a secure tracking link to their report, using the **MyOperator** WhatsApp Business API with the approved template `copy_labflow`.

## Template Mapping (`copy_labflow`, Utility, Approved)

```
Dear {{1}},
Your {{2}} report is ready.
Access your report securely here:
{{3}}
Please do not share this link with others for privacy reasons.
{{4}}
Thank you
```

| Param | Source |
|-------|--------|
| `{{1}}` | Patient first name |
| `{{2}}` | Test type / report name |
| `{{3}}` | `https://labflow.mywebz.in/track/{billId}` (existing QR tracking page) |
| `{{4}}` | Lab/branch name |

## Architecture

```text
PatientReportsTab "Send to WhatsApp" button
        │
        ▼
supabase/functions/send-myoperator-whatsapp
        │  uses MYOPERATOR_TOKEN + MYOPERATOR_COMPANY_ID + MYOPERATOR_PHONE_NUMBER_ID secrets
        ▼
POST https://publicapi.myoperator.co/chat/messages
        │
        ▼
Patient receives WhatsApp with tracking link → opens /track/:billId
```

## Implementation

### 1. New Edge Function: `send-myoperator-whatsapp`
**`supabase/functions/send-myoperator-whatsapp/index.ts`**
- Reads secrets: `MYOPERATOR_TOKEN`, `MYOPERATOR_COMPANY_ID`, `MYOPERATOR_PHONE_NUMBER_ID`, `MYOPERATOR_WABA_ID`
- Accepts: `{ to, templateName, languageCode, params: string[] }`
- Sends a template message via MyOperator's public API:
  ```
  POST https://publicapi.myoperator.co/chat/messages
  Authorization: Bearer <MYOPERATOR_TOKEN>
  X-MYOP-COMPANY-ID: <COMPANY_ID>
  Body: {
    phone_number_id, customer_country_code, customer_number,
    type: "template",
    template: { name, language_code, body_params }
  }
  ```
- Logs response, returns `{ success, data }` / `{ success: false, error }`
- Standard CORS + security headers (matches existing edge functions)

### 2. Register the function
**`supabase/config.toml`** — add `[functions.send-myoperator-whatsapp] verify_jwt = true` (only authenticated lab users can send).

### 3. Add MyOperator settings to API Settings page
**`src/pages/ApiSettings.tsx`** — add a fourth tab **"WhatsApp (MyOperator)"** with fields:
- Auth Token (secret)
- Company ID
- Phone Number ID (e.g. `700668386473133` from your screenshot)
- WABA ID (optional, for reference)
- Default Template Name (pre-filled `copy_labflow`)
- Default Language Code (pre-filled `en`)

These are stored in `localStorage` under `labflow_myop_*` keys (matching existing pattern). Show a clear note: *"Add `MYOPERATOR_TOKEN`, `MYOPERATOR_COMPANY_ID`, `MYOPERATOR_PHONE_NUMBER_ID` to Lovable Cloud secrets for the edge function."*

### 4. New shared hook: `useWhatsAppShare`
**`src/hooks/useWhatsAppShare.ts`** — single function `sendReportLink({ patientPhone, patientName, testName, billId, labName })`:
- Builds tracking URL: `https://labflow.mywebz.in/track/${billId}`
- Normalizes phone (strips +, spaces, ensures country code 91 default)
- Calls `supabase.functions.invoke('send-myoperator-whatsapp', { body: { to, templateName: 'copy_labflow', languageCode: 'en', params: [firstName, testName, trackingUrl, labName] } })`
- Toast success/error

### 5. "Send to WhatsApp" button in Reports
**`src/components/patient-history/PatientReportsTab.tsx`**:
- Add a **WhatsApp** action (green icon) next to the Download button on each test report row and document card
- On click → opens a small confirm dialog showing the patient phone + preview of what will be sent → confirm → invokes `useWhatsAppShare`
- Requires the bill linked to the report (use the most recent bill for that patient if `bill_id` not on report); if no bill exists, disable the button with tooltip *"Generate a bill first to create a tracking link"*

### 6. Optional: Bill print success → "Send WhatsApp" CTA
**`src/components/bills/BillPrintModal.tsx`** — after printing a bill, show an additional **"Send tracking link to patient on WhatsApp"** button that uses the same hook. (Bonus, low risk.)

## Secrets Needed (Lovable Cloud)
The user (lab admin) will be asked to add these once:
- `MYOPERATOR_TOKEN` — from "WhatsApp APIs → Authentication" (`Sd6CGM3H7xsTIr...`)
- `MYOPERATOR_COMPANY_ID` — from "WhatsApp APIs → Company ID" (`68b03dfe3cdbe222`)
- `MYOPERATOR_PHONE_NUMBER_ID` — from "WhatsApp Profile → Phone number ID" (`700668386473133`)

## Files Changed

| File | Type | Purpose |
|------|------|---------|
| `supabase/functions/send-myoperator-whatsapp/index.ts` | New | Calls MyOperator public API |
| `supabase/config.toml` | Edit | Register new function (verify_jwt = true) |
| `src/hooks/useWhatsAppShare.ts` | New | Reusable hook to send report link |
| `src/components/patient-history/PatientReportsTab.tsx` | Edit | "Send to WhatsApp" action on tests + documents |
| `src/components/bills/BillPrintModal.tsx` | Edit (optional) | Post-print WhatsApp CTA |
| `src/pages/ApiSettings.tsx` | Edit | New "WhatsApp (MyOperator)" tab |

## Security & UX Notes
- Edge function is JWT-protected → only logged-in lab users can trigger
- Token stays server-side; never reaches the browser
- Tracking link uses bill UUID (random, non-guessable) — same security model as the existing QR feature
- Phone number normalization (default country code `91` for India, configurable)
- Errors from MyOperator (invalid template, opt-out, throttle) are surfaced as toasts with the actual API message
- Once approved, I'll request the 3 secrets via the secret-add prompt before deploying

