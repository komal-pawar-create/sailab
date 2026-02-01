-- ============================================
-- LABFLOW PRODUCTION MONITORING SYSTEM
-- Phase 1: Database Schema & Functions
-- ============================================

-- 1. Create error_logs table
CREATE TABLE public.error_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  error_code TEXT NOT NULL,
  message TEXT NOT NULL,
  stack_trace TEXT,
  endpoint TEXT,
  lab_id UUID REFERENCES public.labs(id) ON DELETE SET NULL,
  branch_id UUID REFERENCES public.branches(id) ON DELETE SET NULL,
  user_id UUID,
  severity TEXT NOT NULL DEFAULT 'error' CHECK (severity IN ('info', 'warning', 'error', 'critical')),
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes for error_logs
CREATE INDEX idx_error_logs_created_at ON public.error_logs(created_at DESC);
CREATE INDEX idx_error_logs_lab_id ON public.error_logs(lab_id);
CREATE INDEX idx_error_logs_severity ON public.error_logs(severity);
CREATE INDEX idx_error_logs_error_code ON public.error_logs(error_code);

-- 2. Create system_health table
CREATE TABLE public.system_health (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  metric_type TEXT NOT NULL,
  metric_value NUMERIC,
  status TEXT NOT NULL DEFAULT 'ok' CHECK (status IN ('ok', 'warning', 'error')),
  lab_id UUID REFERENCES public.labs(id) ON DELETE SET NULL,
  metadata JSONB DEFAULT '{}'::jsonb,
  recorded_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes for system_health
CREATE INDEX idx_system_health_recorded_at ON public.system_health(recorded_at DESC);
CREATE INDEX idx_system_health_metric_type ON public.system_health(metric_type);
CREATE INDEX idx_system_health_status ON public.system_health(status);

-- 3. Create endpoint_metrics table
CREATE TABLE public.endpoint_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  endpoint TEXT NOT NULL,
  method TEXT NOT NULL DEFAULT 'GET',
  response_time_ms INTEGER NOT NULL,
  status_code INTEGER NOT NULL,
  lab_id UUID REFERENCES public.labs(id) ON DELETE SET NULL,
  recorded_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes for endpoint_metrics
CREATE INDEX idx_endpoint_metrics_recorded_at ON public.endpoint_metrics(recorded_at DESC);
CREATE INDEX idx_endpoint_metrics_endpoint ON public.endpoint_metrics(endpoint);
CREATE INDEX idx_endpoint_metrics_status_code ON public.endpoint_metrics(status_code);

-- 4. Create alert_rules table
CREATE TABLE public.alert_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rule_name TEXT NOT NULL,
  metric_type TEXT NOT NULL,
  threshold_value NUMERIC NOT NULL,
  comparison TEXT NOT NULL DEFAULT 'gt' CHECK (comparison IN ('gt', 'lt', 'eq', 'gte', 'lte')),
  time_window_minutes INTEGER NOT NULL DEFAULT 15,
  is_active BOOLEAN NOT NULL DEFAULT true,
  notification_channels TEXT[] DEFAULT ARRAY['email']::TEXT[],
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 5. Create alert_history table
CREATE TABLE public.alert_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rule_id UUID NOT NULL REFERENCES public.alert_rules(id) ON DELETE CASCADE,
  triggered_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  resolved_at TIMESTAMPTZ,
  metric_value NUMERIC NOT NULL,
  notification_sent BOOLEAN NOT NULL DEFAULT false,
  notification_error TEXT
);

-- Indexes for alert_history
CREATE INDEX idx_alert_history_rule_id ON public.alert_history(rule_id);
CREATE INDEX idx_alert_history_triggered_at ON public.alert_history(triggered_at DESC);

-- ============================================
-- RLS POLICIES
-- ============================================

-- Enable RLS on all monitoring tables
ALTER TABLE public.error_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_health ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.endpoint_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.alert_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.alert_history ENABLE ROW LEVEL SECURITY;

