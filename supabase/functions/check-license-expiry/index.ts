import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const securityHeaders = {
  'Content-Security-Policy': "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' https:; connect-src 'self' https:;",
  'X-Frame-Options': 'DENY',
  'X-Content-Type-Options': 'nosniff',
  'X-XSS-Protection': '1; mode=block',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
};

interface Lab {
  id: string;
  name: string;
  admin_mobile_number: string | null;
  license_number: string | null;
  license_type: string | null;
  license_expiry_date: string | null;
  license_status: string | null;
  license_reminder_days: number | null;
  last_license_alert_sent_at: string | null;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log('Starting license expiry check...');

    // Fetch all labs with license expiry dates
    const { data: labs, error: labsError } = await supabase
      .from('labs')
      .select('id, name, admin_mobile_number, license_number, license_type, license_expiry_date, license_status, license_reminder_days, last_license_alert_sent_at')
      .not('license_expiry_date', 'is', null);

    if (labsError) {
      console.error('Error fetching labs:', labsError);
      throw labsError;
    }

    console.log(`Found ${labs?.length || 0} labs with license expiry dates`);

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const results = {
      processed: 0,
      statusUpdated: 0,
      alertsSent: 0,
      errors: [] as string[],
    };

    for (const lab of (labs as Lab[]) || []) {
      try {
        results.processed++;
        
        const expiryDate = new Date(lab.license_expiry_date!);
        expiryDate.setHours(0, 0, 0, 0);
        
        const daysUntilExpiry = Math.ceil((expiryDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
        const reminderDays = lab.license_reminder_days || 30;

        // Determine new status
        let newStatus = 'active';
        if (daysUntilExpiry < 0) {
          newStatus = 'expired';
        } else if (daysUntilExpiry <= reminderDays) {
          newStatus = 'expiring_soon';
        }

        // Update status if changed
        if (lab.license_status !== newStatus) {
          const { error: updateError } = await supabase
            .from('labs')
            .update({ 
              license_status: newStatus,
              updated_at: new Date().toISOString()
            })
            .eq('id', lab.id);

          if (updateError) {
            console.error(`Error updating status for lab ${lab.name}:`, updateError);
          } else {
            results.statusUpdated++;
            console.log(`Updated status for ${lab.name}: ${lab.license_status} -> ${newStatus}`);
          }
        }

        // Determine if we should send an alert
        const alertThresholds = [30, 15, 7, 1, 0, -1]; // Days before expiry to alert
        const shouldAlert = alertThresholds.includes(daysUntilExpiry);
        
        // Check if we already sent an alert today
        const lastAlertDate = lab.last_license_alert_sent_at ? new Date(lab.last_license_alert_sent_at) : null;
        const alreadySentToday = lastAlertDate && 
          lastAlertDate.toDateString() === today.toDateString();

        if (shouldAlert && !alreadySentToday && lab.admin_mobile_number) {
          // Determine alert type
          let alertType = '30_day';
          if (daysUntilExpiry <= 0) alertType = 'expired';
          else if (daysUntilExpiry <= 1) alertType = '1_day';
          else if (daysUntilExpiry <= 7) alertType = '7_day';
          else if (daysUntilExpiry <= 15) alertType = '15_day';

          // Prepare notification message
          let subject = '';
          let message = '';
          
          if (daysUntilExpiry < 0) {
            subject = `URGENT: Lab License Expired - ${lab.name}`;
            message = `The ${lab.license_type || 'license'} (${lab.license_number || 'N/A'}) for ${lab.name} has EXPIRED ${Math.abs(daysUntilExpiry)} day(s) ago on ${expiryDate.toLocaleDateString()}. Please renew immediately to continue operations.`;
          } else if (daysUntilExpiry === 0) {
            subject = `URGENT: Lab License Expires Today - ${lab.name}`;
            message = `The ${lab.license_type || 'license'} (${lab.license_number || 'N/A'}) for ${lab.name} EXPIRES TODAY. Please take immediate action to renew.`;
          } else {
            subject = `License Expiry Reminder - ${lab.name}`;
            message = `This is a reminder that the ${lab.license_type || 'license'} (${lab.license_number || 'N/A'}) for ${lab.name} will expire in ${daysUntilExpiry} day(s) on ${expiryDate.toLocaleDateString()}. Please arrange for renewal.`;
          }

          console.log(`Sending alert for ${lab.name}: ${alertType}`);

          // Try to send SMS notification
          try {
            const { error: smsError } = await supabase.functions.invoke('send-sms-notification', {
              body: {
                phone: lab.admin_mobile_number,
                message: message
              }
            });

            if (smsError) {
              console.error(`SMS error for ${lab.name}:`, smsError);
            }
          } catch (smsErr) {
            console.error(`Failed to send SMS for ${lab.name}:`, smsErr);
          }

          // Log the alert
          const { error: alertLogError } = await supabase
            .from('lab_license_alerts')
            .insert({
              lab_id: lab.id,
              alert_type: alertType,
              sent_to: lab.admin_mobile_number,
              channel: 'sms',
              status: 'sent'
            });

          if (alertLogError) {
            console.error(`Error logging alert for ${lab.name}:`, alertLogError);
          }

          // Update last alert sent timestamp
          const { error: timestampError } = await supabase
            .from('labs')
            .update({ last_license_alert_sent_at: new Date().toISOString() })
            .eq('id', lab.id);

          if (timestampError) {
            console.error(`Error updating timestamp for ${lab.name}:`, timestampError);
          }

          results.alertsSent++;
        }
      } catch (labError: any) {
        console.error(`Error processing lab ${lab.name}:`, labError);
        results.errors.push(`${lab.name}: ${labError.message}`);
      }
    }

    console.log('License expiry check complete:', results);

    return new Response(
      JSON.stringify({
        success: true,
        message: 'License expiry check completed',
        results
      }),
      { 
        headers: { ...corsHeaders, ...securityHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );
  } catch (error: any) {
    console.error('Error in check-license-expiry:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message 
      }),
      { 
        headers: { ...corsHeaders, ...securityHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    );
  }
});
