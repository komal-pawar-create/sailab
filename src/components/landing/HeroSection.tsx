import React from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Sparkles, ArrowRight, ChevronDown, Building2, FileText, Activity, Headphones, ShieldCheck, CreditCard, Clock, Download } from 'lucide-react';
import { AnimatedCounter } from './shared';
import type { HeroContent, StatItem } from './types';
import dashboardScreenshot from '@/assets/screenshots/dashboard-overview.png';

const getStatIcon = (label: string) => {
  const l = label.toLowerCase();
  if (l.includes('lab')) return Building2;
  if (l.includes('patient') || l.includes('report') || l.includes('test')) return FileText;
  if (l.includes('uptime') || l.includes('active')) return Activity;
  if (l.includes('support') || l.includes('24')) return Headphones;
  return Building2;
};

const getIconColorClass = (label: string) => {
  const l = label.toLowerCase();
  if (l.includes('lab')) return 'bg-primary/10 text-primary';
  if (l.includes('patient') || l.includes('report') || l.includes('test')) return 'bg-green-500/10 text-green-600';
  if (l.includes('uptime') || l.includes('active')) return 'bg-purple-500/10 text-purple-600';
  if (l.includes('support') || l.includes('24')) return 'bg-orange-500/10 text-orange-600';
  return 'bg-primary/10 text-primary';
};

interface HeroSectionProps {
  heroContent: HeroContent | null;
  stats: StatItem[];
  scrollY: number;
}

