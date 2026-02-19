import React, { useEffect, useState, useMemo, Suspense } from 'react';
import { supabase } from '@/integrations/supabase/client';
import NavHeader from '@/components/landing/NavHeader';
import { FloatingShape } from '@/components/landing/shared';
import FloatingContactButton from '@/components/FloatingContactButton';
import InquiryDialog from '@/components/InquiryDialog';
import LiveActivityFeed from '@/components/landing/LiveActivityFeed';
import ExitIntentPopup from '@/components/landing/ExitIntentPopup';
import ScrollOfferBanner from '@/components/landing/ScrollOfferBanner';
import TimedSoftCTA from '@/components/landing/TimedSoftCTA';
import SocialProofBar from '@/components/landing/SocialProofBar';
import type {
  HeroContent,
  StatItem,
  FeatureItem,
  StepItem,
  PricingItem,
  FaqItem,
  TestimonialItem,
  SectionContent,
  BenefitItem,
  CtaContent,
  FooterContent,
  PricingPlan,
} from '@/components/landing/types';

// Lazy load all sections for better initial load performance
const HeroSection = React.lazy(() => import('@/components/landing/HeroSection'));
const TrustBadges = React.lazy(() => import('@/components/landing/TrustBadges'));
const DemoSection = React.lazy(() => import('@/components/landing/DemoSection'));
const FeaturesSection = React.lazy(() => import('@/components/landing/FeaturesSection'));
const HowItWorksSection = React.lazy(() => import('@/components/landing/HowItWorksSection'));
const BenefitsSection = React.lazy(() => import('@/components/landing/BenefitsSection'));
const TestimonialsSection = React.lazy(() => import('@/components/landing/TestimonialsSection'));
const PricingSection = React.lazy(() => import('@/components/landing/PricingSection'));
const FAQSection = React.lazy(() => import('@/components/landing/FAQSection'));
const CTASection = React.lazy(() => import('@/components/landing/CTASection'));
const FooterSection = React.lazy(() => import('@/components/landing/FooterSection'));
const BackToTop = React.lazy(() => import('@/components/landing/BackToTop'));

// Section loading skeleton
const SectionSkeleton = () => (
  <div className="py-24 px-4" aria-hidden="true">
    <div className="max-w-6xl mx-auto">
      <div className="animate-pulse space-y-8">
        <div className="h-8 w-48 bg-muted rounded mx-auto" />
        <div className="h-12 w-96 bg-muted rounded mx-auto" />
        <div className="h-6 w-72 bg-muted rounded mx-auto" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-48 bg-muted rounded-xl" />
          ))}
        </div>
      </div>
    </div>
  </div>
);

