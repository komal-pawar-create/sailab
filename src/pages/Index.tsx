import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
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
  HeartHandshake
} from 'lucide-react';
import { useEffect, useState, useRef } from 'react';

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

// Floating shape component
const FloatingShape = ({ className }: { className?: string }) => (
  <div className={`absolute rounded-full animate-blob opacity-30 blur-3xl ${className}`} />
);

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

  return (
    <div className="min-h-screen bg-background overflow-hidden">
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

      {/* Features Section */}
      <section id="features" className="relative py-24 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
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
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, index) => (
              <FeatureCard 
                key={index} 
                {...feature} 
                delay={`delay-${(index + 1) * 100}`}
              />
            ))}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="relative py-24 px-4 bg-muted/30">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-16">
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
          </div>

          <div className="relative">
            {steps.map((step, index) => (
              <Step 
                key={index}
                number={index + 1}
                title={step.title}
                description={step.description}
                isLast={index === steps.length - 1}
                delay={`delay-${(index + 1) * 100}`}
              />
            ))}
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="relative py-24 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
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
                  <div key={index} className="flex items-start gap-3 animate-slide-in-left opacity-0" style={{ animationDelay: `${index * 100}ms`, animationFillMode: 'forwards' }}>
                    <CheckCircle2 className="h-6 w-6 text-primary flex-shrink-0 mt-0.5" />
                    <span className="text-foreground">{benefit}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="relative">
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
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative py-24 px-4">
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
