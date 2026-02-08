import React, { useEffect, useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
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
  Check,
  BadgePercent,
  ArrowRight,
} from 'lucide-react';
import type { PricingPlan } from './types';

// Dynamic icon component - map icon names to components
export const getIconComponent = (name: string): React.ElementType => {
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

export const DynamicIcon = ({ name, className }: { name: string; className?: string }) => {
  const IconComponent = getIconComponent(name);
  return <IconComponent className={className} aria-hidden="true" />;
};

// Animated counter component with skeleton loading
export const AnimatedCounter = ({ end, duration = 2000, suffix = '' }: { end: number; duration?: number; suffix?: string }) => {
  const [count, setCount] = useState<number | null>(null);
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

  return (
    <span ref={ref} className="animate-count-up">
      {count === null ? (
        <Skeleton className="h-10 w-16 inline-block" />
      ) : (
        `${count}${suffix}`
      )}
    </span>
  );
};

// Feature card component - supports dynamic icon names
export const FeatureCard = ({ icon, iconName, title, description, delay }: { 
  icon?: React.ElementType; 
  iconName?: string;
  title: string; 
  description: string;
  delay: string;
}) => (
  <Card className={`group relative overflow-hidden p-6 glass hover-lift animate-slide-up opacity-0 ${delay}`} style={{ animationFillMode: 'forwards' }}>
    <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-accent/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" aria-hidden="true" />
    <div className="relative">
      <div className="mb-4 inline-flex p-3 rounded-xl bg-primary/10 text-primary group-hover:scale-110 group-hover:bg-primary group-hover:text-primary-foreground transition-all duration-300">
        {icon ? <>{React.createElement(icon, { className: "h-6 w-6", "aria-hidden": true })}</> : iconName ? <DynamicIcon name={iconName} className="h-6 w-6" /> : null}
      </div>
      <h3 className="text-lg font-semibold mb-2 text-foreground">{title}</h3>
      <p className="text-muted-foreground text-sm leading-relaxed">{description}</p>
    </div>
  </Card>
);

// Step component for "How It Works"
export const Step = ({ number, title, description, isLast, delay }: { 
  number: number; 
  title: string; 
  description: string;
  isLast?: boolean;
  delay: string;
}) => (
  <div className={`relative flex gap-6 animate-slide-up opacity-0 ${delay}`} style={{ animationFillMode: 'forwards' }}>
    <div className="flex flex-col items-center">
      <div 
        className="flex items-center justify-center w-12 h-12 rounded-full bg-primary text-primary-foreground font-bold text-lg animate-pulse-glow"
        aria-hidden="true"
      >
        {number}
      </div>
      {!isLast && (
        <div className="w-0.5 h-full bg-gradient-to-b from-primary to-primary/20 mt-4" aria-hidden="true" />
      )}
    </div>
    <div className="pb-12">
      <h3 className="text-xl font-semibold mb-2 text-foreground">{title}</h3>
      <p className="text-muted-foreground">{description}</p>
    </div>
  </div>
);

// Helper function to calculate discounted price
const calculatePrice = (basePrice: number, billingPeriod: 'monthly' | 'yearly' | '3-year'): number => {
  switch (billingPeriod) {
    case 'yearly':
      return Math.round(basePrice * 0.8); // 20% off
    case '3-year':
      return Math.round(basePrice * 0.6); // 40% off
    default:
      return basePrice;
  }
};

// Calculate total amount and savings for yearly/3-year billing
const getTotalAndSavings = (
  basePrice: number, 
  discountedPrice: number, 
  billingPeriod: 'monthly' | 'yearly' | '3-year'
): { total: number; savings: number } => {
  const months = billingPeriod === 'yearly' ? 12 : 36;
  const totalWithDiscount = discountedPrice * months;
  const totalWithoutDiscount = basePrice * months;
  const savings = totalWithoutDiscount - totalWithDiscount;
  
  return { total: totalWithDiscount, savings };
};

// Pricing card component
export const PricingCard = ({ 
  plan, 
  billingPeriod = 'monthly',
  delay,
  onEnterpriseClick,
}: { 
  plan: PricingPlan;
  billingPeriod?: 'monthly' | 'yearly' | '3-year';
  delay: string;
  onEnterpriseClick?: () => void;
}) => {
  const { name, price, features, isPopular, isEnterprise, minLabs } = plan;
  
  const discountedPrice = calculatePrice(price, billingPeriod);
  const showDiscount = billingPeriod !== 'monthly' && !isEnterprise;
  
  return (
    <Card 
      className={`group relative overflow-hidden p-6 animate-slide-up opacity-0 ${delay} ${
        isPopular 
          ? 'glass-strong border-2 border-primary shadow-xl scale-105 z-10' 
          : 'glass hover-lift'
      }`} 
      style={{ animationFillMode: 'forwards' }}
      role="article"
      aria-label={`${name} pricing plan`}
    >
      {/* Popular Badge - Fixed positioning */}
      {isPopular && (
        <div className="absolute -top-4 left-1/2 -translate-x-1/2 z-20">
          <div className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-primary text-primary-foreground text-sm font-medium shadow-lg whitespace-nowrap">
            <Star className="h-4 w-4 fill-current" aria-hidden="true" />
            Most Popular
          </div>
        </div>
      )}
      
      {/* Discount Badge */}
      {showDiscount && (
        <div className="absolute top-4 right-4">
          <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-accent/20 text-accent-foreground text-xs font-medium">
            <BadgePercent className="h-3 w-3" aria-hidden="true" />
            Save {billingPeriod === 'yearly' ? '20' : '40'}%
          </div>
        </div>
      )}

      <div className={`${isPopular ? 'pt-6' : ''}`}>
        {/* Plan Name */}
        <h3 className="text-xl font-bold text-foreground mb-2">{name}</h3>
        {minLabs && (
          <p className="text-sm text-muted-foreground mb-4">Minimum {minLabs} labs</p>
        )}
        {!minLabs && <div className="h-6 mb-4" />}
        
        {/* Price Display */}
        {isEnterprise ? (
          <div className="mb-6 pb-6 border-b border-border">
            <span className="text-3xl font-bold text-foreground">Custom</span>
            <p className="text-sm text-muted-foreground mt-2">Contact us for pricing</p>
          </div>
        ) : (
          <>
            <div className="mb-2">
              {showDiscount && (
                <span className="text-lg text-muted-foreground line-through mr-2">
                  ₹{price.toLocaleString('en-IN')}
                </span>
              )}
              <span className="text-4xl font-bold text-foreground">
                ₹{discountedPrice.toLocaleString('en-IN')}
              </span>
              <span className="text-muted-foreground">/month</span>
            </div>
            
            {/* Total Calculation - Only show for yearly/3-year */}
            {billingPeriod !== 'monthly' ? (
              (() => {
                const { total, savings } = getTotalAndSavings(price, discountedPrice, billingPeriod);
                return (
                  <div className="mb-6 pb-6 border-b border-border">
                    <div className="flex items-center justify-between text-sm mb-1">
                      <span className="text-muted-foreground">Total:</span>
                      <span className="font-semibold text-foreground">
                        ₹{total.toLocaleString('en-IN')}
                        {billingPeriod === 'yearly' ? '/year' : ' for 3 years'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">You save:</span>
                      <span className="text-accent font-medium">
                        ₹{savings.toLocaleString('en-IN')}
                      </span>
                    </div>
                  </div>
                );
              })()
            ) : (
              <p className="text-sm text-muted-foreground mb-6 pb-6 border-b border-border">
                Billed monthly, cancel anytime
              </p>
            )}
          </>
        )}
        
        {/* Features */}
        <ul className="space-y-3 mb-8" aria-label={`${name} plan features`}>
          {features.map((feature, index) => (
            <li key={index} className="flex items-start gap-3">
              <Check className={`h-5 w-5 flex-shrink-0 mt-0.5 ${isPopular ? 'text-primary' : 'text-green-600 dark:text-green-400'}`} aria-hidden="true" />
              <span className="text-sm text-foreground">{feature}</span>
            </li>
          ))}
        </ul>
        
        {/* CTA Button */}
        {isEnterprise && onEnterpriseClick ? (
          <Button 
            onClick={onEnterpriseClick}
            className="w-full active:scale-95 transition-transform"
            variant="outline"
            size="lg"
          >
            <span className="flex items-center justify-center gap-2">
              Contact Sales
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </span>
          </Button>
        ) : (
          <Button 
            asChild 
            className={`w-full active:scale-95 transition-transform ${isPopular ? 'animate-pulse-glow' : ''}`}
            variant={isPopular ? 'default' : 'outline'}
            size="lg"
          >
            <Link to="/auth" className="flex items-center justify-center gap-2">
              Get Started
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          </Button>
        )}
      </div>
    </Card>
  );
};

// Floating shape component
export const FloatingShape = ({ className }: { className?: string }) => (
  <div className={`absolute rounded-full animate-blob opacity-30 blur-3xl ${className}`} aria-hidden="true" />
);
