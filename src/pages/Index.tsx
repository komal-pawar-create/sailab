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
import { useEffect, useState, useRef } from 'react';
import { useTheme } from 'next-themes';

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

// Feature card component
const FeatureCard = ({ icon: Icon, title, description, delay }: { 
  icon: React.ElementType; 
  title: string; 
  description: string;
  delay: string;
}) => (
  <Card className={`group relative overflow-hidden p-6 glass hover-lift animate-slide-up opacity-0 ${delay}`} style={{ animationFillMode: 'forwards' }}>
    <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-accent/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
    <div className="relative">
      <div className="mb-4 inline-flex p-3 rounded-xl bg-primary/10 text-primary group-hover:scale-110 group-hover:bg-primary group-hover:text-primary-foreground transition-all duration-300">
        <Icon className="h-6 w-6" />
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

  const tourSteps = [
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
            {tourSteps.map((step, index) => (
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
                      const StepIcon = tourSteps[tourStep].icon;
                      return <StepIcon className="h-5 w-5 text-primary" />;
                    })()}
                  </div>
                  <span className="font-semibold text-foreground">{tourSteps[tourStep].title}</span>
                </div>
                <span className="text-xs text-muted-foreground">Step {tourStep + 1} of {tourSteps.length}</span>
              </div>
              
              {/* Dynamic Mockup */}
              <div className="min-h-[200px]">
                {renderMockup(tourSteps[tourStep].mockup)}
              </div>

              {/* Navigation Dots */}
              <div className="flex justify-center gap-2 mt-6">
                {tourSteps.map((_, index) => (
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

  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const features = [
    {
      icon: Users,
      title: 'Patient Management',
      description: 'Complete patient records with search, history tracking, and secure data management. Auto-generated patient IDs per branch.'
    },
    {
      icon: TestTube,
      title: 'Test Reporting',
      description: 'Digital test results with real-time status tracking, customizable test types, and instant report generation.'
    },
    {
      icon: CreditCard,
      title: 'Billing & Payments',
      description: 'Comprehensive billing with ledger tracking, partial payments, GST support, and professional invoice printing.'
    },
    {
      icon: BarChart3,
      title: 'Analytics Dashboard',
      description: 'Revenue trends, patient statistics, AI-powered predictions, and branch comparison analytics.'
    },
    {
      icon: Shield,
      title: 'Role-Based Access',
      description: 'Multi-tier security with Super Admin, Lab Admin, Branch Operator roles. Complete audit logging.'
    },
    {
      icon: Building2,
      title: 'Multi-Branch Support',
      description: 'Organization hierarchy with labs and branches. Centralized management with branch-level customization.'
    },
    {
      icon: FileText,
      title: 'Document Management',
      description: 'Secure file storage, letterhead templates, and document organization with patient-linked attachments.'
    },
    {
      icon: Clock,
      title: 'Follow-up Tracking',
      description: 'Patient follow-up scheduling with priority levels, reminders, and status tracking for better care.'
    }
  ];

  const stats = [
    { value: 99.9, suffix: '%', label: 'Uptime Guaranteed' },
    { value: 500, suffix: '+', label: 'Labs Trust Us' },
    { value: 1, suffix: 'M+', label: 'Reports Generated' },
    { value: 24, suffix: '/7', label: 'Support Available' }
  ];

  const steps = [
    { title: 'Register Your Lab', description: 'Quick onboarding process with organization and lab setup. Configure your branches and team structure.' },
    { title: 'Configure Settings', description: 'Customize test types, billing templates, letterheads, and role permissions to match your workflow.' },
    { title: 'Onboard Your Team', description: 'Invite staff members with appropriate roles. Branch operators, lab admins, and super admins.' },
    { title: 'Start Operating', description: 'Begin managing patients, generating reports, and tracking revenue with powerful analytics.' }
  ];

  const pricingPlans: PricingPlan[] = [
    {
      name: 'Starter',
      price: 5000,
      amcPrice: 1500,
      features: [
        '1 Lab License',
        'Patient Management',
        'Test Reporting & Billing',
        'Analytics Dashboard',
        'Email Support',
        'Standard updates'
      ]
    },
    {
      name: 'Professional',
      price: 4500,
      amcPrice: 1350,
      discount: 10,
      minLabs: 3,
      isPopular: true,
      features: [
        'All Starter features',
        'Centralized Dashboard',
        'Cross-branch Reporting',
        'Multi-branch Analytics',
        'Priority Support',
        'Custom branding'
      ]
    },
    {
      name: 'Enterprise',
      price: 4000,
      amcPrice: 1200,
      discount: 20,
      minLabs: 10,
      isEnterprise: true,
      features: [
        'All Professional features',
        'Dedicated Account Manager',
        'Custom Integrations',
        'Advanced API Access',
        '24/7 Phone Support',
        'On-site Training'
      ]
    }
  ];

  const faqs = [
    {
      category: 'pricing',
      question: "What's included in the one-time setup fee?",
      answer: "Full software installation, initial configuration, data migration assistance, custom branding setup, and basic training for your team. We ensure you're fully operational from day one."
    },
    {
      category: 'pricing',
      question: "What does the AMC (Annual Maintenance Contract) cover?",
      answer: "All software updates, bug fixes, security patches, data backups, email support, and up to 2 hours of remote assistance per month. Your lab stays current with the latest features."
    },
    {
      category: 'pricing',
      question: "Can I upgrade from Starter to Professional later?",
      answer: "Yes! You can upgrade anytime. You'll only pay the difference in setup cost, and your AMC will be prorated for the remaining period. All your data migrates seamlessly."
    },
    {
      category: 'pricing',
      question: "Are there any hidden charges?",
      answer: "No hidden fees. The pricing shown includes everything. Additional charges only apply for custom development, SMS/WhatsApp notifications, or on-site training if requested."
    },
    {
      category: 'features',
      question: "Can I use Lab Master on mobile devices?",
      answer: "Yes! Lab Master is a Progressive Web App (PWA) that works on all devices — desktops, tablets, and smartphones. It can even work offline for basic operations."
    },
    {
      category: 'features',
      question: "How many users can I add to my lab?",
      answer: "Unlimited users! Each plan allows unlimited user accounts with role-based access control (Super Admin, Lab Admin, Branch Operator). No per-user fees."
    },
    {
      category: 'features',
      question: "Can I customize test types and report templates?",
      answer: "Absolutely. You can create custom test types, set reference ranges, add letterheads, signatures, and design your own report templates to match your lab's branding."
    },
    {
      category: 'features',
      question: "Does Lab Master support multiple branches?",
      answer: "Yes! The Professional and Enterprise plans support multi-branch management with centralized dashboards, cross-branch reporting, and unified analytics."
    },
    {
      category: 'support',
      question: "What kind of support do you provide?",
      answer: "Starter: Email support (24-48hr response). Professional: Priority email + chat (4hr response). Enterprise: 24/7 phone support with a dedicated account manager."
    },
    {
      category: 'support',
      question: "Is my data secure?",
      answer: "Yes. We use industry-standard encryption, regular backups, and role-based access control. Your data is hosted on secure servers with 99.9% uptime guarantee."
    },
    {
      category: 'support',
      question: "Can I export my data if I stop using Lab Master?",
      answer: "Yes. You can export all your data (patients, reports, bills) in standard formats (CSV, PDF) at any time. We never lock you in — your data is always yours."
    },
    {
      category: 'support',
      question: "Do you offer training for my team?",
      answer: "Starter and Professional plans include online documentation and video tutorials. Enterprise plans include on-site training sessions and a dedicated onboarding specialist."
    }
  ];

  const testimonials = [
    {
      name: "Dr. Rajesh Kumar",
      role: "Owner, HealthCare Diagnostics",
      location: "Mumbai",
      rating: 5,
      text: "Lab Master transformed how we manage our 5-branch network. The centralized dashboard saves us hours every week, and the multi-branch analytics give us insights we never had before.",
      image: "RK"
    },
    {
      name: "Dr. Priya Sharma",
      role: "Director, Sharma Pathology Lab",
      location: "Delhi",
      rating: 5,
      text: "The billing and ledger tracking features are exceptional. We've reduced billing errors by 90% and our patients love the professional invoices. Best investment for our lab!",
      image: "PS"
    },
    {
      name: "Dr. Arun Patel",
      role: "Founder, Patel Diagnostic Centre",
      location: "Ahmedabad",
      rating: 5,
      text: "Moving from paper records to Lab Master was seamless. The support team helped migrate all our data, and the PWA works perfectly on our tablets during sample collection.",
      image: "AP"
    },
    {
      name: "Dr. Sunita Reddy",
      role: "MD, Reddy Labs",
      location: "Hyderabad",
      rating: 4,
      text: "The role-based access control gives me peace of mind. I can give operators exactly the permissions they need, and the audit logs help track everything.",
      image: "SR"
    },
    {
      name: "Dr. Mohammed Iqbal",
      role: "Owner, City Diagnostics",
      location: "Bangalore",
      rating: 5,
      text: "We switched from another LIMS software and the difference is night and day. Lab Master's UI is intuitive, fast, and our staff learned it in just one day!",
      image: "MI"
    },
    {
      name: "Dr. Kavitha Nair",
      role: "Partner, Kerala Path Labs",
      location: "Kochi",
      rating: 5,
      text: "The patient follow-up feature has improved our patient retention significantly. Automated reminders and the feedback system help us maintain excellent service quality.",
      image: "KN"
    }
  ];

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
            <span className="text-sm font-medium text-foreground">Complete Laboratory Management Solution</span>
          </div>

          {/* Main heading */}
          <h1 className="text-5xl md:text-7xl font-bold mb-6 animate-slide-up opacity-0 delay-100" style={{ animationFillMode: 'forwards' }}>
            <span className="text-foreground">Streamline Your</span>
            <br />
            <span className="gradient-text">Lab Operations</span>
          </h1>

          {/* Subheading */}
          <p className="text-xl md:text-2xl text-muted-foreground mb-10 max-w-3xl mx-auto animate-slide-up opacity-0 delay-200" style={{ animationFillMode: 'forwards' }}>
            From patient registration to test reporting, billing to analytics — 
            manage everything with our powerful, role-based laboratory management system.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16 animate-slide-up opacity-0 delay-300" style={{ animationFillMode: 'forwards' }}>
            <Button asChild size="lg" className="text-lg px-8 py-6 animate-pulse-glow">
              <Link to="/auth" className="flex items-center gap-2">
                Get Started Free
                <ArrowRight className="h-5 w-5" />
              </Link>
            </Button>
            <Button variant="outline" size="lg" className="text-lg px-8 py-6 glass" asChild>
              <a href="#features" className="flex items-center gap-2">
                Explore Features
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
                key={index} 
                {...feature} 
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
                key={index}
                number={index + 1}
                title={step.title}
                description={step.description}
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
                <span className="text-sm font-medium text-foreground">Why Choose Us</span>
              </div>
              <h2 className="text-4xl md:text-5xl font-bold mb-6 text-foreground">
                Built for Modern
                <span className="gradient-text"> Laboratories</span>
              </h2>
              <p className="text-xl text-muted-foreground mb-8">
                We understand the unique challenges of running a diagnostic lab. Our solution is crafted to address every pain point.
              </p>
              
              <div className="space-y-4">
                {[
                  'HIPAA-compliant security with role-based access',
                  'Multi-branch support with centralized management',
                  'Real-time analytics and AI-powered insights',
                  'Professional billing with GST and ledger tracking',
                  'PWA support — works offline, installs like an app'
                ].map((benefit, index) => (
                  <div key={index} className="flex items-start gap-3 scroll-animate visible" style={{ transitionDelay: `${index * 100}ms` }}>
                    <CheckCircle2 className="h-6 w-6 text-primary flex-shrink-0 mt-0.5" />
                    <span className="text-foreground">{benefit}</span>
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
                        "{testimonial.text}"
                      </p>
                      
                      {/* Author Info */}
                      <div className="flex items-center gap-3 pt-4 border-t border-border">
                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-primary-foreground font-bold text-sm">
                          {testimonial.image}
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
            {pricingPlans.map((plan) => (
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
                Ready to Transform Your Lab?
              </h2>
              <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
                Join hundreds of laboratories already using Lab Master to streamline their operations.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button asChild size="lg" className="text-lg px-10 py-6 animated-border">
                  <Link to="/auth" className="flex items-center gap-2">
                    Start Free Trial
                    <ArrowRight className="h-5 w-5" />
                  </Link>
                </Button>
              </div>
              
              <p className="mt-6 text-sm text-muted-foreground">
                No credit card required • Free 14-day trial • Cancel anytime
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
              <span className="text-xl font-bold text-foreground">Lab Master</span>
            </div>
            
            <div className="flex items-center gap-8 text-sm text-muted-foreground">
              <a href="#features" className="hover:text-foreground transition-colors">Features</a>
              <Link to="/auth" className="hover:text-foreground transition-colors">Login</Link>
              <a href="#" className="hover:text-foreground transition-colors">Privacy</a>
              <a href="#" className="hover:text-foreground transition-colors">Terms</a>
            </div>
            
            <p className="text-sm text-muted-foreground">
              © {new Date().getFullYear()} Lab Master. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
