import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from '@/components/ui/carousel';
import { AnimatedSection, AnimatedItems } from '@/components/AnimatedSection';
import { supabase } from '@/integrations/supabase/client';
import {
  TestTube, 
  Users, 
  FileText, 
  BarChart3, 
  Shield, 
  Clock, 
  Building2, 
  CreditCard,
  ChevronDown,
  CheckCircle2,
  ArrowRight,
  Sparkles,
  Zap,
  Globe,
  HeartHandshake,
  Menu,
  X,
  Sun,
  Moon,
  Check,
  Star,
  BadgePercent,
  HelpCircle,
  MessageCircle,
  Quote,
  Play,
  Monitor,
  Smartphone,
  MousePointerClick
} from 'lucide-react';
import React, { useEffect, useState, useRef, useMemo } from 'react';
import { useTheme } from 'next-themes';
import * as LucideIcons from 'lucide-react';

// Types for dynamic content
interface HeroContent {
  badge_text: string;
  main_headline: string;
  sub_headline: string;
  cta_primary_text: string;
  cta_secondary_text: string;
}

interface StatItem {
  id: string;
  value: number;
  suffix: string | null;
  label: string;
}

interface FeatureItem {
  id: string;
  icon_name: string;
  title: string;
  description: string | null;
}

interface StepItem {
  id: string;
  step_number: number;
  title: string;
  description: string | null;
}

interface PricingItem {
  id: string;
  name: string;
  price: number;
  amc_price: number;
  discount: number | null;
  min_labs: number | null;
  features: string[];
  is_popular: boolean;
  is_enterprise: boolean;
}

interface FaqItem {
  id: string;
  category: string;
  question: string;
  answer: string;
}

interface TestimonialItem {
  id: string;
  name: string;
  role: string | null;
  location: string | null;
  rating: number;
  testimonial_text: string;
  avatar_initials: string | null;
  avatar_url: string | null;
}

interface SectionContent {
  [key: string]: string;
}

interface BenefitItem {
  id: string;
  benefit_text: string;
}

interface TourStepItem {
  id: string;
  icon_name: string;
  title: string;
  description: string | null;
  mockup_type: string;
}

interface CtaContent {
  title: string;
  subtitle: string | null;
  button_text: string | null;
  button_url: string | null;
  footer_text: string | null;
}

interface FooterContent {
  brand_name: string;
  copyright_text: string;
  nav_links: Array<{ label: string; href: string }>;
}

// Dynamic icon component - map icon names to components
const getIconComponent = (name: string): React.ElementType => {
  const iconMap: Record<string, React.ElementType> = {
    Users,
    TestTube,
    CreditCard,
    BarChart3,
    Shield,
    Building2,
    FileText,
    Clock,
    HelpCircle,
    Star,
    Zap,
    Globe,
    HeartHandshake,
    CheckCircle2,
  };
  return iconMap[name] || HelpCircle;
};

const DynamicIcon = ({ name, className }: { name: string; className?: string }) => {
  const IconComponent = getIconComponent(name);
  return <IconComponent className={className} />;
};

// Fixed Navigation Header component
const NavHeader = ({ scrollY }: { scrollY: number }) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const isScrolled = scrollY > 50;

  // Prevent hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

  const navLinks = [
    { href: '#demo', label: 'Demo' },
    { href: '#features', label: 'Features' },
    { href: '#how-it-works', label: 'How It Works' },
    { href: '#testimonials', label: 'Testimonials' },
    { href: '#pricing', label: 'Pricing' },
    { href: '#faq', label: 'FAQ' },
  ];

  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  };

  const handleSmoothScroll = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    e.preventDefault();
    const target = document.querySelector(href);
    if (target) {
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
    setMobileMenuOpen(false);
  };

  return (
    <header 
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled 
          ? 'glass-strong shadow-lg py-3' 
          : 'bg-transparent py-5'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 flex items-center justify-between">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-3 group">
          <div className={`p-2 rounded-xl transition-all duration-300 ${
            isScrolled ? 'bg-primary/10' : 'bg-background/50 backdrop-blur-sm'
          }`}>
            <TestTube className="h-6 w-6 text-primary group-hover:rotate-12 transition-transform duration-300" />
          </div>
          <span className={`text-xl font-bold transition-colors duration-300 ${
            isScrolled ? 'text-foreground' : 'text-foreground'
          }`}>
            Lab Master
          </span>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-8">
          {navLinks.map((link) => (
            <a
              key={link.href}
              href={link.href}
              onClick={(e) => handleSmoothScroll(e, link.href)}
              className={`text-sm font-medium transition-colors duration-300 hover:text-primary relative group ${
                isScrolled ? 'text-foreground' : 'text-foreground'
              }`}
            >
              {link.label}
              <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-primary transition-all duration-300 group-hover:w-full" />
            </a>
          ))}
        </nav>

        {/* Desktop CTA */}
        <div className="hidden md:flex items-center gap-3">
          {/* Dark Mode Toggle */}
          <button
            onClick={toggleTheme}
            className={`p-2 rounded-lg transition-all duration-300 hover:bg-muted ${
              isScrolled ? 'bg-muted/50' : 'bg-background/50 backdrop-blur-sm'
            }`}
            aria-label="Toggle dark mode"
          >
            {mounted && (
              theme === 'dark' ? (
                <Sun className="h-5 w-5 text-foreground" />
              ) : (
                <Moon className="h-5 w-5 text-foreground" />
              )
            )}
          </button>
          <Button variant="ghost" asChild className="text-sm">
            <Link to="/auth">Login</Link>
          </Button>
          <Button asChild size="sm" className={`transition-all duration-300 ${
            isScrolled ? '' : 'shadow-lg'
          }`}>
            <Link to="/auth">Get Started</Link>
          </Button>
        </div>

        {/* Mobile Menu Button */}
        <div className="md:hidden flex items-center gap-2">
          {/* Dark Mode Toggle - Mobile */}
          <button
            onClick={toggleTheme}
            className="p-2 rounded-lg hover:bg-muted transition-colors"
            aria-label="Toggle dark mode"
          >
            {mounted && (
              theme === 'dark' ? (
                <Sun className="h-5 w-5 text-foreground" />
              ) : (
                <Moon className="h-5 w-5 text-foreground" />
              )
            )}
          </button>
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 rounded-lg hover:bg-muted transition-colors"
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? (
              <X className="h-6 w-6 text-foreground" />
            ) : (
              <Menu className="h-6 w-6 text-foreground" />
            )}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      <div className={`md:hidden absolute top-full left-0 right-0 glass-strong shadow-lg transition-all duration-300 overflow-hidden ${
        mobileMenuOpen ? 'max-h-80 opacity-100' : 'max-h-0 opacity-0'
      }`}>
        <nav className="flex flex-col p-4 gap-2">
          {navLinks.map((link) => (
            <a
              key={link.href}
              href={link.href}
              onClick={(e) => handleSmoothScroll(e, link.href)}
              className="text-foreground hover:text-primary py-3 px-4 rounded-lg hover:bg-muted/50 transition-colors"
            >
              {link.label}
            </a>
          ))}
          <div className="border-t border-border my-2" />
          <Link
            to="/auth"
            className="text-foreground hover:text-primary py-3 px-4 rounded-lg hover:bg-muted/50 transition-colors"
          >
            Login
          </Link>
          <Button asChild className="mt-2">
            <Link to="/auth">Get Started</Link>
          </Button>
        </nav>
      </div>
    </header>
  );
};

