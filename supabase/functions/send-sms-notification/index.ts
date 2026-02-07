import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

const securityHeaders = {
  'Content-Security-Policy': "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' https:; connect-src 'self' https:;",
  'X-Frame-Options': 'DENY',
  'X-Content-Type-Options': 'nosniff',
  'X-XSS-Protection': '1; mode=block',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
};

interface SmsRequest {
  to: string;
  message: string;
  provider?: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const smsApiKey = Deno.env.get('SMS_API_KEY');
    const smsApiUrl = Deno.env.get('SMS_API_URL');
    const smsSenderId = Deno.env.get('SMS_SENDER_ID') || 'LABSMS';
    const smsProvider = Deno.env.get('SMS_PROVIDER') || 'generic';

    if (!smsApiKey || !smsApiUrl) {
      throw new Error('SMS API credentials not configured');
    }

    const { to, message }: SmsRequest = await req.json();

    console.log('Sending SMS to:', to, 'via provider:', smsProvider);

    // Generic SMS API call - adjust based on your provider
    const response = await fetch(smsApiUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${smsApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        to: to,
        message: message,
        sender_id: smsSenderId,
      }),
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(`SMS API error: ${JSON.stringify(result)}`);
    }

    console.log('SMS sent successfully:', result);

    return new Response(JSON.stringify({ success: true, data: result }), {
      status: 200,
      headers: { ...corsHeaders, ...securityHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    console.error('Error sending SMS:', error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, ...securityHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
};

serve(handler);
