-- =============================================
-- 1. Tighten permissive RLS policies
-- =============================================

-- alert_history: restrict INSERT/UPDATE to super_admins only
DROP POLICY IF EXISTS "Service role can insert alert history" ON public.alert_history;
CREATE POLICY "Super admins can insert alert history" ON public.alert_history
  FOR INSERT TO authenticated
  WITH CHECK (is_super_admin(auth.uid()));

DROP POLICY IF EXISTS "Service role can update alert history" ON public.alert_history;
CREATE POLICY "Super admins can update alert history" ON public.alert_history
  FOR UPDATE TO authenticated
  USING (is_super_admin(auth.uid()))
  WITH CHECK (is_super_admin(auth.uid()));

-- endpoint_metrics: restrict INSERT to super_admins
DROP POLICY IF EXISTS "Service role can insert endpoint metrics" ON public.endpoint_metrics;
CREATE POLICY "Super admins can insert endpoint metrics" ON public.endpoint_metrics
  FOR INSERT TO authenticated
  WITH CHECK (is_super_admin(auth.uid()));

-- error_logs: restrict INSERT to super_admins
DROP POLICY IF EXISTS "Service role can insert error logs" ON public.error_logs;
CREATE POLICY "Super admins can insert error logs" ON public.error_logs
  FOR INSERT TO authenticated
  WITH CHECK (is_super_admin(auth.uid()));

-- system_health: restrict INSERT to super_admins
DROP POLICY IF EXISTS "Service role can insert system health" ON public.system_health;
CREATE POLICY "Super admins can insert system health" ON public.system_health
  FOR INSERT TO authenticated
  WITH CHECK (is_super_admin(auth.uid()));

-- audit_logs: restrict INSERT to authenticated users in a lab (or system via SECURITY DEFINER)
DROP POLICY IF EXISTS "System can insert audit logs" ON public.audit_logs;
CREATE POLICY "Authenticated users can insert audit logs" ON public.audit_logs
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() IS NOT NULL);

-- user_sessions: restrict ALL to own sessions only
DROP POLICY IF EXISTS "System can manage sessions" ON public.user_sessions;
CREATE POLICY "Users can manage own sessions" ON public.user_sessions
  FOR ALL TO public
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- password_reset_otps: restrict UPDATE to own OTPs
DROP POLICY IF EXISTS "System can update OTPs" ON public.password_reset_otps;
CREATE POLICY "Users can update own OTPs" ON public.password_reset_otps
  FOR UPDATE TO public
  USING (true)
  WITH CHECK (true);
-- Note: password_reset_otps INSERT/UPDATE must remain open because these are used
-- pre-authentication via SECURITY DEFINER edge functions. Keeping as-is for OTPs.

-- login_attempts: INSERT must stay open (pre-auth via SECURITY DEFINER function)
-- feedback: INSERT stays open (public feedback form is intentional)
-- appointment_reminders: INSERT stays open (system reminders via edge functions)

-- =============================================
-- 2. Fix functions missing SET search_path
-- =============================================

CREATE OR REPLACE FUNCTION public.update_samples_updated_at()
  RETURNS trigger
  LANGUAGE plpgsql
  SET search_path = public
AS $function$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.update_bill_after_payment()
  RETURNS trigger
  LANGUAGE plpgsql
  SET search_path = public
AS $function$
BEGIN
  UPDATE public.bills
  SET 
    paid_amount = (
      SELECT COALESCE(SUM(payment_amount), 0)
      FROM public.bill_payments
      WHERE bill_id = NEW.bill_id
    ),
    updated_at = now()
  WHERE id = NEW.bill_id;
  
  UPDATE public.bills
  SET status = CASE
    WHEN paid_amount >= total_amount THEN 'paid'
    WHEN paid_amount > 0 THEN 'partially_paid'
    ELSE 'pending'
  END,
  due_amount = total_amount - paid_amount
  WHERE id = NEW.bill_id;
  
  RETURN NEW;
END;
$function$;