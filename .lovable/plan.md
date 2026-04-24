

# Fix: API Settings Save UX + WhatsApp Sending Failure

## Issue 1: "Not getting saved properly"

The save **does** work (it writes to `localStorage`), but the UI gives no real confirmation:
- The fields stay populated only because of the lazy `useState` `localStorage.getItem(...)` initializer — they re-read on every fresh page load, but **don't update from one tab/session to another visibly**
- The "Reference IDs" stored in localStorage are never actually used by the edge function (the function reads from server-side secrets), so users wonder *"did anything happen?"*
- Also: every call to `handleSave*` flips `loading=true` but the work is synchronous — the spinner barely shows

### Fix
**`src/pages/ApiSettings.tsx`**
- Make it explicit that **only the secrets matter**. Show a green "Secrets configured ✓" badge for each provider when all required env-vars exist (we'll detect by calling the test endpoint or just rely on a static "configured" flag from our app since we can't read secrets client-side — we'll display a clearer note).
- After save: show a persistent inline success row ("Saved at HH:MM:SS — these IDs are stored locally for reference only") instead of just a toast.
- Add a **"Send test message"** button on the MyOperator tab that takes a phone number + sends a test using the `copy_labflow` template — this immediately surfaces real API errors so the user can see what's wrong.

## Issue 2: "WhatsApp sending not working"

Edge function returns `200` with `{ success: false, error: ... }` when MyOperator rejects the call. Most likely causes (based on MyOperator's documented payload shape):

1. **Wrong payload structure.** Our current function sends:
   ```
   data.context.body.placeholders
   ```
   But MyOperator's documented schema for template messages typically uses **`reply_to: null`** + a `data.context` shape with **`body: { placeholders: [...] }`** — and many tenants need a fully structured `header`/`body`/`footer` block. We'll log the raw response in the browser via the toast so we can see the exact MyOperator error string.

2. **Phone format.** Our hook sends `to: "919..."` (12 digits) but the function then splits this into `customer_country_code` + `customer_number`. Good — but MyOperator sometimes requires `+` prefix in some tenant configs. We'll surface the real error.

3. **Template params count mismatch.** `copy_labflow` has 4 placeholders ({{1}}–{{4}}). Our hook sends 4. ✓ Good.

### Fix
**`supabase/functions/send-myoperator-whatsapp/index.ts`** — three concrete changes:
- Return the **exact MyOperator response body** (status + JSON) in the function's response so the toast in the UI shows the real reason (e.g. *"Template not found"*, *"Recipient not opted in"*, *"Invalid phone_number_id"*).
- Add a `mode: "test"` branch that just echoes back the assembled payload (no MyOperator call) so we can verify our payload shape is correct before hitting their API.
- Try the alternate documented MyOperator payload shape if the first call returns a structural error — specifically wrap `body.placeholders` items as `{ type: "text", text: "..." }` objects (their newer schema) instead of plain strings.

**`src/hooks/useWhatsAppShare.ts`**
- When `data.success === false`, show the **full error** in the toast (currently we stringify but truncate). Make the toast `duration: 10000` so user can read it.
- Log the request body to console for debugging.

**`src/pages/ApiSettings.tsx`**
- Add **"Send Test WhatsApp"** section under MyOperator tab:
  - Input: phone number (default `+91`)
  - Button: *Send test "copy_labflow" template*
  - Shows the exact API response in a `<pre>` block below — success or failure — so the user can self-diagnose

## Files Changed

| File | Change |
|------|--------|
| `supabase/functions/send-myoperator-whatsapp/index.ts` | Return real MyOperator error body; try alt payload shape on structural failure; add `mode: "test"` echo |
| `src/hooks/useWhatsAppShare.ts` | Surface full error message in toast (longer duration); console-log payload |
| `src/pages/ApiSettings.tsx` | Inline "Saved at HH:MM" confirmation; "Send Test WhatsApp" form on MyOperator tab showing raw API response |

## How to Verify
1. Open `/api-settings` → MyOperator tab → enter your own number → **Send Test** → see actual MyOperator response in the panel.
2. If success: the production "Send on WhatsApp" button in Patient Reports will work too.
3. If failure: you'll see the exact reason (template not approved on your WABA, phone not opted in, wrong company ID, etc.) and we can fix it precisely.