-- error_logs policies
CREATE POLICY "Super admins can read all error logs"
  ON public.error_logs FOR SELECT
  TO authenticated
  USING (public.is_super_admin(auth.uid()));

CREATE POLICY "Lab admins can read their lab error logs"
  ON public.error_logs FOR SELECT
  TO authenticated
  USING (
    public.is_lab_admin(auth.uid()) AND 
    lab_id = public.get_user_lab(auth.uid())
  );

CREATE POLICY "Service role can insert error logs"
  ON public.error_logs FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- system_health policies
CREATE POLICY "Super admins can read system health"
  ON public.system_health FOR SELECT
  TO authenticated
  USING (public.is_super_admin(auth.uid()));

CREATE POLICY "Service role can insert system health"
  ON public.system_health FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- endpoint_metrics policies
CREATE POLICY "Super admins can read endpoint metrics"
  ON public.endpoint_metrics FOR SELECT
  TO authenticated
  USING (public.is_super_admin(auth.uid()));

CREATE POLICY "Service role can insert endpoint metrics"
  ON public.endpoint_metrics FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- alert_rules policies
CREATE POLICY "Super admins can manage alert rules"
  ON public.alert_rules FOR ALL
  TO authenticated
  USING (public.is_super_admin(auth.uid()))
  WITH CHECK (public.is_super_admin(auth.uid()));

-- alert_history policies
CREATE POLICY "Super admins can read alert history"
  ON public.alert_history FOR SELECT
  TO authenticated
  USING (public.is_super_admin(auth.uid()));

CREATE POLICY "Service role can insert alert history"
  ON public.alert_history FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Service role can update alert history"
  ON public.alert_history FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- ============================================
-- DATABASE FUNCTIONS
-- ============================================

