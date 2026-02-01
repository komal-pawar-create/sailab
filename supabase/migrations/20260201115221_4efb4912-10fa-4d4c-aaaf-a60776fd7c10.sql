-- =============================================
-- SECURE AUTHENTICATION ENHANCEMENT MIGRATION
-- =============================================

-- 1. Login Attempts Table
-- Tracks all login attempts for rate limiting and security auditing
CREATE TABLE public.login_attempts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  username text NOT NULL,
  user_id uuid,
  ip_address inet NOT NULL,
  user_agent text,
  success boolean NOT NULL DEFAULT false,
  failure_reason text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Indexes for efficient rate limiting queries
CREATE INDEX idx_login_attempts_username_created 
  ON public.login_attempts(username, created_at DESC);
CREATE INDEX idx_login_attempts_ip_created 
  ON public.login_attempts(ip_address, created_at DESC);

-- Enable RLS
ALTER TABLE public.login_attempts ENABLE ROW LEVEL SECURITY;

-- RLS Policies for login_attempts
CREATE POLICY "Super admins can view login attempts"
  ON public.login_attempts FOR SELECT
  USING (is_super_admin(auth.uid()));

CREATE POLICY "System can log attempts"
  ON public.login_attempts FOR INSERT
  WITH CHECK (true);

-- 2. User Sessions Table
-- Tracks active sessions for multi-device management and logout capability
CREATE TABLE public.user_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  token_hash text NOT NULL,
  ip_address inet,
  user_agent text,
  device_info jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL,
  last_activity_at timestamptz DEFAULT now(),
  is_active boolean NOT NULL DEFAULT true
);

-- Indexes for efficient session management
CREATE INDEX idx_user_sessions_user_active 
  ON public.user_sessions(user_id, is_active);
CREATE INDEX idx_user_sessions_token_hash 
  ON public.user_sessions(token_hash);
CREATE INDEX idx_user_sessions_expires 
  ON public.user_sessions(expires_at) WHERE is_active = true;

-- Enable RLS
ALTER TABLE public.user_sessions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for user_sessions
CREATE POLICY "Users can view own sessions"
  ON public.user_sessions FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Super admins can view all sessions"
  ON public.user_sessions FOR SELECT
  USING (is_super_admin(auth.uid()));

CREATE POLICY "System can manage sessions"
  ON public.user_sessions FOR ALL
  WITH CHECK (true);

-- =============================================
-- SECURITY RPC FUNCTIONS
-- =============================================

