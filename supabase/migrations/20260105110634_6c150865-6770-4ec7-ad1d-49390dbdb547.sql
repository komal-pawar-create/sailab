-- Create leads table for sales pipeline
CREATE TABLE public.leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lab_name TEXT NOT NULL,
  contact_name TEXT NOT NULL,
  contact_email TEXT,
  contact_phone TEXT,
  location TEXT,
  source TEXT DEFAULT 'website', -- 'website', 'referral', 'cold_call', 'demo_request'
  status TEXT DEFAULT 'new', -- 'new', 'contacted', 'demo_scheduled', 'negotiating', 'won', 'lost'
  notes TEXT,
  expected_value DECIMAL(10,2),
  demo_date TIMESTAMP WITH TIME ZONE,
  follow_up_date DATE,
  assigned_to UUID,
  converted_to_lab_id UUID REFERENCES public.labs(id) ON DELETE SET NULL,
  created_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create subscriptions table for billing management
CREATE TABLE public.subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lab_id UUID REFERENCES public.labs(id) ON DELETE CASCADE NOT NULL,
  plan_name TEXT NOT NULL, -- 'Basic', 'Professional', 'Enterprise'
  billing_cycle TEXT DEFAULT 'monthly', -- 'monthly', 'yearly'
  amount DECIMAL(10,2) NOT NULL,
  currency TEXT DEFAULT 'INR',
  start_date DATE NOT NULL,
  end_date DATE,
  status TEXT DEFAULT 'active', -- 'active', 'expired', 'cancelled', 'trial'
  auto_renew BOOLEAN DEFAULT true,
  payment_method TEXT,
  notes TEXT,
  created_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX idx_leads_status ON public.leads(status);
CREATE INDEX idx_leads_created_at ON public.leads(created_at DESC);
CREATE INDEX idx_leads_follow_up_date ON public.leads(follow_up_date);
CREATE INDEX idx_subscriptions_lab_id ON public.subscriptions(lab_id);
CREATE INDEX idx_subscriptions_status ON public.subscriptions(status);
CREATE INDEX idx_subscriptions_end_date ON public.subscriptions(end_date);

-- Enable RLS
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

-- RLS policies for leads (super_admin only)
CREATE POLICY "Super admins can view all leads"
  ON public.leads FOR SELECT
  USING (public.is_super_admin(auth.uid()));

CREATE POLICY "Super admins can insert leads"
  ON public.leads FOR INSERT
  WITH CHECK (public.is_super_admin(auth.uid()));

CREATE POLICY "Super admins can update leads"
  ON public.leads FOR UPDATE
  USING (public.is_super_admin(auth.uid()));

CREATE POLICY "Super admins can delete leads"
  ON public.leads FOR DELETE
  USING (public.is_super_admin(auth.uid()));

-- RLS policies for subscriptions (super_admin only)
CREATE POLICY "Super admins can view all subscriptions"
  ON public.subscriptions FOR SELECT
  USING (public.is_super_admin(auth.uid()));

CREATE POLICY "Super admins can insert subscriptions"
  ON public.subscriptions FOR INSERT
  WITH CHECK (public.is_super_admin(auth.uid()));

CREATE POLICY "Super admins can update subscriptions"
  ON public.subscriptions FOR UPDATE
  USING (public.is_super_admin(auth.uid()));

CREATE POLICY "Super admins can delete subscriptions"
  ON public.subscriptions FOR DELETE
  USING (public.is_super_admin(auth.uid()));

-- Update trigger for leads
CREATE TRIGGER update_leads_updated_at
  BEFORE UPDATE ON public.leads
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Update trigger for subscriptions  
CREATE TRIGGER update_subscriptions_updated_at
  BEFORE UPDATE ON public.subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();