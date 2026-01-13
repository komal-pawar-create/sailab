-- Lead Activities Table for tracking lead interactions
CREATE TABLE public.lead_activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
  activity_type TEXT NOT NULL, -- 'note', 'call', 'email', 'meeting', 'status_change', 'demo'
  description TEXT,
  old_status TEXT,
  new_status TEXT,
  created_by UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS on lead_activities
ALTER TABLE public.lead_activities ENABLE ROW LEVEL SECURITY;

-- RLS policies for lead_activities (super_admin only)
CREATE POLICY "Super admins can view all lead activities"
ON public.lead_activities
FOR SELECT
USING (is_super_admin(auth.uid()));

CREATE POLICY "Super admins can insert lead activities"
ON public.lead_activities
FOR INSERT
WITH CHECK (is_super_admin(auth.uid()));

-- Add discount columns to bills
ALTER TABLE public.bills ADD COLUMN IF NOT EXISTS discount_amount NUMERIC DEFAULT 0;
ALTER TABLE public.bills ADD COLUMN IF NOT EXISTS discount_type TEXT DEFAULT 'fixed';

-- Add refund columns to bill_payments
ALTER TABLE public.bill_payments ADD COLUMN IF NOT EXISTS is_refund BOOLEAN DEFAULT false;
ALTER TABLE public.bill_payments ADD COLUMN IF NOT EXISTS refund_reason TEXT;

-- Add index for efficient lead activity queries
CREATE INDEX idx_lead_activities_lead_id ON public.lead_activities(lead_id);
CREATE INDEX idx_lead_activities_created_at ON public.lead_activities(created_at DESC);

-- Add priority column to leads for lead scoring
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS priority TEXT DEFAULT 'medium';

-- Add last_activity_at column for tracking lead freshness
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS last_activity_at TIMESTAMPTZ DEFAULT now();