// Animated counter component
const AnimatedCounter = ({ end, duration = 2000, suffix = '' }: { end: number; duration?: number; suffix?: string }) => {
  const [count, setCount] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
        }
      },
      { threshold: 0.3 }
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!isVisible) return;

    let startTime: number;
    const animate = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);
      setCount(Math.floor(progress * end));
      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };
    requestAnimationFrame(animate);
  }, [isVisible, end, duration]);

  return <span ref={ref} className="animate-count-up">{count}{suffix}</span>;
};

// Feature card component - now supports dynamic icon names
const FeatureCard = ({ icon, iconName, title, description, delay }: { 
  icon?: React.ElementType; 
  iconName?: string;
  title: string; 
  description: string;
  delay: string;
}) => (
  <Card className={`group relative overflow-hidden p-6 glass hover-lift animate-slide-up opacity-0 ${delay}`} style={{ animationFillMode: 'forwards' }}>
    <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-accent/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
    <div className="relative">
      <div className="mb-4 inline-flex p-3 rounded-xl bg-primary/10 text-primary group-hover:scale-110 group-hover:bg-primary group-hover:text-primary-foreground transition-all duration-300">
        {icon ? <>{React.createElement(icon, { className: "h-6 w-6" })}</> : iconName ? <DynamicIcon name={iconName} className="h-6 w-6" /> : null}
      </div>
      <h3 className="text-lg font-semibold mb-2 text-foreground">{title}</h3>
      <p className="text-muted-foreground text-sm leading-relaxed">{description}</p>
    </div>
  </Card>
);

// Step component for "How It Works"
const Step = ({ number, title, description, isLast, delay }: { 
  number: number; 
  title: string; 
  description: string;
  isLast?: boolean;
  delay: string;
}) => (
  <div className={`relative flex gap-6 animate-slide-up opacity-0 ${delay}`} style={{ animationFillMode: 'forwards' }}>
    <div className="flex flex-col items-center">
      <div className="flex items-center justify-center w-12 h-12 rounded-full bg-primary text-primary-foreground font-bold text-lg animate-pulse-glow">
        {number}
      </div>
      {!isLast && (
        <div className="w-0.5 h-full bg-gradient-to-b from-primary to-primary/20 mt-4" />
      )}
    </div>
    <div className="pb-12">
      <h3 className="text-xl font-semibold mb-2 text-foreground">{title}</h3>
      <p className="text-muted-foreground">{description}</p>
    </div>
  </div>
);

// Pricing card component
interface PricingPlan {
  name: string;
  price: number;
  amcPrice: number;
  discount?: number;
  minLabs?: number;
  features: string[];
  isPopular?: boolean;
  isEnterprise?: boolean;
}

const PricingCard = ({ 
  plan, 
  delay 
}: { 
  plan: PricingPlan;
  delay: string;
}) => {
  const { name, price, amcPrice, discount, minLabs, features, isPopular, isEnterprise } = plan;
  
  return (
    <Card className={`group relative overflow-hidden p-6 animate-slide-up opacity-0 ${delay} ${
      isPopular 
        ? 'glass-strong border-2 border-primary shadow-xl scale-105 z-10' 
        : 'glass hover-lift'
    }`} style={{ animationFillMode: 'forwards' }}>
      {/* Popular Badge */}
      {isPopular && (
        <div className="absolute -top-0 left-1/2 -translate-x-1/2 -translate-y-1/2">
          <div className="flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-primary text-primary-foreground text-sm font-medium shadow-lg">
            <Star className="h-3.5 w-3.5 fill-current" />
            Most Popular
          </div>
        </div>
      )}
      
      {/* Discount Badge */}
      {discount && (
        <div className="absolute top-4 right-4">
          <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-xs font-medium">
            <BadgePercent className="h-3 w-3" />
            Save {discount}%
          </div>
        </div>
      )}

      <div className={`${isPopular ? 'pt-4' : ''}`}>
        {/* Plan Name */}
        <h3 className="text-xl font-bold text-foreground mb-2">{name}</h3>
        {minLabs && (
          <p className="text-sm text-muted-foreground mb-4">Minimum {minLabs} labs</p>
        )}
        {!minLabs && <div className="h-6 mb-4" />}
        
        {/* Price */}
        <div className="mb-2">
          <span className="text-4xl font-bold text-foreground">₹{price.toLocaleString('en-IN')}</span>
          <span className="text-muted-foreground">{minLabs ? '/lab' : ''}</span>
        </div>
        <p className="text-sm text-muted-foreground mb-1">One-time setup</p>
        
        {/* AMC Price */}
        <div className="flex items-baseline gap-2 mb-6 pb-6 border-b border-border">
          <span className="text-lg font-semibold text-foreground">+ ₹{amcPrice.toLocaleString('en-IN')}</span>
          <span className="text-sm text-muted-foreground">{minLabs ? '/lab/year' : '/year'} AMC</span>
        </div>
        
        {/* Features */}
        <ul className="space-y-3 mb-8">
          {features.map((feature, index) => (
            <li key={index} className="flex items-start gap-3">
              <Check className={`h-5 w-5 flex-shrink-0 mt-0.5 ${isPopular ? 'text-primary' : 'text-green-600 dark:text-green-400'}`} />
              <span className="text-sm text-foreground">{feature}</span>
            </li>
          ))}
        </ul>
        
        {/* CTA Button */}
        <Button 
          asChild 
          className={`w-full ${isPopular ? 'animate-pulse-glow' : ''}`}
          variant={isPopular ? 'default' : 'outline'}
          size="lg"
        >
          <Link to="/auth" className="flex items-center justify-center gap-2">
            {isEnterprise ? 'Contact Sales' : 'Get Started'}
            <ArrowRight className="h-4 w-4" />
          </Link>
        </Button>
      </div>
    </Card>
  );
};