-- Function to log application errors
CREATE OR REPLACE FUNCTION public.log_application_error(
  p_error_code TEXT,
  p_message TEXT,
  p_stack_trace TEXT DEFAULT NULL,
  p_endpoint TEXT DEFAULT NULL,
  p_lab_id UUID DEFAULT NULL,
  p_branch_id UUID DEFAULT NULL,
  p_user_id UUID DEFAULT NULL,
  p_severity TEXT DEFAULT 'error',
  p_metadata JSONB DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_error_id UUID;
BEGIN
  INSERT INTO public.error_logs (
    error_code,
    message,
    stack_trace,
    endpoint,
    lab_id,
    branch_id,
    user_id,
    severity,
    metadata
  ) VALUES (
    p_error_code,
    p_message,
    p_stack_trace,
    p_endpoint,
    p_lab_id,
    p_branch_id,
    p_user_id,
    p_severity,
    COALESCE(p_metadata, '{}'::jsonb)
  )
  RETURNING id INTO v_error_id;
  
  RETURN v_error_id;
END;
$$;

-- Function to get monitoring metrics for dashboard
CREATE OR REPLACE FUNCTION public.get_monitoring_metrics(
  p_time_range INTERVAL DEFAULT '24 hours',
  p_lab_id UUID DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_result JSONB;
  v_start_time TIMESTAMPTZ;
  v_total_requests BIGINT;
  v_error_count BIGINT;
  v_avg_response_time NUMERIC;
  v_p95_response_time NUMERIC;
  v_p99_response_time NUMERIC;
  v_active_sessions BIGINT;
  v_daily_active_users BIGINT;
BEGIN
  v_start_time := now() - p_time_range;
  
  -- Get request metrics
  SELECT 
    COUNT(*),
    COUNT(*) FILTER (WHERE status_code >= 400),
    COALESCE(AVG(response_time_ms), 0),
    COALESCE(PERCENTILE_CONT(0.95) WITHIN GROUP (ORDER BY response_time_ms), 0),
    COALESCE(PERCENTILE_CONT(0.99) WITHIN GROUP (ORDER BY response_time_ms), 0)
  INTO v_total_requests, v_error_count, v_avg_response_time, v_p95_response_time, v_p99_response_time
  FROM public.endpoint_metrics
  WHERE recorded_at >= v_start_time
    AND (p_lab_id IS NULL OR lab_id = p_lab_id);
  
  -- Get active sessions (from user_sessions if exists, otherwise estimate)
  SELECT COUNT(*) INTO v_active_sessions
  FROM public.user_sessions
  WHERE is_active = true AND expires_at > now();
  
  -- Get daily active users (unique users with login in last 24h)
  SELECT COUNT(DISTINCT user_id) INTO v_daily_active_users
  FROM public.login_attempts
  WHERE success = true AND created_at >= now() - INTERVAL '24 hours';
  
  -- Build result JSON
  v_result := jsonb_build_object(
    'summary', jsonb_build_object(
      'requests_per_minute', ROUND((v_total_requests::NUMERIC / EXTRACT(EPOCH FROM p_time_range) * 60)::NUMERIC, 2),
      'error_rate_percent', CASE WHEN v_total_requests > 0 THEN ROUND((v_error_count::NUMERIC / v_total_requests * 100)::NUMERIC, 2) ELSE 0 END,
      'avg_response_time_ms', ROUND(v_avg_response_time::NUMERIC, 0),
      'active_sessions', v_active_sessions,
      'daily_active_users', v_daily_active_users
    ),
    'performance', jsonb_build_object(
      'p95_response_time_ms', ROUND(v_p95_response_time::NUMERIC, 0),
      'p99_response_time_ms', ROUND(v_p99_response_time::NUMERIC, 0)
    ),
    'time_range', p_time_range::TEXT,
    'generated_at', now()
  );
  
  RETURN v_result;
END;
$$;

-- Function to cleanup old error logs (30 days)
CREATE OR REPLACE FUNCTION public.cleanup_old_error_logs()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_deleted_count INTEGER;
BEGIN
  DELETE FROM public.error_logs
  WHERE created_at < now() - INTERVAL '30 days';
  
  GET DIAGNOSTICS v_deleted_count = ROW_COUNT;
  
  -- Also cleanup old endpoint metrics (7 days for granular data)
  DELETE FROM public.endpoint_metrics
  WHERE recorded_at < now() - INTERVAL '7 days';
  
  -- Cleanup old system_health records (30 days)
  DELETE FROM public.system_health
  WHERE recorded_at < now() - INTERVAL '30 days';
  
  RETURN v_deleted_count;
END;
$$;

-- Function to record health check result
CREATE OR REPLACE FUNCTION public.record_health_check(
  p_metric_type TEXT,
  p_metric_value NUMERIC,
  p_status TEXT,
  p_metadata JSONB DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_health_id UUID;
BEGIN
  INSERT INTO public.system_health (
    metric_type,
    metric_value,
    status,
    metadata
  ) VALUES (
    p_metric_type,
    p_metric_value,
    p_status,
    COALESCE(p_metadata, '{}'::jsonb)
  )
  RETURNING id INTO v_health_id;
  
  RETURN v_health_id;
END;
$$;

-- Insert default alert rules
INSERT INTO public.alert_rules (rule_name, metric_type, threshold_value, comparison, time_window_minutes, notification_channels)
VALUES 
  ('High Error Rate', 'error_rate', 5, 'gt', 15, ARRAY['email', 'sms']),
  ('Slow Response Time', 'avg_response_time', 500, 'gt', 10, ARRAY['email']),
  ('Login Attack Detection', 'failed_logins', 10, 'gt', 5, ARRAY['email', 'sms']),
  ('Database Slow', 'db_response_time', 1000, 'gt', 5, ARRAY['email']),
  ('Storage Critical', 'storage_usage_percent', 90, 'gt', 60, ARRAY['email', 'sms']);