import { serve } from "https://deno.land/std@0.208.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0";

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

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { username } = await req.json();

    if (!username) {
      throw new Error('Username is required');
    }

    // Get user details and lab admin mobile number
    const { data: userData, error: userError } = await supabase
      .rpc('get_user_by_username', { p_username: username });

    if (userError || !userData || userData.length === 0) {
      throw new Error('User not found');
    }

    const user = userData[0];
    
    // Check if admin mobile number exists for this lab
    if (!user.admin_mobile) {
      throw new Error('No recovery mobile number configured for your organization. Please contact your lab administrator.');
    }

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    // Store OTP in database with 10 minute expiry
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + 10);

    const { error: otpError } = await supabase
      .from('password_reset_otps')
      .insert({
        user_id: user.user_id,
        otp_code: otp,
        mobile_number: user.admin_mobile,
        expires_at: expiresAt.toISOString(),
        used: false
      });

    if (otpError) {
      console.error('OTP storage error:', otpError);
      throw new Error('Failed to generate OTP');
    }

    // In production, integrate with SMS service (Twilio, MSG91, etc.)
    // For now, we'll log the OTP and return masked mobile number
    console.log(`OTP for ${username}: ${otp} - Send to: ${user.admin_mobile}`);

    // Mask mobile number for security (show only last 4 digits)
    const maskedMobile = user.admin_mobile.replace(/\d(?=\d{4})/g, '*');

    return new Response(
      JSON.stringify({
        success: true,
        maskedMobile,
        userId: user.user_id,
        // In development, include OTP for testing (remove in production)
        devOtp: otp
      }),
      {
        headers: { ...corsHeaders, ...securityHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    console.error('Send OTP error:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || 'Failed to send OTP'
      }),
      {
        headers: { ...corsHeaders, ...securityHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    );
  }
});