-- 1. Rate Limit Check Function
CREATE OR REPLACE FUNCTION public.check_login_rate_limit(
  p_username text,
  p_ip_address inet
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_failed_count integer;
  v_locked_until timestamptz;
  v_window_start timestamptz;
BEGIN
  -- 15-minute sliding window
  v_window_start := now() - interval '15 minutes';
  
  -- Count failed attempts in window (by username OR IP)
  SELECT COUNT(*) INTO v_failed_count
  FROM login_attempts
  WHERE (LOWER(username) = LOWER(p_username) OR ip_address = p_ip_address)
    AND success = false
    AND created_at > v_window_start;
  
  -- If >= 5 failed attempts, account is locked
  IF v_failed_count >= 5 THEN
    -- Calculate when the lockout expires
    SELECT MIN(created_at) + interval '15 minutes' INTO v_locked_until
    FROM login_attempts
    WHERE (LOWER(username) = LOWER(p_username) OR ip_address = p_ip_address)
      AND success = false
      AND created_at > v_window_start;
    
    RETURN jsonb_build_object(
      'allowed', false,
      'remaining_attempts', 0,
      'locked_until', v_locked_until,
      'message', 'Too many failed attempts. Please try again later.'
    );
  END IF;
  
  RETURN jsonb_build_object(
    'allowed', true,
    'remaining_attempts', 5 - v_failed_count,
    'locked_until', null,
    'message', null
  );
END;
$$;

-- 2. Log Login Attempt Function
CREATE OR REPLACE FUNCTION public.log_login_attempt(
  p_username text,
  p_ip_address inet,
  p_user_agent text,
  p_success boolean,
  p_failure_reason text DEFAULT NULL,
  p_user_id uuid DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_attempt_id uuid;
BEGIN
  INSERT INTO login_attempts (
    username,
    user_id,
    ip_address,
    user_agent,
    success,
    failure_reason
  ) VALUES (
    p_username,
    p_user_id,
    p_ip_address,
    p_user_agent,
    p_success,
    p_failure_reason
  )
  RETURNING id INTO v_attempt_id;
  
  RETURN v_attempt_id;
END;
$$;

-- 3. Create Session Function
CREATE OR REPLACE FUNCTION public.create_user_session(
  p_user_id uuid,
  p_token_hash text,
  p_ip_address inet,
  p_user_agent text,
  p_expires_at timestamptz
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_session_id uuid;
BEGIN
  INSERT INTO user_sessions (
    user_id,
    token_hash,
    ip_address,
    user_agent,
    expires_at
  ) VALUES (
    p_user_id,
    p_token_hash,
    p_ip_address,
    p_user_agent,
    p_expires_at
  )
  RETURNING id INTO v_session_id;
  
  -- Update last_login_at on profile
  UPDATE profiles 
  SET last_login_at = now() 
  WHERE user_id = p_user_id;
  
  RETURN v_session_id;
END;
$$;

-- 4. Refresh Session Function
CREATE OR REPLACE FUNCTION public.refresh_user_session(
  p_token_hash text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_session record;
  v_new_expires_at timestamptz;
BEGIN
  -- Find active session
  SELECT * INTO v_session
  FROM user_sessions
  WHERE token_hash = p_token_hash
    AND is_active = true
    AND expires_at > now();
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'success', false,
      'message', 'Session not found or expired'
    );
  END IF;
  
  -- Extend session by 7 days
  v_new_expires_at := now() + interval '7 days';
  
  UPDATE user_sessions
  SET expires_at = v_new_expires_at,
      last_activity_at = now()
  WHERE id = v_session.id;
  
  RETURN jsonb_build_object(
    'success', true,
    'session_id', v_session.id,
    'expires_at', v_new_expires_at
  );
END;
$$;

-- 5. Logout Function
CREATE OR REPLACE FUNCTION public.logout_user(
  p_user_id uuid,
  p_session_id uuid DEFAULT NULL,
  p_logout_all boolean DEFAULT false
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_invalidated_count integer;
BEGIN
  IF p_logout_all THEN
    -- Invalidate all sessions for this user
    UPDATE user_sessions
    SET is_active = false
    WHERE user_id = p_user_id AND is_active = true;
  ELSIF p_session_id IS NOT NULL THEN
    -- Invalidate specific session
    UPDATE user_sessions
    SET is_active = false
    WHERE id = p_session_id AND user_id = p_user_id AND is_active = true;
  ELSE
    -- Invalid parameters
    RETURN jsonb_build_object(
      'success', false,
      'message', 'Must provide session_id or set logout_all=true'
    );
  END IF;
  
  GET DIAGNOSTICS v_invalidated_count = ROW_COUNT;
  
  RETURN jsonb_build_object(
    'success', true,
    'invalidated_sessions', v_invalidated_count
  );
END;
$$;

-- 6. Cleanup Expired Sessions Function
CREATE OR REPLACE FUNCTION public.cleanup_expired_sessions()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_deleted_count integer;
BEGIN
  -- Mark expired sessions as inactive
  UPDATE user_sessions
  SET is_active = false
  WHERE expires_at < now() AND is_active = true;
  
  GET DIAGNOSTICS v_deleted_count = ROW_COUNT;
  
  -- Delete old login attempts (keep 30 days)
  DELETE FROM login_attempts
  WHERE created_at < now() - interval '30 days';
  
  -- Delete old inactive sessions (keep 90 days)
  DELETE FROM user_sessions
  WHERE is_active = false AND created_at < now() - interval '90 days';
  
  RETURN v_deleted_count;
END;
$$;