const Index = () => {
  const [scrollY, setScrollY] = useState(0);
  const [inquiryDialogOpen, setInquiryDialogOpen] = useState(false);
  
  // State for dynamic content
  const [heroContent, setHeroContent] = useState<HeroContent | null>(null);
  const [stats, setStats] = useState<StatItem[]>([
    { id: '1', value: 500, suffix: '+', label: 'Labs Onboarded' },
    { id: '2', value: 50000, suffix: '+', label: 'Patients Managed' },
    { id: '3', value: 99, suffix: '%', label: 'Uptime' },
    { id: '4', value: 24, suffix: '/7', label: 'Support' }
  ]);
  const [features, setFeatures] = useState<FeatureItem[]>([
    { id: '1', icon_name: 'Users', title: 'Patient Management', description: 'Complete patient profiles with history tracking, auto-generated IDs, and quick search.' },
    { id: '2', icon_name: 'TestTube', title: 'Test & Reports', description: 'Manage test types, generate professional reports, and track sample status.' },
    { id: '3', icon_name: 'CreditCard', title: 'Billing & Payments', description: 'Automated invoicing, GST support, partial payments, and detailed ledger.' },
    { id: '4', icon_name: 'BarChart3', title: 'Analytics', description: 'Real-time dashboards, revenue insights, and AI-powered predictions.' },
    { id: '5', icon_name: 'Shield', title: 'Role-Based Access', description: 'Secure multi-role system with customizable permissions.' },
    { id: '6', icon_name: 'Building2', title: 'Multi-Branch', description: 'Centralized management for labs with multiple branches.' },
    { id: '7', icon_name: 'FileText', title: 'Document Storage', description: 'Upload and manage patient documents with letterhead support.' },
    { id: '8', icon_name: 'Clock', title: 'Follow-ups', description: 'Never miss a patient follow-up with smart reminders.' }
  ]);
  const [steps, setSteps] = useState<StepItem[]>([
    { id: '1', step_number: 1, title: 'Sign Up', description: 'Create your account and set up your lab profile in minutes.' },
    { id: '2', step_number: 2, title: 'Configure', description: 'Add test types, set up billing, and customize your settings.' },
    { id: '3', step_number: 3, title: 'Add Users', description: 'Invite staff with role-based access controls.' },
    { id: '4', step_number: 4, title: 'Go Live', description: 'Start managing patients, tests, and billing seamlessly.' }
  ]);
  const [pricingPlans, setPricingPlans] = useState<PricingItem[]>([
    { id: '1', name: 'Starter', price: 199, amc_price: 0, discount: null, min_labs: null, features: ['Single branch', 'Up to 500 patients/month', 'Basic reports', 'Email support', '1 user account'], is_popular: false, is_enterprise: false },
    { id: '2', name: 'Professional', price: 299, amc_price: 0, discount: null, min_labs: null, features: ['Up to 3 branches', 'Unlimited patients', 'Advanced analytics', 'Priority support', '5 user accounts', 'Custom branding'], is_popular: true, is_enterprise: false },
    { id: '3', name: 'Enterprise', price: 0, amc_price: 0, discount: null, min_labs: 5, features: ['Unlimited branches', 'Unlimited everything', 'Dedicated support', 'Custom integrations', 'On-premise option', 'SLA guarantee'], is_popular: false, is_enterprise: true }
  ]);
  const [faqs, setFaqs] = useState<FaqItem[]>([
    { id: '1', category: 'pricing', question: 'What is included in the AMC?', answer: 'AMC includes updates, bug fixes, security patches, and technical support.' },
    { id: '2', category: 'features', question: 'Can I use LabFlow offline?', answer: 'Yes! LabFlow is a PWA and works offline. Data syncs when you reconnect.' },
    { id: '3', category: 'setup', question: 'How long does setup take?', answer: 'Most labs are up and running within 2-3 hours including configuration.' }
  ]);
  const [testimonials, setTestimonials] = useState<TestimonialItem[]>([
    { id: '1', name: 'Dr. Rajesh Kumar', role: 'Lab Director', location: 'Mumbai', rating: 5, testimonial_text: 'LabFlow transformed our operations. Highly recommended!', avatar_initials: 'RK', avatar_url: null },
    { id: '2', name: 'Priya Sharma', role: 'Lab Manager', location: 'Delhi', rating: 5, testimonial_text: 'Easy to use and excellent support. Best LIMS we have used.', avatar_initials: 'PS', avatar_url: null },
    { id: '3', name: 'Amit Patel', role: 'Pathologist', location: 'Ahmedabad', rating: 5, testimonial_text: 'The billing and reporting features save us hours every day.', avatar_initials: 'AP', avatar_url: null }
  ]);
  const [sectionContent, setSectionContent] = useState<SectionContent>({});
  const [benefits, setBenefits] = useState<BenefitItem[]>([]);
  const [ctaContent, setCtaContent] = useState<{ final_cta?: CtaContent }>({});
  const [footerContent, setFooterContent] = useState<FooterContent | null>(null);

  // Scroll handler
  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Fetch all landing page content
  useEffect(() => {
    const fetchLandingContent = async () => {
      // Fetch all content in parallel
      const [
        heroResult, statsResult, featuresResult, stepsResult, pricingResult,
        faqsResult, testimonialsResult, sectionsResult, benefitsResult, ctaResult, footerResult
      ] = await Promise.all([
        supabase.from('landing_hero').select('*').eq('is_active', true).single(),
        supabase.from('landing_stats').select('*').eq('is_active', true).order('display_order'),
        supabase.from('landing_features').select('*').eq('is_active', true).order('display_order'),
        supabase.from('landing_steps').select('*').eq('is_active', true).order('step_number'),
        supabase.from('landing_pricing').select('*').eq('is_active', true).order('display_order'),
        supabase.from('landing_faqs').select('*').eq('is_active', true).order('display_order'),
        supabase.from('landing_testimonials').select('*').eq('is_active', true).order('display_order'),
        supabase.from('landing_sections').select('*').eq('is_active', true),
        supabase.from('landing_benefits').select('*').eq('is_active', true).order('display_order'),
        supabase.from('landing_cta').select('*').eq('is_active', true),
        supabase.from('landing_footer').select('*').eq('is_active', true).single(),
      ]);

      if (heroResult.data) setHeroContent(heroResult.data);
      if (statsResult.data?.length) setStats(statsResult.data);
      if (featuresResult.data?.length) setFeatures(featuresResult.data);
      if (stepsResult.data?.length) setSteps(stepsResult.data);
      if (pricingResult.data?.length) {
        setPricingPlans(pricingResult.data.map(p => ({
          ...p,
          features: Array.isArray(p.features) ? p.features as string[] : []
        })));
      }
      if (faqsResult.data?.length) setFaqs(faqsResult.data);
      if (testimonialsResult.data?.length) setTestimonials(testimonialsResult.data);
      if (sectionsResult.data?.length) {
        const content: SectionContent = {};
        sectionsResult.data.forEach(s => { content[s.section_key] = s.content; });
        setSectionContent(content);
      }
      if (benefitsResult.data?.length) setBenefits(benefitsResult.data);
      if (ctaResult.data?.length) {
        const cta: { final_cta?: CtaContent } = {};
        ctaResult.data.forEach(c => {
          if (c.section_key === 'final_cta') cta.final_cta = c;
        });
        setCtaContent(cta);
      }
      if (footerResult.data) {
        setFooterContent({
          brand_name: footerResult.data.brand_name,
          copyright_text: footerResult.data.copyright_text,
          nav_links: Array.isArray(footerResult.data.nav_links) 
            ? (footerResult.data.nav_links as Array<{ label: string; href: string }>)
            : []
        });
      }
    };

    fetchLandingContent();
  }, []);

  // Memoized pricing plans for the PricingCard component format
  const formattedPricingPlans: PricingPlan[] = useMemo(() => {
    return pricingPlans.map(p => ({
      name: p.name,
      price: p.price,
      amcPrice: p.amc_price,
      discount: p.discount || undefined,
      minLabs: p.min_labs || undefined,
      features: p.features,
      isPopular: p.is_popular,
      isEnterprise: p.is_enterprise,
    }));
  }, [pricingPlans]);

  return (
    <div className="min-h-screen bg-background overflow-hidden scroll-smooth">
      {/* Skip to main content link for accessibility */}
      <a 
        href="#main-content" 
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-[100] focus:px-4 focus:py-2 focus:bg-primary focus:text-primary-foreground focus:rounded-md focus:outline-none"
      >
        Skip to main content
      </a>

      {/* Fixed Navigation Header */}
      <NavHeader scrollY={scrollY} />
      
      {/* Social Proof Bar (appears on scroll) */}
      <SocialProofBar />
      
      {/* Live Activity Feed (bottom left) */}
      <LiveActivityFeed />
      
      {/* Floating background shapes */}
      <div aria-hidden="true">
        <FloatingShape className="w-[600px] h-[600px] bg-primary/20 -top-48 -left-48" />
        <FloatingShape className="w-[500px] h-[500px] bg-accent/20 top-96 -right-48 delay-200" />
        <FloatingShape className="w-[400px] h-[400px] bg-primary/15 bottom-48 left-1/4 delay-400" />
      </div>

      {/* Main content */}
      <main id="main-content" role="main">
        {/* Hero Section */}
        <Suspense fallback={<SectionSkeleton />}>
          <HeroSection heroContent={heroContent} stats={stats} scrollY={scrollY} />
        </Suspense>

        {/* Trust Badges */}
        <Suspense fallback={<div className="h-32" />}>
          <TrustBadges />
        </Suspense>

        {/* Demo Section */}
        <Suspense fallback={<SectionSkeleton />}>
          <DemoSection />
        </Suspense>

        {/* Features Section */}
        <Suspense fallback={<SectionSkeleton />}>
          <FeaturesSection features={features} />
        </Suspense>

        {/* How It Works Section */}
        <Suspense fallback={<SectionSkeleton />}>
          <HowItWorksSection steps={steps} />
        </Suspense>

        {/* Benefits Section */}
        <Suspense fallback={<SectionSkeleton />}>
          <BenefitsSection benefits={benefits} sectionContent={sectionContent} />
        </Suspense>

        {/* Testimonials Section */}
        <Suspense fallback={<SectionSkeleton />}>
          <TestimonialsSection testimonials={testimonials} />
        </Suspense>

        {/* Pricing Section */}
        <Suspense fallback={<SectionSkeleton />}>
          <PricingSection pricingPlans={formattedPricingPlans} />
        </Suspense>

        {/* FAQ Section */}
        <Suspense fallback={<SectionSkeleton />}>
          <FAQSection faqs={faqs} />
        </Suspense>

        {/* CTA Section */}
        <Suspense fallback={<SectionSkeleton />}>
          <CTASection ctaContent={ctaContent} />
        </Suspense>
      </main>

      {/* Footer */}
      <Suspense fallback={<div className="h-24" />}>
        <FooterSection footerContent={footerContent} />
      </Suspense>

      {/* Back to Top Button */}
      <Suspense fallback={null}>
        <BackToTop />
      </Suspense>

      {/* Floating Contact Button */}
      <FloatingContactButton onClick={() => setInquiryDialogOpen(true)} />

      {/* Inquiry Dialog */}
      <InquiryDialog
        open={inquiryDialogOpen}
        onOpenChange={setInquiryDialogOpen}
        source="fab_button"
      />

      {/* Smart Lead Magnets */}
      <ExitIntentPopup />
      <ScrollOfferBanner />
      <TimedSoftCTA />
    </div>
  );
};

export default Index;
