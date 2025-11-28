-- Create appointments table
CREATE TABLE IF NOT EXISTS public.appointments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
  branch_id UUID REFERENCES public.branches(id) ON DELETE CASCADE,
  lab_id UUID NOT NULL REFERENCES public.labs(id) ON DELETE CASCADE,
  appointment_date DATE NOT NULL,
  appointment_time TIME NOT NULL,
  appointment_type TEXT NOT NULL DEFAULT 'in-lab' CHECK (appointment_type IN ('in-lab', 'home-collection')),
  status TEXT NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'confirmed', 'in-progress', 'completed', 'cancelled', 'no-show')),
  test_types TEXT[] DEFAULT '{}',
  collection_address TEXT,
  collection_phone TEXT,
  collection_latitude DECIMAL(10, 8),
  collection_longitude DECIMAL(11, 8),
  assigned_collector UUID REFERENCES auth.users(id),
  notes TEXT,
  reminder_sent BOOLEAN DEFAULT false,
  created_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create walk-in tokens table
CREATE TABLE IF NOT EXISTS public.walk_in_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  branch_id UUID NOT NULL REFERENCES public.branches(id) ON DELETE CASCADE,
  lab_id UUID NOT NULL REFERENCES public.labs(id) ON DELETE CASCADE,
  token_number INTEGER NOT NULL,
  token_date DATE NOT NULL DEFAULT CURRENT_DATE,
  patient_id UUID REFERENCES public.patients(id) ON DELETE SET NULL,
  patient_name TEXT NOT NULL,
  patient_phone TEXT NOT NULL,
  service_type TEXT NOT NULL DEFAULT 'sample-collection',
  status TEXT NOT NULL DEFAULT 'waiting' CHECK (status IN ('waiting', 'called', 'in-service', 'completed', 'cancelled')),
  created_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  called_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  UNIQUE(branch_id, token_number, token_date)
);

-- Create appointment reminders table
CREATE TABLE IF NOT EXISTS public.appointment_reminders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  appointment_id UUID NOT NULL REFERENCES public.appointments(id) ON DELETE CASCADE,
  reminder_type TEXT NOT NULL CHECK (reminder_type IN ('sms', 'whatsapp', 'email')),
  sent_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  status TEXT NOT NULL DEFAULT 'sent' CHECK (status IN ('sent', 'failed', 'delivered')),
  error_message TEXT
);

-- Enable RLS
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.walk_in_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.appointment_reminders ENABLE ROW LEVEL SECURITY;

-- RLS Policies for appointments
CREATE POLICY "Branch operators can manage appointments in their branch"
  ON public.appointments FOR ALL
  USING (branch_id = get_user_branch(auth.uid()))
  WITH CHECK (branch_id = get_user_branch(auth.uid()));

CREATE POLICY "Lab admins can manage appointments in their organization"
  ON public.appointments FOR ALL
  USING (EXISTS (
    SELECT 1 FROM branches b
    WHERE b.id = appointments.branch_id
    AND b.organization_id = get_user_organization(auth.uid())
  ));

CREATE POLICY "Super admins can manage all appointments"
  ON public.appointments FOR ALL
  USING (is_super_admin(auth.uid()));

-- RLS Policies for walk_in_tokens
CREATE POLICY "Branch operators can manage tokens in their branch"
  ON public.walk_in_tokens FOR ALL
  USING (branch_id = get_user_branch(auth.uid()))
  WITH CHECK (branch_id = get_user_branch(auth.uid()));

CREATE POLICY "Lab admins can manage tokens in their organization"
  ON public.walk_in_tokens FOR ALL
  USING (EXISTS (
    SELECT 1 FROM branches b
    WHERE b.id = walk_in_tokens.branch_id
    AND b.organization_id = get_user_organization(auth.uid())
  ));

CREATE POLICY "Super admins can manage all tokens"
  ON public.walk_in_tokens FOR ALL
  USING (is_super_admin(auth.uid()));

-- RLS Policies for appointment_reminders
CREATE POLICY "Users can view reminders for their appointments"
  ON public.appointment_reminders FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM appointments a
    WHERE a.id = appointment_reminders.appointment_id
    AND (a.branch_id = get_user_branch(auth.uid()) OR is_super_admin(auth.uid()))
  ));

CREATE POLICY "System can insert reminders"
  ON public.appointment_reminders FOR INSERT
  WITH CHECK (true);

-- Create indexes for performance
CREATE INDEX idx_appointments_date ON public.appointments(appointment_date);
CREATE INDEX idx_appointments_branch ON public.appointments(branch_id);
CREATE INDEX idx_appointments_patient ON public.appointments(patient_id);
CREATE INDEX idx_appointments_status ON public.appointments(status);
CREATE INDEX idx_tokens_branch_date ON public.walk_in_tokens(branch_id, token_date);
CREATE INDEX idx_tokens_status ON public.walk_in_tokens(status);

-- Create trigger for updated_at
CREATE TRIGGER update_appointments_updated_at
  BEFORE UPDATE ON public.appointments
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Function to generate next token number
CREATE OR REPLACE FUNCTION get_next_token_number(p_branch_id UUID, p_token_date DATE)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_next_token INTEGER;
BEGIN
  SELECT COALESCE(MAX(token_number), 0) + 1
  INTO v_next_token
  FROM walk_in_tokens
  WHERE branch_id = p_branch_id
  AND token_date = p_token_date;
  
  RETURN v_next_token;
END;
$$;