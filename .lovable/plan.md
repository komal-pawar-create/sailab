
# Security Headers Implementation via Edge Function Middleware

## Overview
Add comprehensive security headers (CSP, X-Frame-Options, X-Content-Type-Options, and additional protections) to all Supabase Edge Functions to harden the API against common web security vulnerabilities like clickjacking, MIME sniffing attacks, and content injection.

---

## Security Headers to Add

| Header | Value | Purpose |
|--------|-------|---------|
| `Content-Security-Policy` | `default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline';` | Prevents XSS by restricting content sources |
| `X-Frame-Options` | `DENY` | Prevents clickjacking by blocking iframe embedding |
| `X-Content-Type-Options` | `nosniff` | Prevents MIME type sniffing attacks |
| `X-XSS-Protection` | `1; mode=block` | Legacy XSS protection for older browsers |
| `Referrer-Policy` | `strict-origin-when-cross-origin` | Controls referrer information leakage |
| `Permissions-Policy` | `camera=(), microphone=(), geolocation=()` | Restricts browser feature access |

---

## Implementation Approach

Create a centralized security headers object that can be spread into all Edge Function responses. Each function will be updated to include these headers alongside the existing CORS headers.

### New Security Headers Object
```typescript
const securityHeaders = {
  'Content-Security-Policy': "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' https:; connect-src 'self' https:;",
  'X-Frame-Options': 'DENY',
  'X-Content-Type-Options': 'nosniff',
  'X-XSS-Protection': '1; mode=block',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
};
```

### Combined Headers Pattern
```typescript
const allHeaders = {
  ...corsHeaders,
  ...securityHeaders,
  'Content-Type': 'application/json',
};

return new Response(JSON.stringify(data), {
  status: 200,
  headers: allHeaders,
});
```

---

## Files to Update

All 14 Edge Functions will be updated to include security headers:

| File | Status |
|------|--------|
| `supabase/functions/admin-update-password/index.ts` | Update |
| `supabase/functions/check-alerts/index.ts` | Update |
| `supabase/functions/check-license-expiry/index.ts` | Update |
| `supabase/functions/health-check/index.ts` | Update |
| `supabase/functions/monitoring-dashboard/index.ts` | Update |
| `supabase/functions/predict-analytics/index.ts` | Update |
| `supabase/functions/process-document/index.ts` | Update |
| `supabase/functions/run-tests/index.ts` | Update |
| `supabase/functions/send-analytics-report/index.ts` | Update |
| `supabase/functions/send-email-notification/index.ts` | Update |
| `supabase/functions/send-otp/index.ts` | Update |
| `supabase/functions/send-sms-notification/index.ts` | Update |
| `supabase/functions/send-whatsapp-notification/index.ts` | Update |
| `supabase/functions/verify-otp/index.ts` | Update |

---

## Technical Details

### Pattern for Each Function

Add the `securityHeaders` constant after `corsHeaders`:

```typescript
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, ...',
};

const securityHeaders = {
  'Content-Security-Policy': "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' https:; connect-src 'self' https:;",
  'X-Frame-Options': 'DENY',
  'X-Content-Type-Options': 'nosniff',
  'X-XSS-Protection': '1; mode=block',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
};
```

Update all Response returns from:
```typescript
headers: { ...corsHeaders, 'Content-Type': 'application/json' }
```

To:
```typescript
headers: { ...corsHeaders, ...securityHeaders, 'Content-Type': 'application/json' }
```

### OPTIONS Preflight Handling

Keep CORS preflight responses simple (no security headers needed for preflight):
```typescript
if (req.method === 'OPTIONS') {
  return new Response('ok', { headers: corsHeaders });
}
```

---

## CSP Policy Breakdown

The Content-Security-Policy is configured for API responses:

| Directive | Value | Reason |
|-----------|-------|--------|
| `default-src` | `'self'` | Default fallback restricts to same origin |
| `script-src` | `'self' 'unsafe-inline'` | Allows inline scripts (needed for some dynamic responses) |
| `style-src` | `'self' 'unsafe-inline'` | Allows inline styles |
| `img-src` | `'self' data: https:` | Allows images from same origin, data URIs, and HTTPS sources |
| `font-src` | `'self' https:` | Allows fonts from same origin and HTTPS |
| `connect-src` | `'self' https:` | Allows API connections to same origin and HTTPS |

---

## Security Benefits

1. **Clickjacking Prevention**: `X-Frame-Options: DENY` prevents embedding API responses in iframes
2. **MIME Sniffing Protection**: `X-Content-Type-Options: nosniff` prevents browsers from interpreting responses as different content types
3. **XSS Mitigation**: CSP restricts sources of executable content
4. **Information Leakage**: `Referrer-Policy` controls what referrer info is sent
5. **Feature Restriction**: `Permissions-Policy` blocks access to sensitive browser APIs

---

## Testing

After implementation, verify headers using:
1. Call any Edge Function and inspect response headers
2. Use browser DevTools Network tab to confirm headers are present
3. Use online CSP validators to ensure policy is correctly formatted

---

## Compatibility Notes

- CSP with `'unsafe-inline'` is included because Edge Functions may return HTML content in some cases (like email templates)
- For stricter security, `'unsafe-inline'` could be replaced with nonces in the future
- These headers apply to Edge Function API responses only, not the main web application (which uses Vercel/hosting provider headers)
