import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const securityHeaders = {
  'X-Frame-Options': 'DENY',
  'X-Content-Type-Options': 'nosniff',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
};

interface MyOpRequest {
  to: string; // full phone with country code, e.g. "919876543210"
  templateName?: string;
  languageCode?: string;
  params: string[]; // body parameters in order
}

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, ...securityHeaders, 'Content-Type': 'application/json' },
  });

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  try {
    // Auth check
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return json({ success: false, error: 'Unauthorized' }, 401);
    }
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } }
    );
    const token = authHeader.replace('Bearer ', '');
    const { data: claims, error: authErr } = await supabase.auth.getClaims(token);
    if (authErr || !claims?.claims?.sub) {
      return json({ success: false, error: 'Unauthorized' }, 401);
    }

    const MYOP_TOKEN = Deno.env.get('MYOPERATOR_TOKEN');
    const MYOP_COMPANY_ID = Deno.env.get('MYOPERATOR_COMPANY_ID');
    const MYOP_PHONE_NUMBER_ID = Deno.env.get('MYOPERATOR_PHONE_NUMBER_ID');
    const MYOP_WABA_ID = Deno.env.get('MYOPERATOR_WABA_ID') ?? '';

    if (!MYOP_TOKEN || !MYOP_COMPANY_ID || !MYOP_PHONE_NUMBER_ID) {
      return json({ success: false, error: 'MyOperator credentials not configured' }, 500);
    }

    const body = (await req.json()) as MyOpRequest;
    const { to, templateName = 'copy_labflow', languageCode = 'en', params } = body;

    if (!to || !params || !Array.isArray(params)) {
      return json({ success: false, error: 'Missing required fields: to, params[]' }, 400);
    }

    // Normalize phone — strip non-digits
    const digits = String(to).replace(/[^0-9]/g, '');
    if (digits.length < 10) {
      return json({ success: false, error: 'Invalid phone number' }, 400);
    }
    // Default country code 91 (India) if 10-digit number
    const fullNumber = digits.length === 10 ? `91${digits}` : digits;
    const countryCode = fullNumber.slice(0, fullNumber.length - 10);
    const customerNumber = fullNumber.slice(-10);

    const payload = {
      phone_number_id: MYOP_PHONE_NUMBER_ID,
      customer_country_code: countryCode,
      customer_number: customerNumber,
      data: {
        type: 'template',
        context: {
          template_name: templateName,
          language: languageCode,
          body: {
            type: 'text',
            placeholders: params.map(String),
          },
        },
      },
      reply_to: null,
      myop_ref_id: `labflow_${Date.now()}`,
    };

    console.log('[myoperator] sending to', fullNumber, 'template', templateName, 'params', params);

    const apiRes = await fetch('https://publicapi.myoperator.co/chat/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Authorization': `Bearer ${MYOP_TOKEN}`,
        'X-MYOP-COMPANY-ID': MYOP_COMPANY_ID,
        ...(MYOP_WABA_ID ? { 'X-WABA-ID': MYOP_WABA_ID } : {}),
      },
      body: JSON.stringify(payload),
    });

    const text = await apiRes.text();
    let data: unknown = text;
    try { data = JSON.parse(text); } catch { /* keep text */ }

    console.log('[myoperator] status', apiRes.status, 'response', data);

    if (!apiRes.ok) {
      return json({ success: false, status: apiRes.status, error: data }, 200);
    }

    return json({ success: true, data });
  } catch (err) {
    console.error('[myoperator] error', err);
    return json({ success: false, error: (err as Error).message ?? 'Unknown error' }, 500);
  }
});
