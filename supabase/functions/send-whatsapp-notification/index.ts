import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface WhatsAppRequest {
  to: string;
  message: string;
  templateName?: string;
  templateParams?: string[];
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const whatsappApiKey = Deno.env.get('WHATSAPP_API_KEY');
    const whatsappPhoneNumberId = Deno.env.get('WHATSAPP_PHONE_NUMBER_ID');

    if (!whatsappApiKey || !whatsappPhoneNumberId) {
      throw new Error('WhatsApp API credentials not configured');
    }

    const { to, message, templateName, templateParams }: WhatsAppRequest = await req.json();

    console.log('Sending WhatsApp message to:', to);

    // WhatsApp Business API endpoint
    const apiUrl = `https://graph.facebook.com/v18.0/${whatsappPhoneNumberId}/messages`;

    let messageBody;
    
    if (templateName) {
      // Using template message
      messageBody = {
        messaging_product: 'whatsapp',
        to: to,
        type: 'template',
        template: {
          name: templateName,
          language: { code: 'en' },
          components: templateParams ? [
            {
              type: 'body',
              parameters: templateParams.map(param => ({ type: 'text', text: param }))
            }
          ] : []
        }
      };
    } else {
      // Using text message
      messageBody = {
        messaging_product: 'whatsapp',
        to: to,
        type: 'text',
        text: { body: message }
      };
    }

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${whatsappApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(messageBody),
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(`WhatsApp API error: ${JSON.stringify(result)}`);
    }

    console.log('WhatsApp message sent successfully:', result);

    return new Response(JSON.stringify({ success: true, data: result }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    console.error('Error sending WhatsApp message:', error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
};

serve(handler);
