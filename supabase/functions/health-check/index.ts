import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

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

interface HealthCheck {
  status: 'ok' | 'warning' | 'error';
  response_time_ms: number;
  message?: string;
}

interface HealthResponse {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  checks: {
    database: HealthCheck;
    auth: HealthCheck;
    storage: HealthCheck;
  };
  version: string;
  uptime_seconds?: number;
}

const startTime = Date.now();

const measureTime = async <T>(fn: () => Promise<T>): Promise<{ result: T | null; time: number; error?: string }> => {
  const start = performance.now();
  try {
    const result = await fn();
    return { result, time: Math.round(performance.now() - start) };
  } catch (error) {
    return { result: null, time: Math.round(performance.now() - start), error: error.message };
  }
};

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Check database connectivity
    const dbCheck = await measureTime(async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('count')
        .limit(1);
      if (error) throw error;
      return data;
    });

    // Check auth service
    const authCheck = await measureTime(async () => {
      const { data, error } = await supabase.auth.admin.listUsers({ perPage: 1, page: 1 });
      if (error) throw error;
      return data;
    });

    // Check storage service
    const storageCheck = await measureTime(async () => {
      const { data, error } = await supabase.storage.listBuckets();
      if (error) throw error;
      return data;
    });

    const checks: HealthResponse['checks'] = {
      database: {
        status: dbCheck.error ? 'error' : (dbCheck.time > 1000 ? 'warning' : 'ok'),
        response_time_ms: dbCheck.time,
        ...(dbCheck.error && { message: dbCheck.error })
      },
      auth: {
        status: authCheck.error ? 'error' : (authCheck.time > 1000 ? 'warning' : 'ok'),
        response_time_ms: authCheck.time,
        ...(authCheck.error && { message: authCheck.error })
      },
      storage: {
        status: storageCheck.error ? 'error' : (storageCheck.time > 1000 ? 'warning' : 'ok'),
        response_time_ms: storageCheck.time,
        ...(storageCheck.error && { message: storageCheck.error })
      }
    };

    // Determine overall status
    const hasError = Object.values(checks).some(c => c.status === 'error');
    const hasWarning = Object.values(checks).some(c => c.status === 'warning');
    const overallStatus: HealthResponse['status'] = hasError ? 'unhealthy' : (hasWarning ? 'degraded' : 'healthy');

    // Record health metrics to database (non-blocking)
    const totalResponseTime = dbCheck.time + authCheck.time + storageCheck.time;
    supabase.rpc('record_health_check', {
      p_metric_type: 'system_health_check',
      p_metric_value: totalResponseTime,
      p_status: overallStatus === 'healthy' ? 'ok' : (overallStatus === 'degraded' ? 'warning' : 'error'),
      p_metadata: { checks }
    }).then(() => {}).catch(console.error);

    const response: HealthResponse = {
      status: overallStatus,
      timestamp: new Date().toISOString(),
      checks,
      version: '1.0.0',
      uptime_seconds: Math.round((Date.now() - startTime) / 1000)
    };

    console.log(`Health check completed: ${overallStatus}`, JSON.stringify(checks));

    return new Response(JSON.stringify(response), {
      status: overallStatus === 'unhealthy' ? 503 : 200,
      headers: { ...corsHeaders, ...securityHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Health check failed:', error);
    
    return new Response(
      JSON.stringify({
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        error: error.message,
        version: '1.0.0'
      }),
      {
        status: 503,
        headers: { ...corsHeaders, ...securityHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
};

serve(handler);
