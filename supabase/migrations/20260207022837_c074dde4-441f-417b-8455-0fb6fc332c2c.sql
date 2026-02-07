-- Fix function search paths to address security linter warnings
-- This ensures functions don't accidentally reference objects from other schemas

ALTER FUNCTION public.get_email_by_username(text) 
  SET search_path = public;

ALTER FUNCTION public.check_login_rate_limit(text, inet) 
  SET search_path = public;

ALTER FUNCTION public.generate_patient_id(uuid, uuid) 
  SET search_path = public;

ALTER FUNCTION public.preview_patient_id(uuid, uuid) 
  SET search_path = public;

ALTER FUNCTION public.log_login_attempt(text, inet, text, boolean, text, uuid)
  SET search_path = public;

ALTER FUNCTION public.create_user_session(uuid, text, inet, text, timestamptz)
  SET search_path = public;

ALTER FUNCTION public.get_user_branch(uuid)
  SET search_path = public;

ALTER FUNCTION public.get_user_lab(uuid)
  SET search_path = public;

ALTER FUNCTION public.get_user_organization(uuid)
  SET search_path = public;

ALTER FUNCTION public.has_role(uuid, user_role)
  SET search_path = public;

ALTER FUNCTION public.generate_bill_number(uuid)
  SET search_path = public;

ALTER FUNCTION public.preview_bill_number(uuid)
  SET search_path = public;

ALTER FUNCTION public.update_bill_after_payment()
  SET search_path = public;

ALTER FUNCTION public.update_bill_after_payment_delete()
  SET search_path = public;

ALTER FUNCTION public.get_next_token_number(uuid, date)
  SET search_path = public;

ALTER FUNCTION public.get_user_by_username(text)
  SET search_path = public;

ALTER FUNCTION public.validate_patient_data()
  SET search_path = public;

ALTER FUNCTION public.logout_user(uuid, uuid, boolean)
  SET search_path = public;

ALTER FUNCTION public.refresh_user_session(text)
  SET search_path = public;

ALTER FUNCTION public.cleanup_expired_sessions()
  SET search_path = public;

ALTER FUNCTION public.auto_populate_user_lab_from_branch()
  SET search_path = public;

ALTER FUNCTION public.get_dashboard_stats(uuid, uuid[], date, date)
  SET search_path = public;

ALTER FUNCTION public.refresh_daily_stats()
  SET search_path = public;

ALTER FUNCTION public.prepare_bills_partitioning()
  SET search_path = public;

ALTER FUNCTION public.get_monitoring_metrics(interval, uuid)
  SET search_path = public;

ALTER FUNCTION public.cleanup_old_error_logs()
  SET search_path = public;

ALTER FUNCTION public.record_health_check(text, numeric, text, jsonb)
  SET search_path = public;

ALTER FUNCTION public.get_next_patient_id(uuid, uuid)
  SET search_path = public;

ALTER FUNCTION public.clear_lab_data(uuid, boolean, boolean, boolean, boolean, boolean, boolean, boolean, boolean, boolean)
  SET search_path = public;

ALTER FUNCTION public.setup_test_environment()
  SET search_path = public;

ALTER FUNCTION public.cleanup_test_environment()
  SET search_path = public;

ALTER FUNCTION public.log_application_error(text, text, text, text, uuid, uuid, uuid, text, jsonb)
  SET search_path = public;