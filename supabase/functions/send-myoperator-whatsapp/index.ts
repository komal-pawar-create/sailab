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
  to: string;
  templateName?: string;
  languageCode?: string;
  params: string[];
  mode?: 'test' | 'send';
}

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, ...securityHeaders, 'Content-Type': 'application/json' },
  });

function buildPayloadV1(
  phoneNumberId: string,
  countryCode: string,
  customerNumber: string,
  templateName: string,
  languageCode: string,
  params: string[],
) {
  // Original shape — placeholders as plain strings
  return {
    phone_number_id: phoneNumberId,
    customer_country_code: countryCode,
    customer_number: customerNumber,
    data: {
      type: 'template',
      context: {
        template_name: templateName,
        language: languageCode,
        body: {
          placeholders: params.map(String),
        },
      },
    },
    reply_to: null,
    myop_ref_id: `labflow_${Date.now()}`,
  };
}

function buildPayloadV2(
  phoneNumberId: string,
  countryCode: string,
  customerNumber: string,
  templateName: string,
  languageCode: string,
  params: string[],
) {
  // Alt shape — placeholders as { type: "text", text: "..." } objects
  return {
    phone_number_id: phoneNumberId,
    customer_country_code: countryCode,
    customer_number: customerNumber,
    data: {
      type: 'template',
      context: {
        template_name: templateName,
        language: languageCode,
        body: {
          placeholders: params.map((p) => ({ type: 'text', text: String(p) })),
        },
      },
    },
    reply_to: null,
    myop_ref_id: `labflow_${Date.now()}_v2`,
  };
}

async function sendToMyOperator(
  payload: unknown,
  token: string,
  companyId: string,
  wabaId: string,
) {
  const apiRes = await fetch('https://publicapi.myoperator.co/chat/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'Authorization': `Bearer ${token}`,
      'X-MYOP-COMPANY-ID': companyId,
      ...(wabaId ? { 'X-WABA-ID': wabaId } : {}),
    },
    body: JSON.stringify(payload),
  });
  const text = await apiRes.text();
  let data: unknown = text;
  try { data = JSON.parse(text); } catch { /* keep text */ }
  return { status: apiRes.status, ok: apiRes.ok, data };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return json({ success: false, error: 'Unauthorized' }, 200);
    }
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } }
    );
    const token = authHeader.replace('Bearer ', '');
    const { data: claims, error: authErr } = await supabase.auth.getUser(token);
    if (authErr || !claims?.user?.id) {
      return json({ success: false, error: 'Unauthorized' }, 200);
    }

    const MYOP_TOKEN = Deno.env.get('MYOPERATOR_TOKEN');
    const MYOP_COMPANY_ID = Deno.env.get('MYOPERATOR_COMPANY_ID');
    const MYOP_PHONE_NUMBER_ID = Deno.env.get('MYOPERATOR_PHONE_NUMBER_ID');
    const MYOP_WABA_ID = Deno.env.get('MYOPERATOR_WABA_ID') ?? '';

    if (!MYOP_TOKEN || !MYOP_COMPANY_ID || !MYOP_PHONE_NUMBER_ID) {
      return json({
        success: false,
        error: 'MyOperator credentials not configured. Missing one of: MYOPERATOR_TOKEN, MYOPERATOR_COMPANY_ID, MYOPERATOR_PHONE_NUMBER_ID',
        configured: {
          MYOPERATOR_TOKEN: !!MYOP_TOKEN,
          MYOPERATOR_COMPANY_ID: !!MYOP_COMPANY_ID,
          MYOPERATOR_PHONE_NUMBER_ID: !!MYOP_PHONE_NUMBER_ID,
        }
      }, 200);
    }

    const body = (await req.json()) as MyOpRequest;
    const { to, templateName = 'copy_labflow', languageCode = 'en', params, mode = 'send' } = body;

    if (!to || !params || !Array.isArray(params)) {
      return json({ success: false, error: 'Missing required fields: to, params[]' }, 200);
    }

    const digits = String(to).replace(/[^0-9]/g, '');
    if (digits.length < 10) {
      return json({ success: false, error: 'Invalid phone number' }, 200);
    }
    const fullNumber = digits.length === 10 ? `91${digits}` : digits;
    const countryCode = fullNumber.slice(0, fullNumber.length - 10);
    const customerNumber = fullNumber.slice(-10);

    const payloadV1 = buildPayloadV1(
      MYOP_PHONE_NUMBER_ID, countryCode, customerNumber, templateName, languageCode, params
    );

    // TEST mode — return assembled payload without calling MyOperator
    if (mode === 'test') {
      return json({
        success: true,
        mode: 'test',
        message: 'Payload assembled but NOT sent to MyOperator. Use mode:"send" to actually send.',
        payload_v1: payloadV1,
        payload_v2: buildPayloadV2(
          MYOP_PHONE_NUMBER_ID, countryCode, customerNumber, templateName, languageCode, params
        ),
        normalized_phone: { fullNumber, countryCode, customerNumber },
        api_endpoint: 'https://publicapi.myoperator.co/chat/messages',
        headers: {
          'X-MYOP-COMPANY-ID': MYOP_COMPANY_ID,
          'X-WABA-ID': MYOP_WABA_ID || '(not set)',
        },
      });
    }

    console.log('[myoperator] sending to', fullNumber, 'template', templateName, 'params', params);

    // Try V1 payload first
    const r1 = await sendToMyOperator(payloadV1, MYOP_TOKEN, MYOP_COMPANY_ID, MYOP_WABA_ID);
    console.log('[myoperator] v1 status', r1.status, 'response', r1.data);

    if (r1.ok) {
      return json({ success: true, attempt: 'v1', status: r1.status, data: r1.data });
    }

    // If V1 failed with a structural-looking error, try V2 payload shape
    const errStr = JSON.stringify(r1.data ?? '').toLowerCase();
    const looksStructural =
      r1.status === 400 ||
      r1.status === 422 ||
      errStr.includes('placeholder') ||
      errStr.includes('body') ||
      errStr.includes('template') ||
      errStr.includes('schema') ||
      errStr.includes('parameter');

    if (looksStructural) {
      const payloadV2 = buildPayloadV2(
        MYOP_PHONE_NUMBER_ID, countryCode, customerNumber, templateName, languageCode, params
      );
      const r2 = await sendToMyOperator(payloadV2, MYOP_TOKEN, MYOP_COMPANY_ID, MYOP_WABA_ID);
      console.log('[myoperator] v2 status', r2.status, 'response', r2.data);

      if (r2.ok) {
        return json({ success: true, attempt: 'v2', status: r2.status, data: r2.data });
      }

      return json({
        success: false,
        attempts: [
          { version: 'v1', status: r1.status, error: r1.data },
          { version: 'v2', status: r2.status, error: r2.data },
        ],
        error: r2.data ?? r1.data,
      });
    }

    return json({
      success: false,
      attempt: 'v1',
      status: r1.status,
      error: r1.data,
    });
  } catch (err) {
    console.error('[myoperator] error', err);
    return json({ success: false, error: (err as Error).message ?? 'Unknown error' }, 200);
  }
});