// Floating shape component
const FloatingShape = ({ className }: { className?: string }) => (
  <div className={`absolute rounded-full animate-blob opacity-30 blur-3xl ${className}`} />
);

// Demo Section Component
const DemoSection = () => {
  const [activeTab, setActiveTab] = useState<'video' | 'tour'>('video');
  const [tourStep, setTourStep] = useState(0);
  const [demoVideos, setDemoVideos] = useState<Array<{
    id: string;
    title: string;
    description: string | null;
    video_url: string;
    video_type: string;
    thumbnail_url: string | null;
    duration: string | null;
  }>>([]);
  const [activeVideo, setActiveVideo] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);

  useEffect(() => {
    const fetchVideos = async () => {
      const { data } = await supabase
        .from('demo_videos')
        .select('id, title, description, video_url, video_type, thumbnail_url, duration')
        .eq('is_active', true)
        .order('display_order');
      
      if (data && data.length > 0) {
        setDemoVideos(data);
      }
    };
    fetchVideos();
  }, []);

  const extractYouTubeId = (url: string): string => {
    const match = url.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/);
    return match ? match[1] : url;
  };

  const extractVimeoId = (url: string): string => {
    const match = url.match(/(?:vimeo\.com\/)(\d+)/);
    return match ? match[1] : url;
  };

  const renderVideoEmbed = (video: typeof demoVideos[0]) => {
    switch (video.video_type) {
      case 'youtube':
        return (
          <iframe
            src={`https://www.youtube.com/embed/${extractYouTubeId(video.video_url)}?autoplay=${isPlaying ? 1 : 0}&rel=0`}
            title={video.title}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            className="absolute inset-0 w-full h-full"
          />
        );
      case 'vimeo':
        return (
          <iframe
            src={`https://player.vimeo.com/video/${extractVimeoId(video.video_url)}?autoplay=${isPlaying ? 1 : 0}`}
            title={video.title}
            allow="autoplay; fullscreen; picture-in-picture"
            allowFullScreen
            className="absolute inset-0 w-full h-full"
          />
        );
      case 'uploaded':
        return (
          <video
            src={video.video_url}
            controls
            poster={video.thumbnail_url || undefined}
            className="absolute inset-0 w-full h-full object-cover"
            autoPlay={isPlaying}
          />
        );
      default:
        return null;
    }
  };

  // Default tour steps (fallback)
  const defaultTourSteps = [
    {
      icon: Users,
      title: 'Patient Registration',
      description: 'Quick patient onboarding with auto-generated IDs, complete medical history, and instant record creation.',
      mockup: 'patient'
    },
    {
      icon: TestTube,
      title: 'Test Management',
      description: 'Create custom test types, track sample status, and generate professional reports in minutes.',
      mockup: 'test'
    },
    {
      icon: CreditCard,
      title: 'Smart Billing',
      description: 'Automated invoicing with GST support, partial payments, and comprehensive ledger tracking.',
      mockup: 'billing'
    },
    {
      icon: BarChart3,
      title: 'Analytics Dashboard',
      description: 'Real-time insights with revenue trends, patient statistics, and AI-powered predictions.',
      mockup: 'analytics'
    }
  ];

  const renderMockup = (type: string) => {
    const mockupClasses = "glass-strong rounded-xl p-4 space-y-3";
    
    switch (type) {
      case 'patient':
        return (
          <div className={mockupClasses}>
            <div className="flex items-center gap-3 p-3 rounded-lg bg-primary/10">
              <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                <Users className="h-5 w-5 text-primary" />
              </div>
              <div className="flex-1">
                <div className="h-3 w-24 bg-foreground/20 rounded" />
                <div className="h-2 w-16 bg-muted-foreground/20 rounded mt-1" />
              </div>
              <span className="px-2 py-1 rounded text-xs bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400">Active</span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="p-2 rounded bg-muted/50"><div className="h-2 w-12 bg-muted-foreground/30 rounded mb-1" /><div className="h-3 w-16 bg-foreground/20 rounded" /></div>
              <div className="p-2 rounded bg-muted/50"><div className="h-2 w-12 bg-muted-foreground/30 rounded mb-1" /><div className="h-3 w-20 bg-foreground/20 rounded" /></div>
            </div>
          </div>
        );
      case 'test':
        return (
          <div className={mockupClasses}>
            <div className="flex items-center justify-between p-3 rounded-lg bg-accent/10">
              <div className="flex items-center gap-2">
                <TestTube className="h-5 w-5 text-accent" />
                <div className="h-3 w-20 bg-foreground/20 rounded" />
              </div>
              <span className="px-2 py-1 rounded text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400">In Progress</span>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between items-center p-2 rounded bg-muted/50">
                <div className="h-2 w-16 bg-muted-foreground/30 rounded" />
                <div className="h-2 w-8 bg-primary/50 rounded" />
              </div>
              <div className="flex justify-between items-center p-2 rounded bg-muted/50">
                <div className="h-2 w-20 bg-muted-foreground/30 rounded" />
                <div className="h-2 w-10 bg-green-500/50 rounded" />
              </div>
            </div>
          </div>
        );
      case 'billing':
        return (
          <div className={mockupClasses}>
            <div className="flex items-center justify-between p-3 rounded-lg bg-primary/10">
              <div className="flex items-center gap-2">
                <CreditCard className="h-5 w-5 text-primary" />
                <div className="h-3 w-24 bg-foreground/20 rounded" />
              </div>
              <span className="font-semibold text-primary">₹2,450</span>
            </div>
            <div className="flex gap-2">
              <div className="flex-1 p-2 rounded bg-green-100/50 dark:bg-green-900/20 text-center">
                <div className="text-xs text-green-700 dark:text-green-400">Paid</div>
                <div className="font-semibold text-green-700 dark:text-green-400">₹1,500</div>
              </div>
              <div className="flex-1 p-2 rounded bg-orange-100/50 dark:bg-orange-900/20 text-center">
                <div className="text-xs text-orange-700 dark:text-orange-400">Due</div>
                <div className="font-semibold text-orange-700 dark:text-orange-400">₹950</div>
              </div>
            </div>
          </div>
        );
      case 'analytics':
        return (
          <div className={mockupClasses}>
            <div className="flex items-center gap-2 mb-2">
              <BarChart3 className="h-5 w-5 text-primary" />
              <div className="h-3 w-20 bg-foreground/20 rounded" />
            </div>
            <div className="flex items-end gap-1 h-16">
              {[40, 65, 45, 80, 55, 70, 90].map((height, i) => (
                <div key={i} className="flex-1 bg-gradient-to-t from-primary to-primary/50 rounded-t" style={{ height: `${height}%` }} />
              ))}
            </div>
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Mon</span><span>Tue</span><span>Wed</span><span>Thu</span><span>Fri</span><span>Sat</span><span>Sun</span>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  const currentVideo = demoVideos[activeVideo];

  return (
    <div className="space-y-8">
      {/* Tab Switcher */}
      <div className="flex justify-center">
        <div className="inline-flex p-1 rounded-xl glass">
          <button
            onClick={() => setActiveTab('video')}
            className={`flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-all duration-300 ${
              activeTab === 'video' 
                ? 'bg-primary text-primary-foreground shadow-lg' 
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <Play className="h-4 w-4" />
            Watch Demo
          </button>
          <button
            onClick={() => setActiveTab('tour')}
            className={`flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-all duration-300 ${
              activeTab === 'tour' 
                ? 'bg-primary text-primary-foreground shadow-lg' 
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <MousePointerClick className="h-4 w-4" />
            Interactive Tour
          </button>
        </div>
      </div>

      {/* Video Tab */}
      {activeTab === 'video' && (
        <div className="relative">
          <div className="aspect-video rounded-2xl overflow-hidden glass-strong border border-border/50 shadow-2xl relative">
            {/* Mock Browser Chrome */}
            <div className="absolute top-0 left-0 right-0 h-10 bg-muted/80 backdrop-blur flex items-center px-4 gap-2 z-10">
              <div className="flex gap-1.5">
                <div className="w-3 h-3 rounded-full bg-red-500/80" />
                <div className="w-3 h-3 rounded-full bg-yellow-500/80" />
                <div className="w-3 h-3 rounded-full bg-green-500/80" />
              </div>
              <div className="flex-1 mx-4 h-6 rounded bg-background/50 flex items-center px-3">
                <span className="text-xs text-muted-foreground">labmaster.app/dashboard</span>
              </div>
            </div>

            {/* Video Content */}
            <div className="absolute inset-0 pt-10">
              {demoVideos.length > 0 && currentVideo ? (
                isPlaying ? (
                  renderVideoEmbed(currentVideo)
                ) : (
                  <div 
                    className="absolute inset-0 bg-gradient-to-br from-primary/20 to-accent/20 flex flex-col items-center justify-center cursor-pointer"
                    onClick={() => setIsPlaying(true)}
                  >
                    {currentVideo.thumbnail_url && (
                      <img 
                        src={currentVideo.thumbnail_url} 
                        alt={currentVideo.title}
                        className="absolute inset-0 w-full h-full object-cover opacity-50"
                      />
                    )}
                    <div className="relative z-10 flex flex-col items-center">
                      <div className="w-20 h-20 rounded-full bg-primary/90 flex items-center justify-center hover:scale-110 transition-transform shadow-lg animate-pulse-glow">
                        <Play className="h-8 w-8 text-primary-foreground ml-1" />
                      </div>
                      <p className="mt-4 text-foreground/80 font-medium">{currentVideo.title}</p>
                      {currentVideo.duration && (
                        <p className="text-sm text-muted-foreground">{currentVideo.duration}</p>
                      )}
                    </div>
                  </div>
                )
              ) : (
                <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-accent/20 flex flex-col items-center justify-center">
                  <div className="w-20 h-20 rounded-full bg-primary/90 flex items-center justify-center shadow-lg animate-pulse-glow">
                    <Play className="h-8 w-8 text-primary-foreground ml-1" />
                  </div>
                  <p className="mt-4 text-foreground/80 font-medium">Demo video coming soon</p>
                  <p className="text-sm text-muted-foreground">Check back later</p>
                </div>
              )}
            </div>
          </div>
          
          {/* Video Selection (if multiple) */}
          {demoVideos.length > 1 && (
            <div className="flex justify-center gap-3 mt-6">
              {demoVideos.map((video, index) => (
                <button
                  key={video.id}
                  onClick={() => { setActiveVideo(index); setIsPlaying(false); }}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    activeVideo === index
                      ? 'bg-primary text-primary-foreground'
                      : 'glass hover:bg-muted/50 text-muted-foreground'
                  }`}
                >
                  {video.title}
                </button>
              ))}
            </div>
          )}
          
          {/* Device indicators */}
          <div className="flex justify-center gap-6 mt-6">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Monitor className="h-4 w-4" />
              <span>Desktop</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Smartphone className="h-4 w-4" />
              <span>Mobile Ready</span>
            </div>
          </div>
        </div>
      )}

      {/* Interactive Tour Tab */}
      {activeTab === 'tour' && (
        <div className="grid lg:grid-cols-2 gap-8 items-center">
          {/* Tour Steps */}
          <div className="space-y-4">
            {defaultTourSteps.map((step, index) => (
              <button
                key={index}
                onClick={() => setTourStep(index)}
                className={`w-full text-left p-4 rounded-xl transition-all duration-300 ${
                  tourStep === index 
                    ? 'glass-strong border-2 border-primary shadow-lg' 
                    : 'glass hover:bg-muted/50'
                }`}
              >
                <div className="flex items-start gap-4">
                  <div className={`p-3 rounded-xl transition-colors ${
                    tourStep === index 
                      ? 'bg-primary text-primary-foreground' 
                      : 'bg-primary/10 text-primary'
                  }`}>
                    <step.icon className="h-5 w-5" />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold text-foreground mb-1">{step.title}</h4>
                    <p className={`text-sm transition-all duration-300 ${
                      tourStep === index ? 'text-muted-foreground' : 'text-muted-foreground/70 line-clamp-1'
                    }`}>
                      {step.description}
                    </p>
                  </div>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors ${
                    tourStep === index 
                      ? 'bg-primary text-primary-foreground' 
                      : 'bg-muted text-muted-foreground'
                  }`}>
                    {index + 1}
                  </div>
                </div>
              </button>
            ))}
          </div>

          {/* Tour Preview */}
          <div className="relative">
            <div className="glass-strong rounded-2xl p-6 border border-border/50 shadow-xl">
              {/* Mock Header */}
              <div className="flex items-center justify-between mb-4 pb-4 border-b border-border">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-primary/10">
                    {(() => {
                      const StepIcon = defaultTourSteps[tourStep].icon;
                      return <StepIcon className="h-5 w-5 text-primary" />;
                    })()}
                  </div>
                  <span className="font-semibold text-foreground">{defaultTourSteps[tourStep].title}</span>
                </div>
                <span className="text-xs text-muted-foreground">Step {tourStep + 1} of {defaultTourSteps.length}</span>
              </div>
              
              {/* Dynamic Mockup */}
              <div className="min-h-[200px]">
                {renderMockup(defaultTourSteps[tourStep].mockup)}
              </div>

              {/* Navigation Dots */}
              <div className="flex justify-center gap-2 mt-6">
                {defaultTourSteps.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setTourStep(index)}
                    className={`w-2 h-2 rounded-full transition-all duration-300 ${
                      tourStep === index 
                        ? 'w-8 bg-primary' 
                        : 'bg-muted-foreground/30 hover:bg-muted-foreground/50'
                    }`}
                  />
                ))}
              </div>
            </div>
            
            {/* Decorative elements */}
            <div className="absolute -top-4 -right-4 w-24 h-24 bg-primary/10 rounded-full blur-2xl" />
            <div className="absolute -bottom-4 -left-4 w-32 h-32 bg-accent/10 rounded-full blur-2xl" />
          </div>
        </div>
      )}

      {/* CTA */}
      <div className="text-center pt-4">
        <Button asChild size="lg" className="animate-pulse-glow">
          <Link to="/auth" className="flex items-center gap-2">
            Start Free Trial
            <ArrowRight className="h-5 w-5" />
          </Link>
        </Button>
      </div>
    </div>
  );
};

const Index = () => {
  const [scrollY, setScrollY] = useState(0);
  const [heroContent, setHeroContent] = useState<HeroContent | null>(null);
  const [stats, setStats] = useState<StatItem[]>([]);
  const [features, setFeatures] = useState<FeatureItem[]>([]);
  const [steps, setSteps] = useState<StepItem[]>([]);
  const [pricingPlans, setPricingPlans] = useState<PricingItem[]>([]);
  const [faqs, setFaqs] = useState<FaqItem[]>([]);
  const [testimonials, setTestimonials] = useState<TestimonialItem[]>([]);
  const [sectionContent, setSectionContent] = useState<SectionContent>({});
  const [benefits, setBenefits] = useState<BenefitItem[]>([]);
  const [tourSteps, setTourSteps] = useState<TourStepItem[]>([]);
  const [ctaContent, setCtaContent] = useState<Record<string, CtaContent>>({});
  const [footerContent, setFooterContent] = useState<FooterContent | null>(null);

  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const fetchLandingContent = async () => {
      const [
        heroResult,
        statsResult,
        featuresResult,
        stepsResult,
        pricingResult,
        faqsResult,
        testimonialsResult,
        sectionsResult,
        benefitsResult,
        tourStepsResult,
        ctaResult,
        footerResult
      ] = await Promise.all([
        supabase.from('landing_hero').select('*').eq('is_active', true).limit(1).single(),
        supabase.from('landing_stats').select('*').eq('is_active', true).order('display_order'),
        supabase.from('landing_features').select('*').eq('is_active', true).order('display_order'),
        supabase.from('landing_steps').select('*').eq('is_active', true).order('step_number'),
        supabase.from('landing_pricing').select('*').eq('is_active', true).order('display_order'),
        supabase.from('landing_faqs').select('*').eq('is_active', true).order('display_order'),
        supabase.from('landing_testimonials').select('*').eq('is_active', true).order('display_order'),
        supabase.from('landing_sections').select('*').eq('is_active', true),
        supabase.from('landing_benefits').select('*').eq('is_active', true).order('display_order'),
        supabase.from('landing_tour_steps').select('*').eq('is_active', true).order('display_order'),
        supabase.from('landing_cta').select('*').eq('is_active', true),
        supabase.from('landing_footer').select('*').eq('is_active', true).limit(1).single()
      ]);

      if (heroResult.data) setHeroContent(heroResult.data);
      if (statsResult.data) setStats(statsResult.data);
      if (featuresResult.data) setFeatures(featuresResult.data);
      if (stepsResult.data) setSteps(stepsResult.data);
      if (pricingResult.data) {
        setPricingPlans(pricingResult.data.map(p => ({
          ...p,
          features: Array.isArray(p.features) ? p.features as string[] : []
        })));
      }
      if (faqsResult.data) setFaqs(faqsResult.data);
      if (testimonialsResult.data) setTestimonials(testimonialsResult.data);
      if (sectionsResult.data) {
        const sections: SectionContent = {};
        sectionsResult.data.forEach(s => { sections[s.section_key] = s.content; });
        setSectionContent(sections);
      }
      if (benefitsResult.data) setBenefits(benefitsResult.data);
      if (tourStepsResult.data) setTourSteps(tourStepsResult.data);
      if (ctaResult.data) {
        const ctas: Record<string, CtaContent> = {};
        ctaResult.data.forEach(c => { ctas[c.section_key] = c; });
        setCtaContent(ctas);
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
      {/* Fixed Navigation Header */}
      <NavHeader scrollY={scrollY} />
      {/* Floating background shapes */}
      <FloatingShape className="w-[600px] h-[600px] bg-primary/20 -top-48 -left-48" />
      <FloatingShape className="w-[500px] h-[500px] bg-accent/20 top-96 -right-48 delay-200" />
      <FloatingShape className="w-[400px] h-[400px] bg-primary/15 bottom-48 left-1/4 delay-400" />

      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center px-4 pt-20 pb-32">
        <div 
          className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiM5Qzkyq0YyIiBmaWxsLW9wYWNpdHk9IjAuMDUiPjxwYXRoIGQ9Ik0zNiAxOGMzLjMxNCAwIDYtMi42ODYgNi02cy0yLjY4Ni02LTYtNi02IDIuNjg2LTYgNiAyLjY4NiA2IDYgNnptMCAzMGMzLjMxNCAwIDYtMi42ODYgNi02cy0yLjY4Ni02LTYtNi02IDIuNjg2LTYgNiAyLjY4NiA2IDYgNnoiLz48L2c+PC9nPjwvc3ZnPg==')] opacity-50"
          style={{ transform: `translateY(${scrollY * 0.3}px)` }}
        />
        
        <div className="max-w-6xl mx-auto text-center relative z-10">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass mb-8 animate-slide-up opacity-0" style={{ animationFillMode: 'forwards' }}>
            <Sparkles className="h-4 w-4 text-primary" />
            <span className="text-sm font-medium text-foreground">
              {heroContent?.badge_text || 'Complete Laboratory Management Solution'}
            </span>
          </div>

          {/* Main heading */}
          <h1 className="text-5xl md:text-7xl font-bold mb-6 animate-slide-up opacity-0 delay-100" style={{ animationFillMode: 'forwards' }}>
            <span className="text-foreground">
              {heroContent?.main_headline?.split(' ').slice(0, 2).join(' ') || 'Streamline Your'}
            </span>
            <br />
            <span className="gradient-text">
              {heroContent?.main_headline?.split(' ').slice(2).join(' ') || 'Lab Operations'}
            </span>
          </h1>

          {/* Subheading */}
          <p className="text-xl md:text-2xl text-muted-foreground mb-10 max-w-3xl mx-auto animate-slide-up opacity-0 delay-200" style={{ animationFillMode: 'forwards' }}>
            {heroContent?.sub_headline || 'From patient registration to test reporting, billing to analytics — manage everything with our powerful, role-based laboratory management system.'}
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16 animate-slide-up opacity-0 delay-300" style={{ animationFillMode: 'forwards' }}>
            <Button asChild size="lg" className="text-lg px-8 py-6 animate-pulse-glow">
              <Link to="/auth" className="flex items-center gap-2">
                {heroContent?.cta_primary_text || 'Get Started Free'}
                <ArrowRight className="h-5 w-5" />
              </Link>
            </Button>
            <Button variant="outline" size="lg" className="text-lg px-8 py-6 glass" asChild>
              <a href="#features" className="flex items-center gap-2">
                {heroContent?.cta_secondary_text || 'Explore Features'}
                <ChevronDown className="h-5 w-5" />
              </a>
            </Button>
          </div>

          {/* Hero stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 animate-slide-up opacity-0 delay-400" style={{ animationFillMode: 'forwards' }}>
            {stats.map((stat, index) => (
              <div key={index} className="glass rounded-2xl p-6 hover-lift">
                <div className="text-3xl md:text-4xl font-bold gradient-text mb-1">
                  <AnimatedCounter end={stat.value} suffix={stat.suffix} />
                </div>
                <div className="text-sm text-muted-foreground">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce-subtle">
          <ChevronDown className="h-8 w-8 text-muted-foreground" />
        </div>
      </section>

      {/* Demo Section */}
      <section id="demo" className="relative py-24 px-4 bg-muted/30">
        <div className="max-w-6xl mx-auto">
          <AnimatedSection className="text-center mb-12">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass mb-4">
              <Play className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium text-foreground">See It In Action</span>
            </div>
            <h2 className="text-4xl md:text-5xl font-bold mb-4 text-foreground">
              Experience
              <span className="gradient-text"> Lab Master</span>
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Watch our quick demo or take an interactive tour to see how Lab Master transforms lab operations.
            </p>
          </AnimatedSection>

          <AnimatedSection animation="scale" delay={200}>
            <DemoSection />
          </AnimatedSection>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="relative py-24 px-4">
        <div className="max-w-7xl mx-auto">
          <AnimatedSection className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass mb-4">
              <Zap className="h-4 w-4 text-accent" />
              <span className="text-sm font-medium text-foreground">Powerful Features</span>
            </div>
            <h2 className="text-4xl md:text-5xl font-bold mb-4 text-foreground">
              Everything You Need to
              <span className="gradient-text"> Run Your Lab</span>
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Comprehensive tools designed specifically for diagnostic laboratories and pathology centers.
            </p>
          </AnimatedSection>

          <AnimatedItems 
            animation="scale" 
            staggerDelay={100} 
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
          >
            {features.map((feature, index) => (
              <FeatureCard 
                key={feature.id || index}
                iconName={feature.icon_name}
                title={feature.title}
                description={feature.description || ''}
                delay=""
              />
            ))}
          </AnimatedItems>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" />
      <section className="relative py-24 px-4 bg-muted/30">
        <div className="max-w-4xl mx-auto">
          <AnimatedSection className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass mb-4">
              <Globe className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium text-foreground">Simple Process</span>
            </div>
            <h2 className="text-4xl md:text-5xl font-bold mb-4 text-foreground">
              Get Started in
              <span className="gradient-text"> 4 Easy Steps</span>
            </h2>
            <p className="text-xl text-muted-foreground">
              From signup to fully operational — we make onboarding seamless.
            </p>
          </AnimatedSection>

          <AnimatedSection animation="fade-left" className="relative">
            {steps.map((step, index) => (
              <Step 
                key={step.id || index}
                number={step.step_number || index + 1}
                title={step.title}
                description={step.description || ''}
                isLast={index === steps.length - 1}
                delay=""
              />
            ))}
          </AnimatedSection>
        </div>
      </section>

      {/* Benefits Section */}
      <section id="benefits" />
      <section className="relative py-24 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <AnimatedSection animation="fade-left">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass mb-4">
                <HeartHandshake className="h-4 w-4 text-primary" />
                <span className="text-sm font-medium text-foreground">
                  {sectionContent?.benefits_badge || 'Why Choose Us'}
                </span>
              </div>
              <h2 className="text-4xl md:text-5xl font-bold mb-6 text-foreground">
                {sectionContent?.benefits_title || 'Built for Modern'}
                <span className="gradient-text"> {sectionContent?.benefits_title_highlight || 'Laboratories'}</span>
              </h2>
              <p className="text-xl text-muted-foreground mb-8">
                {sectionContent?.benefits_subtitle || 'We understand the unique challenges of running a diagnostic lab. Our solution is crafted to address every pain point.'}
              </p>
              
              <div className="space-y-4">
                {(benefits.length > 0 ? benefits : [
                  { id: '1', benefit_text: 'HIPAA-compliant security with role-based access' },
                  { id: '2', benefit_text: 'Multi-branch support with centralized management' },
                  { id: '3', benefit_text: 'Real-time analytics and AI-powered insights' },
                  { id: '4', benefit_text: 'Professional billing with GST and ledger tracking' },
                  { id: '5', benefit_text: 'PWA support — works offline, installs like an app' }
                ]).map((benefit, index) => (
                  <div key={benefit.id} className="flex items-start gap-3 scroll-animate visible" style={{ transitionDelay: `${index * 100}ms` }}>
                    <CheckCircle2 className="h-6 w-6 text-primary flex-shrink-0 mt-0.5" />
                    <span className="text-foreground">{benefit.benefit_text}</span>
                  </div>
                ))}
              </div>
            </AnimatedSection>

            <AnimatedSection animation="fade-right" delay={200} className="relative">
              <div className="glass-strong rounded-3xl p-8 animate-float">
                <div className="space-y-6">
                  <div className="flex items-center justify-between p-4 rounded-xl bg-primary/5">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                        <TestTube className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <div className="font-medium text-foreground">Blood Test Report</div>
                        <div className="text-sm text-muted-foreground">Patient: John Doe</div>
                      </div>
                    </div>
                    <span className="px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">Completed</span>
                  </div>
                  
                  <div className="flex items-center justify-between p-4 rounded-xl bg-accent/5">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-accent/20 flex items-center justify-center">
                        <CreditCard className="h-5 w-5 text-accent" />
                      </div>
                      <div>
                        <div className="font-medium text-foreground">Invoice #2024-0142</div>
                        <div className="text-sm text-muted-foreground">₹2,450.00</div>
                      </div>
                    </div>
                    <span className="px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700">Paid</span>
                  </div>
                  
                  <div className="flex items-center justify-between p-4 rounded-xl bg-primary/5">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                        <Users className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <div className="font-medium text-foreground">New Patient</div>
                        <div className="text-sm text-muted-foreground">Registration complete</div>
                      </div>
                    </div>
                    <span className="px-3 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-700">New</span>
                  </div>
                </div>
              </div>
              
              {/* Decorative elements */}
              <div className="absolute -top-4 -right-4 w-24 h-24 bg-primary/10 rounded-full blur-2xl" />
              <div className="absolute -bottom-4 -left-4 w-32 h-32 bg-accent/10 rounded-full blur-2xl" />
            </AnimatedSection>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section id="testimonials" className="relative py-24 px-4">
        <div className="max-w-6xl mx-auto">
          <AnimatedSection className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass mb-4">
              <Quote className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium text-foreground">Customer Stories</span>
            </div>
            <h2 className="text-4xl md:text-5xl font-bold mb-4 text-foreground">
              Trusted by
              <span className="gradient-text"> 500+ Labs</span>
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Hear what lab owners across India have to say about Lab Master.
            </p>
          </AnimatedSection>

          <AnimatedSection animation="blur" delay={200}>
            <Carousel
              opts={{
                align: "start",
                loop: true,
              }}
              className="w-full"
            >
              <CarouselContent className="-ml-4">
                {testimonials.map((testimonial, index) => (
                  <CarouselItem key={index} className="pl-4 md:basis-1/2 lg:basis-1/3">
                    <Card className="glass hover-lift h-full p-6 flex flex-col">
                      {/* Quote Icon */}
                      <Quote className="h-8 w-8 text-primary/30 mb-4" />
                      
                      {/* Star Rating */}
                      <div className="flex gap-1 mb-4">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Star 
                            key={i} 
                            className={`h-4 w-4 ${i < testimonial.rating ? 'text-yellow-500 fill-yellow-500' : 'text-muted-foreground/30'}`} 
                          />
                        ))}
                      </div>
                      
                      {/* Testimonial Text */}
                      <p className="text-foreground/90 text-sm leading-relaxed flex-grow mb-6">
                        "{testimonial.testimonial_text}"
                      </p>
                      
                      {/* Author Info */}
                      <div className="flex items-center gap-3 pt-4 border-t border-border">
                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-primary-foreground font-bold text-sm">
                          {testimonial.avatar_initials || testimonial.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <div className="font-semibold text-foreground">{testimonial.name}</div>
                          <div className="text-xs text-muted-foreground">{testimonial.role}</div>
                          <div className="text-xs text-primary">{testimonial.location}</div>
                        </div>
                      </div>
                    </Card>
                  </CarouselItem>
                ))}
              </CarouselContent>
              <div className="flex justify-center gap-4 mt-8">
                <CarouselPrevious className="static translate-y-0 bg-background hover:bg-muted" />
                <CarouselNext className="static translate-y-0 bg-background hover:bg-muted" />
              </div>
            </Carousel>
          </AnimatedSection>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="relative py-24 px-4 bg-muted/30">
        <div className="max-w-6xl mx-auto">
          <AnimatedSection className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass mb-4">
              <CreditCard className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium text-foreground">Transparent Pricing</span>
            </div>
            <h2 className="text-4xl md:text-5xl font-bold mb-4 text-foreground">
              Simple Pricing for
              <span className="gradient-text"> Labs of All Sizes</span>
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Choose the plan that fits your needs. Multi-lab owners get special discounts with centralized access and reports.
            </p>
          </AnimatedSection>

          <AnimatedItems 
            animation="scale" 
            staggerDelay={150} 
            className="grid grid-cols-1 md:grid-cols-3 gap-8 items-start"
          >
            {formattedPricingPlans.map((plan) => (
              <PricingCard 
                key={plan.name}
                plan={plan}
                delay=""
              />
            ))}
          </AnimatedItems>

          {/* Multi-lab CTA */}
          <AnimatedSection delay={400} className="mt-16 text-center">
            <div className="inline-flex flex-col sm:flex-row items-center gap-4 p-6 rounded-2xl glass">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-xl bg-primary/10">
                  <Building2 className="h-6 w-6 text-primary" />
                </div>
                <div className="text-left">
                  <p className="font-semibold text-foreground">Own multiple labs?</p>
                  <p className="text-sm text-muted-foreground">Get centralized access, unified reports & volume discounts</p>
                </div>
              </div>
              <Button asChild variant="outline" className="shrink-0">
                <Link to="/auth" className="flex items-center gap-2">
                  Contact for Custom Quote
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            </div>
          </AnimatedSection>
        </div>
      </section>

      {/* FAQ Section */}
      <section id="faq" className="relative py-24 px-4">
        <div className="max-w-4xl mx-auto">
          <AnimatedSection className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass mb-4">
              <HelpCircle className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium text-foreground">FAQ</span>
            </div>
            <h2 className="text-4xl md:text-5xl font-bold mb-4 text-foreground">
              Frequently Asked
              <span className="gradient-text"> Questions</span>
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Got questions? We've got answers. Find everything you need to know about Lab Master.
            </p>
          </AnimatedSection>

          <AnimatedSection animation="blur" delay={150}>
            <Accordion type="single" collapsible className="space-y-4">
              {faqs.map((faq, index) => (
                <AccordionItem 
                  key={index} 
                  value={`item-${index}`}
                  className="glass rounded-xl px-6 border-none"
                >
                  <AccordionTrigger className="text-left hover:no-underline py-5 gap-4">
                    <div className="flex items-start gap-3">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium shrink-0 mt-0.5 ${
                        faq.category === 'pricing' 
                          ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                          : faq.category === 'features'
                          ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400'
                          : 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400'
                      }`}>
                        {faq.category === 'pricing' ? '💰' : faq.category === 'features' ? '🔧' : '🛠️'}
                      </span>
                      <span className="font-medium text-foreground">{faq.question}</span>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground pb-5 pl-9">
                    {faq.answer}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </AnimatedSection>

          {/* Still have questions CTA */}
          <AnimatedSection delay={300} className="mt-12 text-center">
            <div className="inline-flex flex-col sm:flex-row items-center gap-4 p-6 rounded-2xl glass">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-xl bg-primary/10">
                  <MessageCircle className="h-6 w-6 text-primary" />
                </div>
                <div className="text-left">
                  <p className="font-semibold text-foreground">Still have questions?</p>
                  <p className="text-sm text-muted-foreground">Our team is here to help you</p>
                </div>
              </div>
              <Button asChild variant="outline" className="shrink-0">
                <Link to="/auth" className="flex items-center gap-2">
                  Contact Support
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            </div>
          </AnimatedSection>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative py-24 px-4 bg-muted/30">
        <div className="max-w-4xl mx-auto">
          <div className="relative glass-strong rounded-3xl p-12 text-center overflow-hidden">
            {/* Animated background */}
            <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-accent/10 animate-gradient" />
            
            <div className="relative z-10">
              <h2 className="text-4xl md:text-5xl font-bold mb-4 text-foreground">
                {ctaContent?.final_cta?.title || 'Ready to Transform Your Lab?'}
              </h2>
              <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
                {ctaContent?.final_cta?.subtitle || 'Join hundreds of laboratories already using Lab Master to streamline their operations.'}
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button asChild size="lg" className="text-lg px-10 py-6 animated-border">
                  <Link to={ctaContent?.final_cta?.button_url || '/auth'} className="flex items-center gap-2">
                    {ctaContent?.final_cta?.button_text || 'Start Free Trial'}
                    <ArrowRight className="h-5 w-5" />
                  </Link>
                </Button>
              </div>
              
              <p className="mt-6 text-sm text-muted-foreground">
                {ctaContent?.final_cta?.footer_text || 'No credit card required • Free 14-day trial • Cancel anytime'}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative py-12 px-4 border-t border-border">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-primary/10">
                <TestTube className="h-6 w-6 text-primary" />
              </div>
              <span className="text-xl font-bold text-foreground">
                {footerContent?.brand_name || 'Lab Master'}
              </span>
            </div>
            
            <div className="flex items-center gap-8 text-sm text-muted-foreground">
              {(footerContent?.nav_links && footerContent.nav_links.length > 0 
                ? footerContent.nav_links 
                : [
                    { label: 'Features', href: '#features' },
                    { label: 'Login', href: '/auth' },
                    { label: 'Privacy', href: '#' },
                    { label: 'Terms', href: '#' }
                  ]
              ).map((link, index) => (
                link.href.startsWith('/') || link.href.startsWith('http') ? (
                  <Link key={index} to={link.href} className="hover:text-foreground transition-colors">
                    {link.label}
                  </Link>
                ) : (
                  <a key={index} href={link.href} className="hover:text-foreground transition-colors">
                    {link.label}
                  </a>
                )
              ))}
            </div>
            
            <p className="text-sm text-muted-foreground">
              {footerContent?.copyright_text || `© ${new Date().getFullYear()} Lab Master. All rights reserved.`}
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
