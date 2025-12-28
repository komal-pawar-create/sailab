-- 1. Hero Section Content
CREATE TABLE public.landing_hero (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  badge_text TEXT DEFAULT 'Complete Laboratory Management Solution',
  main_headline TEXT DEFAULT 'Streamline Your Lab Operations',
  sub_headline TEXT DEFAULT 'Transform your diagnostic laboratory with our comprehensive, modern management system designed for efficiency and growth.',
  cta_primary_text TEXT DEFAULT 'Get Started Free',
  cta_secondary_text TEXT DEFAULT 'Explore Features',
  is_active BOOLEAN DEFAULT true,
  updated_at TIMESTAMPTZ DEFAULT now(),
  updated_by UUID
);

-- 2. Stats/Counter Items
CREATE TABLE public.landing_stats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  value INTEGER NOT NULL,
  suffix TEXT,
  label TEXT NOT NULL,
  display_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  created_by UUID
);

-- 3. Features
CREATE TABLE public.landing_features (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  icon_name TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  display_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  created_by UUID
);

-- 4. How It Works Steps
CREATE TABLE public.landing_steps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  step_number INTEGER NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  created_by UUID
);

-- 5. Pricing Plans
CREATE TABLE public.landing_pricing (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  price INTEGER NOT NULL,
  amc_price INTEGER NOT NULL,
  discount INTEGER,
  min_labs INTEGER,
  features JSONB DEFAULT '[]',
  is_popular BOOLEAN DEFAULT false,
  is_enterprise BOOLEAN DEFAULT false,
  display_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  created_by UUID
);

-- 6. FAQs
CREATE TABLE public.landing_faqs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category TEXT NOT NULL,
  question TEXT NOT NULL,
  answer TEXT NOT NULL,
  display_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  created_by UUID
);

-- 7. Testimonials
CREATE TABLE public.landing_testimonials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  role TEXT,
  location TEXT,
  rating INTEGER DEFAULT 5,
  testimonial_text TEXT NOT NULL,
  avatar_initials TEXT,
  avatar_url TEXT,
  display_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  created_by UUID
);

-- Enable RLS on all tables
ALTER TABLE public.landing_hero ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.landing_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.landing_features ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.landing_steps ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.landing_pricing ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.landing_faqs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.landing_testimonials ENABLE ROW LEVEL SECURITY;

-- Public read policies for active content
CREATE POLICY "Anyone can view active hero" ON public.landing_hero FOR SELECT USING (is_active = true);
CREATE POLICY "Anyone can view active stats" ON public.landing_stats FOR SELECT USING (is_active = true);
CREATE POLICY "Anyone can view active features" ON public.landing_features FOR SELECT USING (is_active = true);
CREATE POLICY "Anyone can view active steps" ON public.landing_steps FOR SELECT USING (is_active = true);
CREATE POLICY "Anyone can view active pricing" ON public.landing_pricing FOR SELECT USING (is_active = true);
CREATE POLICY "Anyone can view active faqs" ON public.landing_faqs FOR SELECT USING (is_active = true);
CREATE POLICY "Anyone can view active testimonials" ON public.landing_testimonials FOR SELECT USING (is_active = true);

-- Super admin management policies
CREATE POLICY "Super admins can manage hero" ON public.landing_hero FOR ALL USING (is_super_admin(auth.uid()));
CREATE POLICY "Super admins can manage stats" ON public.landing_stats FOR ALL USING (is_super_admin(auth.uid()));
CREATE POLICY "Super admins can manage features" ON public.landing_features FOR ALL USING (is_super_admin(auth.uid()));
CREATE POLICY "Super admins can manage steps" ON public.landing_steps FOR ALL USING (is_super_admin(auth.uid()));
CREATE POLICY "Super admins can manage pricing" ON public.landing_pricing FOR ALL USING (is_super_admin(auth.uid()));
CREATE POLICY "Super admins can manage faqs" ON public.landing_faqs FOR ALL USING (is_super_admin(auth.uid()));
CREATE POLICY "Super admins can manage testimonials" ON public.landing_testimonials FOR ALL USING (is_super_admin(auth.uid()));

-- Seed default hero content
INSERT INTO public.landing_hero (badge_text, main_headline, sub_headline, cta_primary_text, cta_secondary_text)
VALUES (
  'Complete Laboratory Management Solution',
  'Streamline Your Lab Operations',
  'Transform your diagnostic laboratory with our comprehensive, modern management system designed for efficiency and growth.',
  'Get Started Free',
  'Explore Features'
);