const HeroSection = ({ heroContent, stats, scrollY }: HeroSectionProps) => {
  const { t } = useTranslation();
  
  return (
    <section 
      className="relative min-h-[80vh] md:min-h-screen flex items-center justify-center px-4 pt-24 pb-10 md:py-20"
      aria-label="Hero"
    >
      <div 
        className="absolute inset-0 bg-[url('/patterns/dots.svg')] opacity-50"
        style={{ transform: `translateY(${scrollY * 0.3}px)` }}
        aria-hidden="true"
      />
      
      <div className="max-w-6xl mx-auto text-center relative z-10">
        {/* Badge */}
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass mb-8 animate-slide-up" style={{ animationFillMode: 'forwards' }}>
          <Sparkles className="h-5 w-5 text-primary" aria-hidden="true" />
          <span className="text-sm font-medium text-foreground">
            {heroContent?.badge_text || t('hero.badge')}
          </span>
        </div>

        {/* Main heading */}
        <h1 className="text-3xl md:text-5xl font-heading font-bold mb-6 animate-slide-up" style={{ animationFillMode: 'forwards', animationDelay: '50ms' }}>
          <span className="text-foreground">
            {heroContent?.main_headline?.split(' ').slice(0, 2).join(' ') || t('hero.headline').split(' ').slice(0, 2).join(' ')}
          </span>
          <br />
          <span className="gradient-text">
            {heroContent?.main_headline?.split(' ').slice(2).join(' ') || t('hero.headline').split(' ').slice(2).join(' ')}
          </span>
        </h1>

        {/* Subheading */}
        <p className="text-lg md:text-xl text-muted-foreground mb-10 max-w-3xl mx-auto animate-slide-up" style={{ animationFillMode: 'forwards', animationDelay: '100ms' }}>
          {heroContent?.sub_headline || t('hero.subheadline')}
        </p>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center mb-6 animate-slide-up" style={{ animationFillMode: 'forwards', animationDelay: '150ms' }}>
          <Button asChild size="lg" className="text-lg px-8 py-6 animate-pulse-glow active:scale-95 transition-transform">
            <Link to="/auth" className="flex items-center gap-2">
              {heroContent?.cta_primary_text || t('hero.cta')}
              <ArrowRight className="h-5 w-5" aria-hidden="true" />
            </Link>
          </Button>
          <Button variant="outline" size="lg" className="text-lg px-8 py-6 glass active:scale-95 transition-transform" asChild>
            <Link to="/product-tour" className="flex items-center gap-2">
              {t('hero.seeHow')}
              <ChevronDown className="h-5 w-5" aria-hidden="true" />
            </Link>
          </Button>
          <Button variant="secondary" size="lg" className="text-lg px-8 py-6 active:scale-95 transition-transform" asChild>
            <a
              href="https://drive.google.com/file/d/1VrD7E_qylICeyVJ8QRFo5KmkY6UgcWhm/view?usp=sharing"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2"
            >
              Download Labflow
              <Download className="h-5 w-5" aria-hidden="true" />
            </a>
          </Button>
        </div>

        {/* Trust signals */}
        <div className="flex flex-wrap items-center justify-center gap-4 md:gap-6 mb-12 text-xs md:text-sm text-muted-foreground animate-slide-up" style={{ animationFillMode: 'forwards', animationDelay: '175ms' }}>
          <span className="flex items-center gap-1.5"><CreditCard className="h-3.5 w-3.5 text-primary" aria-hidden="true" /> No credit card required</span>
          <span className="flex items-center gap-1.5"><Clock className="h-3.5 w-3.5 text-primary" aria-hidden="true" /> Setup in 10 minutes</span>
          <span className="flex items-center gap-1.5"><ShieldCheck className="h-3.5 w-3.5 text-primary" aria-hidden="true" /> NABL-ready compliance</span>
        </div>

        {/* Compact inline stats bar */}
        <div 
          className="flex flex-wrap justify-center gap-6 md:gap-10 mb-12 animate-slide-up" 
          style={{ animationFillMode: 'forwards', animationDelay: '200ms' }}
          role="list"
          aria-label="Key statistics"
        >
          {stats.map((stat, index) => {
            const Icon = getStatIcon(stat.label);
            const iconColorClass = getIconColorClass(stat.label);
            return (
              <div key={stat.id || index} className="flex items-center gap-2" role="listitem">
                <div className={`p-1.5 rounded-lg ${iconColorClass}`}>
                  <Icon className="h-4 w-4" aria-hidden="true" />
                </div>
                <span className="text-lg md:text-xl font-bold gradient-text">
                  <AnimatedCounter end={stat.value} suffix={stat.suffix || ''} />
                </span>
                <span className="text-xs md:text-sm text-muted-foreground">{stat.label}</span>
              </div>
            );
          })}
        </div>

        {/* Product screenshot in browser frame */}
        <div className="relative max-w-5xl mx-auto animate-slide-up" style={{ animationFillMode: 'forwards', animationDelay: '250ms' }}>
          <div className="rounded-xl overflow-hidden border border-border/50 shadow-2xl bg-background">
            {/* Browser chrome */}
            <div className="h-9 md:h-10 bg-muted/80 backdrop-blur flex items-center px-4 gap-2 border-b border-border/30">
              <div className="flex gap-1.5">
                <div className="w-2.5 h-2.5 md:w-3 md:h-3 rounded-full bg-red-500/70" />
                <div className="w-2.5 h-2.5 md:w-3 md:h-3 rounded-full bg-yellow-500/70" />
                <div className="w-2.5 h-2.5 md:w-3 md:h-3 rounded-full bg-green-500/70" />
              </div>
              <div className="flex-1 mx-3 h-5 md:h-6 rounded bg-background/60 flex items-center px-3">
                <span className="text-[10px] md:text-xs text-muted-foreground">labflow.mywebz.in/dashboard</span>
              </div>
            </div>
            {/* Screenshot */}
            <img 
              src={dashboardScreenshot} 
              alt="LabFlow Dashboard - Patient management, billing, and analytics overview"
              className="w-full h-auto"
              loading="eager"
              fetchPriority="high"
              width={1280}
              height={720}
            />
          </div>
          {/* Glow effect behind frame */}
          <div className="absolute -inset-4 bg-gradient-to-r from-primary/10 via-accent/10 to-primary/10 rounded-2xl -z-10 blur-2xl" aria-hidden="true" />
        </div>
      </div>

      {/* Scroll indicator */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce-subtle" aria-hidden="true">
        <ChevronDown className="h-8 w-8 text-muted-foreground" />
      </div>
    </section>
  );
};

export default HeroSection;
