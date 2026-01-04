-- Add license management columns to labs table
ALTER TABLE public.labs ADD COLUMN IF NOT EXISTS license_number TEXT;
ALTER TABLE public.labs ADD COLUMN IF NOT EXISTS license_type TEXT;
ALTER TABLE public.labs ADD COLUMN IF NOT EXISTS license_issue_date DATE;
ALTER TABLE public.labs ADD COLUMN IF NOT EXISTS license_expiry_date DATE;
ALTER TABLE public.labs ADD COLUMN IF NOT EXISTS license_status TEXT DEFAULT 'active';
ALTER TABLE public.labs ADD COLUMN IF NOT EXISTS license_document_url TEXT;
ALTER TABLE public.labs ADD COLUMN IF NOT EXISTS license_notes TEXT;
ALTER TABLE public.labs ADD COLUMN IF NOT EXISTS license_reminder_days INTEGER DEFAULT 30;
ALTER TABLE public.labs ADD COLUMN IF NOT EXISTS last_license_alert_sent_at TIMESTAMP WITH TIME ZONE;

-- Create index for license expiry queries
CREATE INDEX IF NOT EXISTS idx_labs_license_expiry ON public.labs(license_expiry_date);
CREATE INDEX IF NOT EXISTS idx_labs_license_status ON public.labs(license_status);

-- Create lab_license_alerts table for tracking sent notifications
CREATE TABLE IF NOT EXISTS public.lab_license_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lab_id UUID NOT NULL REFERENCES public.labs(id) ON DELETE CASCADE,
  alert_type TEXT NOT NULL,
  sent_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  sent_to TEXT NOT NULL,
  channel TEXT NOT NULL,
  status TEXT DEFAULT 'sent',
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS on lab_license_alerts
ALTER TABLE public.lab_license_alerts ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for lab_license_alerts
CREATE POLICY "Super admins can view all license alerts"
ON public.lab_license_alerts
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.user_id = auth.uid()
    AND profiles.role = 'super_admin'
  )
);

CREATE POLICY "Lab admins can view their lab license alerts"
ON public.lab_license_alerts
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.user_id = auth.uid()
    AND profiles.role = 'lab_admin'
    AND profiles.lab_id = lab_license_alerts.lab_id
  )
);

CREATE POLICY "Super admins can insert license alerts"
ON public.lab_license_alerts
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.user_id = auth.uid()
    AND profiles.role = 'super_admin'
  )
);

-- Create index for efficient alert queries
CREATE INDEX IF NOT EXISTS idx_lab_license_alerts_lab_id ON public.lab_license_alerts(lab_id);
CREATE INDEX IF NOT EXISTS idx_lab_license_alerts_sent_at ON public.lab_license_alerts(sent_at DESC);