import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";
import { Resend } from "npm:resend@2.0.0";

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

interface AnalyticsData {
  totalRevenue: number;
  totalPatients: number;
  totalTests: number;
  avgBillValue: number;
  periodLabel: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const resendApiKey = Deno.env.get('RESEND_API_KEY');
    if (!resendApiKey) {
      throw new Error('RESEND_API_KEY not configured');
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get request parameters
    const { reportType = 'weekly', labId, organizationId } = await req.json();

    // Calculate date range
    const end = new Date();
    const start = new Date();
    if (reportType === 'weekly') {
      start.setDate(end.getDate() - 7);
    } else if (reportType === 'monthly') {
      start.setMonth(end.getMonth() - 1);
    }

    // Fetch analytics data
    let billsQuery = supabase
      .from("bills")
      .select("*")
      .gte("created_at", start.toISOString())
      .lte("created_at", end.toISOString());

    let patientsQuery = supabase
      .from("patients")
      .select("*")
      .gte("created_at", start.toISOString())
      .lte("created_at", end.toISOString());

    let testsQuery = supabase
      .from("test_reports")
      .select("*")
      .gte("created_at", start.toISOString())
      .lte("created_at", end.toISOString());

    // Apply filters if provided
    if (labId) {
      billsQuery = billsQuery.eq("lab_id", labId);
      patientsQuery = patientsQuery.eq("lab_id", labId);
      testsQuery = testsQuery.eq("lab_id", labId);
    }

    const [billsResult, patientsResult, testsResult] = await Promise.all([
      billsQuery,
      patientsQuery,
      testsQuery,
    ]);

    if (billsResult.error) throw billsResult.error;
    if (patientsResult.error) throw patientsResult.error;
    if (testsResult.error) throw testsResult.error;

    // Calculate metrics
    const totalRevenue = billsResult.data.reduce((sum, bill) => sum + Number(bill.total_amount), 0);
    const totalPatients = patientsResult.data.length;
    const totalTests = testsResult.data.length;
    const avgBillValue = billsResult.data.length > 0 ? totalRevenue / billsResult.data.length : 0;

    const analytics: AnalyticsData = {
      totalRevenue,
      totalPatients,
      totalTests,
      avgBillValue,
      periodLabel: reportType === 'weekly' ? 'Last 7 Days' : 'Last 30 Days',
    };

    // Get admin emails
    const { data: adminProfiles, error: profilesError } = await supabase
      .from('profiles')
      .select('email, full_name')
      .or('role.eq.super_admin,role.eq.lab_admin');

    if (profilesError) throw profilesError;

    if (!adminProfiles || adminProfiles.length === 0) {
      console.log('No admin users found to send report');
      return new Response(JSON.stringify({ success: false, message: 'No admin users found' }), {
        status: 200,
        headers: { ...corsHeaders, ...securityHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Generate email HTML
    const emailHtml = generateEmailHtml(analytics);

    // Send emails
    const resend = new Resend(resendApiKey);
    const emailPromises = adminProfiles.map(admin => 
      resend.emails.send({
        from: 'Lab Analytics <onboarding@resend.dev>',
        to: [admin.email],
        subject: `${reportType === 'weekly' ? 'Weekly' : 'Monthly'} Analytics Report`,
        html: emailHtml,
      })
    );

    const results = await Promise.allSettled(emailPromises);
    const successCount = results.filter(r => r.status === 'fulfilled').length;

    console.log(`Analytics report sent to ${successCount}/${adminProfiles.length} admins`);

    return new Response(JSON.stringify({ 
      success: true, 
      sentTo: successCount,
      total: adminProfiles.length 
    }), {
      status: 200,
      headers: { ...corsHeaders, ...securityHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: any) {
    console.error('Error sending analytics report:', error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, ...securityHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
};

function generateEmailHtml(analytics: AnalyticsData): string {
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; border-radius: 8px; text-align: center; }
          .header h1 { margin: 0; font-size: 28px; }
          .header p { margin: 10px 0 0 0; opacity: 0.9; }
          .metrics { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin: 30px 0; }
          .metric-card { background: #f8f9fa; padding: 20px; border-radius: 8px; border-left: 4px solid #667eea; }
          .metric-label { font-size: 14px; color: #666; margin: 0 0 8px 0; }
          .metric-value { font-size: 32px; font-weight: bold; color: #333; margin: 0; }
          .metric-subtitle { font-size: 12px; color: #999; margin: 8px 0 0 0; }
          .footer { text-align: center; margin-top: 40px; padding-top: 20px; border-top: 1px solid #eee; color: #999; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>📊 Analytics Report</h1>
          <p>${analytics.periodLabel}</p>
        </div>
        
        <div class="metrics">
          <div class="metric-card">
            <p class="metric-label">Total Revenue</p>
            <p class="metric-value">₹${analytics.totalRevenue.toLocaleString()}</p>
            <p class="metric-subtitle">Avg: ₹${Math.round(analytics.avgBillValue).toLocaleString()} per bill</p>
          </div>
          
          <div class="metric-card">
            <p class="metric-label">New Patients</p>
            <p class="metric-value">${analytics.totalPatients}</p>
            <p class="metric-subtitle">Patient registrations</p>
          </div>
          
          <div class="metric-card">
            <p class="metric-label">Test Reports</p>
            <p class="metric-value">${analytics.totalTests}</p>
            <p class="metric-subtitle">Tests completed</p>
          </div>
          
          <div class="metric-card">
            <p class="metric-label">Tests per Patient</p>
            <p class="metric-value">${analytics.totalPatients > 0 ? (analytics.totalTests / analytics.totalPatients).toFixed(1) : 0}</p>
            <p class="metric-subtitle">Average ratio</p>
          </div>
        </div>
        
        <div class="footer">
          <p>This is an automated report. Log in to your dashboard for detailed analytics.</p>
        </div>
      </body>
    </html>
  `;
}

serve(handler);
