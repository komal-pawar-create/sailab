-- Create landing_sections table for section titles/subtitles
CREATE TABLE public.landing_sections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  section_key text UNIQUE NOT NULL,
  content text NOT NULL,
  is_active boolean DEFAULT true,
  updated_at timestamp with time zone DEFAULT now(),
  updated_by uuid REFERENCES auth.users(id)
);

-- Create landing_benefits table
CREATE TABLE public.landing_benefits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  benefit_text text NOT NULL,
  display_order integer DEFAULT 0,
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  created_by uuid REFERENCES auth.users(id)
);

-- Create landing_tour_steps table
CREATE TABLE public.landing_tour_steps (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  icon_name text NOT NULL,
  title text NOT NULL,
  description text,
  mockup_type text NOT NULL,
  display_order integer DEFAULT 0,
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  created_by uuid REFERENCES auth.users(id)
);

-- Create landing_cta table
CREATE TABLE public.landing_cta (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  section_key text UNIQUE NOT NULL,
  title text NOT NULL,
  subtitle text,
  button_text text,
  button_url text,
  footer_text text,
  is_active boolean DEFAULT true,
  updated_at timestamp with time zone DEFAULT now(),
  updated_by uuid REFERENCES auth.users(id)
);

-- Create landing_footer table
CREATE TABLE public.landing_footer (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_name text NOT NULL DEFAULT 'Lab Master',
  copyright_text text NOT NULL DEFAULT '© 2024 Lab Master. All rights reserved.',
  nav_links jsonb DEFAULT '[]'::jsonb,
  is_active boolean DEFAULT true,
  updated_at timestamp with time zone DEFAULT now(),
  updated_by uuid REFERENCES auth.users(id)
);

-- Enable RLS on all tables
ALTER TABLE public.landing_sections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.landing_benefits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.landing_tour_steps ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.landing_cta ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.landing_footer ENABLE ROW LEVEL SECURITY;

-- RLS policies for landing_sections
CREATE POLICY "Anyone can view active sections" ON public.landing_sections FOR SELECT USING (is_active = true);
CREATE POLICY "Super admins can manage sections" ON public.landing_sections FOR ALL USING (is_super_admin(auth.uid()));

-- RLS policies for landing_benefits
CREATE POLICY "Anyone can view active benefits" ON public.landing_benefits FOR SELECT USING (is_active = true);
CREATE POLICY "Super admins can manage benefits" ON public.landing_benefits FOR ALL USING (is_super_admin(auth.uid()));

-- RLS policies for landing_tour_steps
CREATE POLICY "Anyone can view active tour steps" ON public.landing_tour_steps FOR SELECT USING (is_active = true);
CREATE POLICY "Super admins can manage tour steps" ON public.landing_tour_steps FOR ALL USING (is_super_admin(auth.uid()));

-- RLS policies for landing_cta
CREATE POLICY "Anyone can view active cta" ON public.landing_cta FOR SELECT USING (is_active = true);
CREATE POLICY "Super admins can manage cta" ON public.landing_cta FOR ALL USING (is_super_admin(auth.uid()));

-- RLS policies for landing_footer
CREATE POLICY "Anyone can view active footer" ON public.landing_footer FOR SELECT USING (is_active = true);
CREATE POLICY "Super admins can manage footer" ON public.landing_footer FOR ALL USING (is_super_admin(auth.uid()));

-- Seed initial data for sections
INSERT INTO public.landing_sections (section_key, content) VALUES
('features_badge', 'Complete Solution'),
('features_title', 'Powerful Features for Modern Labs'),
('features_subtitle', 'Everything you need to run your diagnostic laboratory efficiently, from patient management to advanced analytics.'),
('benefits_title', 'Why Choose Lab Master?'),
('benefits_subtitle', 'Built specifically for diagnostic laboratories with features that matter most to your success.'),
('demo_badge', 'See It In Action'),
('demo_title', 'Interactive Demo Tour'),
('demo_subtitle', 'Explore our intuitive interface and powerful features'),
('testimonials_badge', 'Success Stories'),
('testimonials_title', 'Trusted by Labs Across India'),
('testimonials_subtitle', 'See what laboratory professionals say about their experience with Lab Master'),
('pricing_badge', 'Simple Pricing'),
('pricing_title', 'Choose Your Perfect Plan'),
('pricing_subtitle', 'Transparent pricing with no hidden fees. Scale as you grow.'),
('faq_badge', 'Got Questions?'),
('faq_title', 'Frequently Asked Questions'),
('faq_subtitle', 'Everything you need to know about Lab Master');

-- Seed initial benefits
INSERT INTO public.landing_benefits (benefit_text, display_order) VALUES
('HIPAA-compliant security standards', 1),
('24/7 technical support', 2),
('Regular feature updates', 3),
('Data backup and recovery', 4),
('Multi-branch support', 5),
('Custom report templates', 6);

-- Seed initial tour steps
INSERT INTO public.landing_tour_steps (icon_name, title, description, mockup_type, display_order) VALUES
('Users', 'Patient Management', 'Complete patient records with history tracking and quick search capabilities.', 'patient', 1),
('FileText', 'Test Reports', 'Generate professional test reports with customizable templates and digital signatures.', 'test', 2),
('Receipt', 'Billing System', 'Streamlined billing with multiple payment methods and outstanding tracking.', 'billing', 3),
('TrendingUp', 'Analytics Dashboard', 'Real-time insights into lab performance, revenue, and patient trends.', 'analytics', 4);

-- Seed initial CTA content
INSERT INTO public.landing_cta (section_key, title, subtitle, button_text, button_url, footer_text) VALUES
('final_cta', 'Ready to Transform Your Lab?', 'Join hundreds of diagnostic laboratories already using Lab Master to streamline their operations.', 'Start Free Trial', '/auth', 'No credit card required • 14-day free trial • Cancel anytime');

-- Seed initial footer content
INSERT INTO public.landing_footer (brand_name, copyright_text, nav_links) VALUES
('Lab Master', '© 2024 Lab Master. All rights reserved.', '[{"label": "Privacy Policy", "href": "#"}, {"label": "Terms of Service", "href": "#"}, {"label": "Contact", "href": "#"}]');