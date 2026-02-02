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

interface DashboardRequest {
  time_range?: string; // '1h', '24h', '7d', '30d'
  lab_id?: string;
}

const parseTimeRange = (range: string): number => {
  const units: Record<string, number> = {
    'h': 60 * 60 * 1000,
    'd': 24 * 60 * 60 * 1000,
  };
  const match = range.match(/^(\d+)([hd])$/);
  if (!match) return 24 * 60 * 60 * 1000; // Default 24h
  return parseInt(match[1]) * units[match[2]];
};

const handler = async (req: Request): Promise<Response> => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;

    // Validate JWT for super_admin role
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, ...securityHeaders, 'Content-Type': 'application/json' },
      });
    }

    const userClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } }
    });

    const token = authHeader.replace('Bearer ', '');
    const { data: claims, error: claimsError } = await userClient.auth.getClaims(token);
    
    if (claimsError || !claims?.claims?.sub) {
      return new Response(JSON.stringify({ error: 'Invalid token' }), {
        status: 401,
        headers: { ...corsHeaders, ...securityHeaders, 'Content-Type': 'application/json' },
      });
    }

    const userId = claims.claims.sub;
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    // Check if user is super_admin
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('role')
      .eq('user_id', userId)
      .single();

    if (profileError || profile?.role !== 'super_admin') {
      return new Response(JSON.stringify({ error: 'Forbidden: Super admin access required' }), {
        status: 403,
        headers: { ...corsHeaders, ...securityHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Parse request body
    let requestBody: DashboardRequest = {};
    if (req.method === 'POST') {
      try {
        requestBody = await req.json();
      } catch {
        // Empty body is fine
      }
    }

    const timeRangeMs = parseTimeRange(requestBody.time_range || '24h');
    const startTime = new Date(Date.now() - timeRangeMs);
    const labId = requestBody.lab_id;

    // Fetch endpoint metrics
    let metricsQuery = supabaseAdmin
      .from('endpoint_metrics')
      .select('*')
      .gte('recorded_at', startTime.toISOString());
    
    if (labId) {
      metricsQuery = metricsQuery.eq('lab_id', labId);
    }

    const { data: metrics, error: metricsError } = await metricsQuery;

    // Fetch error logs
    let errorsQuery = supabaseAdmin
      .from('error_logs')
      .select('*')
      .gte('created_at', startTime.toISOString());
    
    if (labId) {
      errorsQuery = errorsQuery.eq('lab_id', labId);
    }

    const { data: errors, error: errorsError } = await errorsQuery;

    // Fetch active sessions
    const { data: sessions, error: sessionsError } = await supabaseAdmin
      .from('user_sessions')
      .select('id')
      .eq('is_active', true)
      .gt('expires_at', new Date().toISOString());

    // Fetch daily active users
    const dayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const { data: loginAttempts, error: loginError } = await supabaseAdmin
      .from('login_attempts')
      .select('user_id')
      .eq('success', true)
      .gte('created_at', dayAgo.toISOString());

    // Fetch storage usage per lab
    const { data: documents, error: docsError } = await supabaseAdmin
      .from('documents')
      .select('lab_id, file_size');

    const { data: labs, error: labsError } = await supabaseAdmin
      .from('labs')
      .select('id, name');

    // Calculate metrics
    const totalRequests = metrics?.length || 0;
    const errorRequests = metrics?.filter(m => m.status_code >= 400).length || 0;
    const avgResponseTime = totalRequests > 0 
      ? Math.round(metrics!.reduce((sum, m) => sum + m.response_time_ms, 0) / totalRequests)
      : 0;

    // Calculate percentiles
    const responseTimes = metrics?.map(m => m.response_time_ms).sort((a, b) => a - b) || [];
    const p95Index = Math.floor(responseTimes.length * 0.95);
    const p99Index = Math.floor(responseTimes.length * 0.99);
    const p95ResponseTime = responseTimes[p95Index] || 0;
    const p99ResponseTime = responseTimes[p99Index] || 0;

    // Calculate slowest endpoints
    const endpointStats: Record<string, { total: number; count: number }> = {};
    metrics?.forEach(m => {
      if (!endpointStats[m.endpoint]) {
        endpointStats[m.endpoint] = { total: 0, count: 0 };
      }
      endpointStats[m.endpoint].total += m.response_time_ms;
      endpointStats[m.endpoint].count++;
    });

    const slowestEndpoints = Object.entries(endpointStats)
      .map(([endpoint, stats]) => ({
        endpoint,
        avg_ms: Math.round(stats.total / stats.count),
        count: stats.count
      }))
      .sort((a, b) => b.avg_ms - a.avg_ms)
      .slice(0, 5);

    // Calculate error stats
    const errorsBySeverity = {
      critical: errors?.filter(e => e.severity === 'critical').length || 0,
      error: errors?.filter(e => e.severity === 'error').length || 0,
      warning: errors?.filter(e => e.severity === 'warning').length || 0,
      info: errors?.filter(e => e.severity === 'info').length || 0,
    };

    const errorsByEndpoint: Record<string, number> = {};
    errors?.forEach(e => {
      if (e.endpoint) {
        errorsByEndpoint[e.endpoint] = (errorsByEndpoint[e.endpoint] || 0) + 1;
      }
    });

    const topErrorEndpoints = Object.entries(errorsByEndpoint)
      .map(([endpoint, count]) => ({ endpoint, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    // Calculate storage per lab
    const storageByLab: Record<string, number> = {};
    documents?.forEach(d => {
      if (d.lab_id && d.file_size) {
        storageByLab[d.lab_id] = (storageByLab[d.lab_id] || 0) + d.file_size;
      }
    });

    const labsMap = new Map(labs?.map(l => [l.id, l.name]) || []);
    const storageByLabWithNames = Object.entries(storageByLab)
      .map(([labId, bytes]) => ({
        lab_id: labId,
        lab_name: labsMap.get(labId) || 'Unknown',
        usage_mb: Math.round(bytes / (1024 * 1024) * 100) / 100
      }))
      .sort((a, b) => b.usage_mb - a.usage_mb);

    const totalStorageMb = storageByLabWithNames.reduce((sum, l) => sum + l.usage_mb, 0);

    // Unique daily active users
    const uniqueUserIds = new Set(loginAttempts?.map(l => l.user_id).filter(Boolean));
    const dailyActiveUsers = uniqueUserIds.size;

    // Calculate requests per minute
    const timeRangeMinutes = timeRangeMs / (60 * 1000);
    const requestsPerMinute = Math.round((totalRequests / timeRangeMinutes) * 100) / 100;

    const response = {
      summary: {
        requests_per_minute: requestsPerMinute,
        error_rate_percent: totalRequests > 0 ? Math.round((errorRequests / totalRequests) * 10000) / 100 : 0,
        avg_response_time_ms: avgResponseTime,
        active_sessions: sessions?.length || 0,
        daily_active_users: dailyActiveUsers
      },
      errors: {
        total: errors?.length || 0,
        by_severity: errorsBySeverity,
        top_endpoints: topErrorEndpoints
      },
      performance: {
        slowest_endpoints: slowestEndpoints,
        p95_response_time_ms: p95ResponseTime,
        p99_response_time_ms: p99ResponseTime
      },
      storage: {
        total_usage_mb: Math.round(totalStorageMb * 100) / 100,
        by_lab: storageByLabWithNames.slice(0, 10)
      },
      meta: {
        time_range: requestBody.time_range || '24h',
        lab_id: labId || null,
        generated_at: new Date().toISOString(),
        data_points: {
          metrics: totalRequests,
          errors: errors?.length || 0
        }
      }
    };

    console.log('Monitoring dashboard generated:', JSON.stringify(response.summary));

    return new Response(JSON.stringify(response), {
      status: 200,
      headers: { ...corsHeaders, ...securityHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Monitoring dashboard error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, ...securityHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
};

serve(handler);
