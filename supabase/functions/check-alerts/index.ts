import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

interface AlertRule {
  id: string;
  rule_name: string;
  metric_type: string;
  threshold_value: number;
  comparison: 'gt' | 'lt' | 'eq' | 'gte' | 'lte';
  time_window_minutes: number;
  notification_channels: string[];
}

interface AlertResult {
  rule_id: string;
  rule_name: string;
  triggered: boolean;
  metric_value: number;
  threshold: number;
  notification_sent: boolean;
  error?: string;
}

const compareValues = (value: number, threshold: number, comparison: string): boolean => {
  switch (comparison) {
    case 'gt': return value > threshold;
    case 'lt': return value < threshold;
    case 'eq': return value === threshold;
    case 'gte': return value >= threshold;
    case 'lte': return value <= threshold;
    default: return false;
  }
};

const handler = async (req: Request): Promise<Response> => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  const results: AlertResult[] = [];

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log('Starting alert check...');

    // Fetch active alert rules
    const { data: rules, error: rulesError } = await supabase
      .from('alert_rules')
      .select('*')
      .eq('is_active', true);

    if (rulesError) {
      throw new Error(`Failed to fetch alert rules: ${rulesError.message}`);
    }

    if (!rules || rules.length === 0) {
      console.log('No active alert rules found');
      return new Response(
        JSON.stringify({ message: 'No active alert rules', results: [] }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Processing ${rules.length} alert rules`);

    for (const rule of rules as AlertRule[]) {
      let metricValue = 0;
      const windowStart = new Date(Date.now() - rule.time_window_minutes * 60 * 1000);

      try {
        // Calculate metric based on type
        switch (rule.metric_type) {
          case 'error_rate': {
            // Calculate error rate percentage
            const { data: metrics } = await supabase
              .from('endpoint_metrics')
              .select('status_code')
              .gte('recorded_at', windowStart.toISOString());

            if (metrics && metrics.length > 0) {
              const errorCount = metrics.filter(m => m.status_code >= 400).length;
              metricValue = (errorCount / metrics.length) * 100;
            }
            break;
          }

          case 'avg_response_time': {
            // Calculate average response time
            const { data: metrics } = await supabase
              .from('endpoint_metrics')
              .select('response_time_ms')
              .gte('recorded_at', windowStart.toISOString());

            if (metrics && metrics.length > 0) {
              metricValue = metrics.reduce((sum, m) => sum + m.response_time_ms, 0) / metrics.length;
            }
            break;
          }

          case 'failed_logins': {
            // Count failed login attempts per minute
            const { data: attempts } = await supabase
              .from('login_attempts')
              .select('id')
              .eq('success', false)
              .gte('created_at', windowStart.toISOString());

            const count = attempts?.length || 0;
            metricValue = count / rule.time_window_minutes; // per minute rate
            break;
          }

          case 'db_response_time': {
            // Get latest DB health check response time
            const { data: health } = await supabase
              .from('system_health')
              .select('metric_value')
              .eq('metric_type', 'system_health_check')
              .gte('recorded_at', windowStart.toISOString())
              .order('recorded_at', { ascending: false })
              .limit(1)
              .single();

            metricValue = health?.metric_value || 0;
            break;
          }

          case 'storage_usage_percent': {
            // Calculate storage usage (mock - would need storage quota info)
            const { data: docs } = await supabase
              .from('documents')
              .select('file_size');

            const totalBytes = docs?.reduce((sum, d) => sum + (d.file_size || 0), 0) || 0;
            // Assuming 10GB storage limit for this example
            const storageLimit = 10 * 1024 * 1024 * 1024;
            metricValue = (totalBytes / storageLimit) * 100;
            break;
          }

          default:
            console.log(`Unknown metric type: ${rule.metric_type}`);
            continue;
        }

        // Check if threshold is breached
        const triggered = compareValues(metricValue, rule.threshold_value, rule.comparison);

        const result: AlertResult = {
          rule_id: rule.id,
          rule_name: rule.rule_name,
          triggered,
          metric_value: Math.round(metricValue * 100) / 100,
          threshold: rule.threshold_value,
          notification_sent: false
        };

        if (triggered) {
          console.log(`ALERT TRIGGERED: ${rule.rule_name} - Value: ${metricValue}, Threshold: ${rule.threshold_value}`);

          // Check if already alerted recently (within time window) to avoid spam
          const { data: recentAlert } = await supabase
            .from('alert_history')
            .select('id')
            .eq('rule_id', rule.id)
            .is('resolved_at', null)
            .gte('triggered_at', windowStart.toISOString())
            .limit(1)
            .single();

          if (!recentAlert) {
            // Create alert history record
            const { data: alertRecord, error: alertError } = await supabase
              .from('alert_history')
              .insert({
                rule_id: rule.id,
                metric_value: metricValue,
                notification_sent: false
              })
              .select()
              .single();

            if (alertError) {
              console.error(`Failed to create alert record: ${alertError.message}`);
              result.error = alertError.message;
            } else {
              // Send notifications
              let notificationSent = false;
              let notificationError = '';

              for (const channel of rule.notification_channels) {
                try {
                  if (channel === 'email') {
                    // Invoke email notification
                    const { error: emailError } = await supabase.functions.invoke('send-email-notification', {
                      body: {
                        to: 'admin@labflow.com', // Would be configurable
                        subject: `[ALERT] ${rule.rule_name}`,
                        html: `
                          <h2>🚨 Alert Triggered: ${rule.rule_name}</h2>
                          <p><strong>Metric:</strong> ${rule.metric_type}</p>
                          <p><strong>Current Value:</strong> ${Math.round(metricValue * 100) / 100}</p>
                          <p><strong>Threshold:</strong> ${rule.threshold_value}</p>
                          <p><strong>Time:</strong> ${new Date().toISOString()}</p>
                          <hr/>
                          <p style="color: #666;">This is an automated alert from LabFlow Monitoring System.</p>
                        `
                      }
                    });

                    if (!emailError) {
                      notificationSent = true;
                      console.log(`Email notification sent for ${rule.rule_name}`);
                    } else {
                      notificationError += `Email: ${emailError.message}; `;
                    }
                  }

                  if (channel === 'sms') {
                    // Invoke SMS notification
                    const { error: smsError } = await supabase.functions.invoke('send-sms-notification', {
                      body: {
                        to: '+1234567890', // Would be configurable
                        message: `[ALERT] ${rule.rule_name}: ${rule.metric_type} = ${Math.round(metricValue * 100) / 100} (threshold: ${rule.threshold_value})`
                      }
                    });

                    if (!smsError) {
                      notificationSent = true;
                      console.log(`SMS notification sent for ${rule.rule_name}`);
                    } else {
                      notificationError += `SMS: ${smsError.message}; `;
                    }
                  }
                } catch (err) {
                  notificationError += `${channel}: ${err.message}; `;
                }
              }

              // Update alert record with notification status
              await supabase
                .from('alert_history')
                .update({
                  notification_sent: notificationSent,
                  notification_error: notificationError || null
                })
                .eq('id', alertRecord.id);

              result.notification_sent = notificationSent;
              if (notificationError) {
                result.error = notificationError;
              }
            }
          } else {
            console.log(`Skipping duplicate alert for ${rule.rule_name} (already active)`);
          }
        } else {
          // Check if there's an active alert to resolve
          const { data: activeAlert } = await supabase
            .from('alert_history')
            .select('id')
            .eq('rule_id', rule.id)
            .is('resolved_at', null)
            .limit(1)
            .single();

          if (activeAlert) {
            // Resolve the alert
            await supabase
              .from('alert_history')
              .update({ resolved_at: new Date().toISOString() })
              .eq('id', activeAlert.id);

            console.log(`Alert resolved: ${rule.rule_name}`);
          }
        }

        results.push(result);

      } catch (ruleError) {
        console.error(`Error processing rule ${rule.rule_name}:`, ruleError);
        results.push({
          rule_id: rule.id,
          rule_name: rule.rule_name,
          triggered: false,
          metric_value: 0,
          threshold: rule.threshold_value,
          notification_sent: false,
          error: ruleError.message
        });
      }
    }

    const triggeredCount = results.filter(r => r.triggered).length;
    console.log(`Alert check complete: ${triggeredCount}/${results.length} alerts triggered`);

    return new Response(
      JSON.stringify({
        message: `Processed ${results.length} rules, ${triggeredCount} alerts triggered`,
        timestamp: new Date().toISOString(),
        results
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Check alerts error:', error);
    return new Response(
      JSON.stringify({ error: error.message, results }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
};

serve(handler);