-- Seed default stats
INSERT INTO public.landing_stats (value, suffix, label, display_order) VALUES
(500, '+', 'Labs Managed', 0),
(50000, '+', 'Reports Generated', 1),
(99.9, '%', 'Uptime', 2),
(24, '/7', 'Support', 3);

-- Seed default features
INSERT INTO public.landing_features (icon_name, title, description, display_order) VALUES
('Users', 'Patient Management', 'Efficiently manage patient records, history, and appointments with our intuitive interface.', 0),
('TestTube', 'Test Reports', 'Generate, manage, and share test reports seamlessly with automated workflows.', 1),
('CreditCard', 'Billing & Invoicing', 'Streamlined billing with multiple payment options, GST compliance, and automated invoicing.', 2),
('BarChart3', 'Analytics Dashboard', 'Real-time insights into lab performance, revenue, and patient trends.', 3),
('Shield', 'Data Security', 'Enterprise-grade security with encrypted data storage and role-based access control.', 4),
('Smartphone', 'Mobile Ready', 'Access your lab data anywhere with our responsive, mobile-friendly design.', 5);

-- Seed default steps
INSERT INTO public.landing_steps (step_number, title, description) VALUES
(1, 'Sign Up', 'Create your account in minutes with our simple registration process.'),
(2, 'Configure Your Lab', 'Set up your lab profile, add staff members, and customize settings.'),
(3, 'Start Managing', 'Begin managing patients, generating reports, and tracking your lab''s performance.');

-- Seed default pricing
INSERT INTO public.landing_pricing (name, price, amc_price, discount, min_labs, features, is_popular, is_enterprise, display_order) VALUES
('Starter', 15000, 3000, NULL, NULL, '["Single branch", "Up to 500 patients/month", "Basic reports", "Email support", "1 user account"]', false, false, 0),
('Professional', 25000, 5000, 20, NULL, '["Up to 3 branches", "Unlimited patients", "Advanced analytics", "Priority support", "5 user accounts", "Custom branding"]', true, false, 1),
('Enterprise', 0, 0, NULL, 5, '["Unlimited branches", "Unlimited everything", "Dedicated support", "Custom integrations", "On-premise option", "SLA guarantee"]', false, true, 2);

-- Seed default FAQs
INSERT INTO public.landing_faqs (category, question, answer, display_order) VALUES
('pricing', 'What payment methods do you accept?', 'We accept all major credit cards, UPI, net banking, and bank transfers. For enterprise plans, we also offer invoice-based billing.', 0),
('pricing', 'Is there a free trial available?', 'Yes! We offer a 14-day free trial with full access to all features. No credit card required.', 1),
('pricing', 'Can I upgrade or downgrade my plan?', 'Absolutely. You can change your plan at any time. Upgrades are immediate, and downgrades take effect at the next billing cycle.', 2),
('features', 'Is my data secure?', 'Yes, we use bank-grade encryption (AES-256) for all data. Our servers are hosted in secure data centers with 24/7 monitoring.', 3),
('features', 'Can I integrate with other software?', 'Yes, we offer APIs and integrations with popular accounting software, LIMS systems, and more.', 4),
('features', 'Do you support multiple branches?', 'Yes, our Professional and Enterprise plans support multiple branches with centralized management.', 5),
('support', 'What kind of support do you offer?', 'We offer email support for all plans, priority support for Professional, and dedicated account managers for Enterprise customers.', 6),
('support', 'Is training provided?', 'Yes, we provide free onboarding training for all new customers, plus extensive documentation and video tutorials.', 7);

-- Seed default testimonials
INSERT INTO public.landing_testimonials (name, role, location, rating, testimonial_text, avatar_initials, display_order) VALUES
('Dr. Rajesh Kumar', 'Lab Director', 'Delhi', 5, 'LabTasker has transformed how we manage our diagnostic center. The efficiency gains have been remarkable.', 'RK', 0),
('Priya Sharma', 'Lab Manager', 'Mumbai', 5, 'The billing and reporting features are exactly what we needed. Customer support is excellent!', 'PS', 1),
('Dr. Amit Patel', 'Pathologist', 'Bangalore', 5, 'Finally, a lab management system that understands Indian labs. The GST compliance features are a lifesaver.', 'AP', 2);