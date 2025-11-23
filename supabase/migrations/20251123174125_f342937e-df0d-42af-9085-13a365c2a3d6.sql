-- Phase 1: Security Hardening & Audit Logging System

-- 1. Update RLS policy on global_test_types to restrict to authenticated users
DROP POLICY IF EXISTS "All users can view global test types" ON public.global_test_types;

CREATE POLICY "Authenticated users can view global test types"
ON public.global_test_types
FOR SELECT
TO authenticated
USING (true);

-- 2. Create audit_logs table for comprehensive activity tracking
CREATE TABLE public.audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  user_email TEXT NOT NULL,
  user_role TEXT NOT NULL,
  action TEXT NOT NULL, -- 'CREATE', 'UPDATE', 'DELETE', 'VIEW', 'LOGIN', 'LOGOUT'
  table_name TEXT NOT NULL,
  record_id UUID,
  old_data JSONB,
  new_data JSONB,
  ip_address TEXT,
  user_agent TEXT,
  branch_id UUID REFERENCES public.branches(id),
  lab_id UUID REFERENCES public.labs(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add indexes for performance
CREATE INDEX idx_audit_logs_user_id ON public.audit_logs(user_id);
CREATE INDEX idx_audit_logs_created_at ON public.audit_logs(created_at DESC);
CREATE INDEX idx_audit_logs_action ON public.audit_logs(action);
CREATE INDEX idx_audit_logs_table_name ON public.audit_logs(table_name);
CREATE INDEX idx_audit_logs_lab_id ON public.audit_logs(lab_id);
CREATE INDEX idx_audit_logs_branch_id ON public.audit_logs(branch_id);

-- Enable RLS on audit_logs
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies for audit_logs
CREATE POLICY "Super admins can view all audit logs"
ON public.audit_logs
FOR SELECT
TO authenticated
USING (is_super_admin(auth.uid()));

CREATE POLICY "Lab admins can view logs from their organization"
ON public.audit_logs
FOR SELECT
TO authenticated
USING (
  is_lab_admin(auth.uid()) AND
  lab_id IN (
    SELECT l.id FROM labs l
    WHERE l.organization_id = get_user_organization(auth.uid())
  )
);

CREATE POLICY "System can insert audit logs"
ON public.audit_logs
FOR INSERT
TO authenticated
WITH CHECK (true);

-- 3. Create function to log audit events
CREATE OR REPLACE FUNCTION public.log_audit_event(
  p_action TEXT,
  p_table_name TEXT,
  p_record_id UUID,
  p_old_data JSONB DEFAULT NULL,
  p_new_data JSONB DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_profile RECORD;
  v_audit_id UUID;
BEGIN
  -- Get user profile information
  SELECT 
    p.email,
    p.role::TEXT,
    p.branch_id,
    p.lab_id
  INTO v_user_profile
  FROM profiles p
  WHERE p.user_id = auth.uid();
  
  -- Insert audit log
  INSERT INTO audit_logs (
    user_id,
    user_email,
    user_role,
    action,
    table_name,
    record_id,
    old_data,
    new_data,
    branch_id,
    lab_id
  ) VALUES (
    auth.uid(),
    COALESCE(v_user_profile.email, 'system'),
    COALESCE(v_user_profile.role, 'unknown'),
    p_action,
    p_table_name,
    p_record_id,
    p_old_data,
    p_new_data,
    v_user_profile.branch_id,
    v_user_profile.lab_id
  )
  RETURNING id INTO v_audit_id;
  
  RETURN v_audit_id;
END;
$$;

-- 4. Create triggers for automatic audit logging on critical tables

-- Patients audit trigger
CREATE OR REPLACE FUNCTION public.audit_patients_changes()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF (TG_OP = 'DELETE') THEN
    PERFORM log_audit_event('DELETE', 'patients', OLD.id, row_to_json(OLD)::jsonb, NULL);
    RETURN OLD;
  ELSIF (TG_OP = 'UPDATE') THEN
    PERFORM log_audit_event('UPDATE', 'patients', NEW.id, row_to_json(OLD)::jsonb, row_to_json(NEW)::jsonb);
    RETURN NEW;
  ELSIF (TG_OP = 'INSERT') THEN
    PERFORM log_audit_event('CREATE', 'patients', NEW.id, NULL, row_to_json(NEW)::jsonb);
    RETURN NEW;
  END IF;
END;
$$;

CREATE TRIGGER trigger_audit_patients
AFTER INSERT OR UPDATE OR DELETE ON public.patients
FOR EACH ROW EXECUTE FUNCTION audit_patients_changes();

-- Bills audit trigger
CREATE OR REPLACE FUNCTION public.audit_bills_changes()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF (TG_OP = 'DELETE') THEN
    PERFORM log_audit_event('DELETE', 'bills', OLD.id, row_to_json(OLD)::jsonb, NULL);
    RETURN OLD;
  ELSIF (TG_OP = 'UPDATE') THEN
    PERFORM log_audit_event('UPDATE', 'bills', NEW.id, row_to_json(OLD)::jsonb, row_to_json(NEW)::jsonb);
    RETURN NEW;
  ELSIF (TG_OP = 'INSERT') THEN
    PERFORM log_audit_event('CREATE', 'bills', NEW.id, NULL, row_to_json(NEW)::jsonb);
    RETURN NEW;
  END IF;
END;
$$;

CREATE TRIGGER trigger_audit_bills
AFTER INSERT OR UPDATE OR DELETE ON public.bills
FOR EACH ROW EXECUTE FUNCTION audit_bills_changes();

-- Bill Payments audit trigger
CREATE OR REPLACE FUNCTION public.audit_bill_payments_changes()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF (TG_OP = 'DELETE') THEN
    PERFORM log_audit_event('DELETE', 'bill_payments', OLD.id, row_to_json(OLD)::jsonb, NULL);
    RETURN OLD;
  ELSIF (TG_OP = 'UPDATE') THEN
    PERFORM log_audit_event('UPDATE', 'bill_payments', NEW.id, row_to_json(OLD)::jsonb, row_to_json(NEW)::jsonb);
    RETURN NEW;
  ELSIF (TG_OP = 'INSERT') THEN
    PERFORM log_audit_event('CREATE', 'bill_payments', NEW.id, NULL, row_to_json(NEW)::jsonb);
    RETURN NEW;
  END IF;
END;
$$;

CREATE TRIGGER trigger_audit_bill_payments
AFTER INSERT OR UPDATE OR DELETE ON public.bill_payments
FOR EACH ROW EXECUTE FUNCTION audit_bill_payments_changes();

-- Test Reports audit trigger
CREATE OR REPLACE FUNCTION public.audit_test_reports_changes()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF (TG_OP = 'DELETE') THEN
    PERFORM log_audit_event('DELETE', 'test_reports', OLD.id, row_to_json(OLD)::jsonb, NULL);
    RETURN OLD;
  ELSIF (TG_OP = 'UPDATE') THEN
    PERFORM log_audit_event('UPDATE', 'test_reports', NEW.id, row_to_json(OLD)::jsonb, row_to_json(NEW)::jsonb);
    RETURN NEW;
  ELSIF (TG_OP = 'INSERT') THEN
    PERFORM log_audit_event('CREATE', 'test_reports', NEW.id, NULL, row_to_json(NEW)::jsonb);
    RETURN NEW;
  END IF;
END;
$$;

CREATE TRIGGER trigger_audit_test_reports
AFTER INSERT OR UPDATE OR DELETE ON public.test_reports
FOR EACH ROW EXECUTE FUNCTION audit_test_reports_changes();

-- Profiles audit trigger (for user management)
CREATE OR REPLACE FUNCTION public.audit_profiles_changes()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF (TG_OP = 'DELETE') THEN
    PERFORM log_audit_event('DELETE', 'profiles', OLD.id, row_to_json(OLD)::jsonb, NULL);
    RETURN OLD;
  ELSIF (TG_OP = 'UPDATE') THEN
    -- Log role changes specially
    IF OLD.role != NEW.role THEN
      PERFORM log_audit_event('ROLE_CHANGE', 'profiles', NEW.id, 
        jsonb_build_object('old_role', OLD.role, 'email', OLD.email),
        jsonb_build_object('new_role', NEW.role, 'email', NEW.email)
      );
    ELSE
      PERFORM log_audit_event('UPDATE', 'profiles', NEW.id, row_to_json(OLD)::jsonb, row_to_json(NEW)::jsonb);
    END IF;
    RETURN NEW;
  ELSIF (TG_OP = 'INSERT') THEN
    PERFORM log_audit_event('CREATE', 'profiles', NEW.id, NULL, row_to_json(NEW)::jsonb);
    RETURN NEW;
  END IF;
END;
$$;

CREATE TRIGGER trigger_audit_profiles
AFTER INSERT OR UPDATE OR DELETE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION audit_profiles_changes();

-- 5. Create data retention function (keep logs for 7 years as per medical regulations)
CREATE OR REPLACE FUNCTION public.cleanup_old_audit_logs()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Delete audit logs older than 7 years
  DELETE FROM audit_logs 
  WHERE created_at < NOW() - INTERVAL '7 years';
END;
$$;

-- Add comment for documentation
COMMENT ON TABLE public.audit_logs IS 'Comprehensive audit trail for all critical operations. Retention: 7 years per medical data regulations.';