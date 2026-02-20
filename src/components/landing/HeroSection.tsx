import React from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Sparkles, ArrowRight, ChevronDown, Building2, FileText, Activity, Headphones } from 'lucide-react';
import { AnimatedCounter } from './shared';
import type { HeroContent, StatItem } from './types';

// Icon mapping for stats - matches labels to appropriate icons
const getStatIcon = (label: string) => {
  const labelLower = label.toLowerCase();
  if (labelLower.includes('lab')) return Building2;
  if (labelLower.includes('patient') || labelLower.includes('report') || labelLower.includes('test')) return FileText;
  if (labelLower.includes('uptime') || labelLower.includes('active')) return Activity;
  if (labelLower.includes('support') || labelLower.includes('24')) return Headphones;
  return Building2; // default
};

// Color variants for icons based on stat type
const getIconColorClass = (label: string) => {
  const labelLower = label.toLowerCase();
  if (labelLower.includes('lab')) return 'bg-primary/10 text-primary';
  if (labelLower.includes('patient') || labelLower.includes('report') || labelLower.includes('test')) return 'bg-green-500/10 text-green-600';
  if (labelLower.includes('uptime') || labelLower.includes('active')) return 'bg-purple-500/10 text-purple-600';
  if (labelLower.includes('support') || labelLower.includes('24')) return 'bg-orange-500/10 text-orange-600';
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
      className="relative min-h-screen flex items-center justify-center px-4 pt-24 pb-10 md:py-20"
      aria-label="Hero"
    >
      {/* Parallax background pattern */}
      <div 
        className="absolute inset-0 bg-[url('/patterns/dots.svg')] opacity-50"
        style={{ transform: `translateY(${scrollY * 0.3}px)` }}
        aria-hidden="true"
      />
      
      <div className="max-w-6xl mx-auto text-center relative z-10">
        {/* Badge */}
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass mb-8 animate-slide-up opacity-0" style={{ animationFillMode: 'forwards' }}>
          <Sparkles className="h-5 w-5 text-primary" aria-hidden="true" />
          <span className="text-sm font-medium text-foreground">
            {heroContent?.badge_text || t('hero.badge')}
          </span>
        </div>

        {/* Main heading - H1 for SEO */}
        <h1 className="text-3xl md:text-5xl font-heading font-bold mb-6 animate-slide-up opacity-0 delay-100" style={{ animationFillMode: 'forwards' }}>
          <span className="text-foreground">
            {heroContent?.main_headline?.split(' ').slice(0, 2).join(' ') || t('hero.headline').split(' ').slice(0, 2).join(' ')}
          </span>
          <br />
          <span className="gradient-text">
            {heroContent?.main_headline?.split(' ').slice(2).join(' ') || t('hero.headline').split(' ').slice(2).join(' ')}
          </span>
        </h1>

        {/* Subheading */}
        <p className="text-lg md:text-xl text-muted-foreground mb-10 max-w-3xl mx-auto animate-slide-up opacity-0 delay-200" style={{ animationFillMode: 'forwards' }}>
          {heroContent?.sub_headline || t('hero.subheadline')}
        </p>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16 animate-slide-up opacity-0 delay-300" style={{ animationFillMode: 'forwards' }}>
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
        </div>

        {/* Hero stats - Compact professional cards */}
        <div 
          className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 max-w-4xl mx-auto animate-slide-up opacity-0 delay-400" 
          style={{ animationFillMode: 'forwards' }}
          role="list"
          aria-label="Key statistics"
        >
          {stats.map((stat, index) => {
            const Icon = getStatIcon(stat.label);
            const iconColorClass = getIconColorClass(stat.label);
            
            return (
              <div 
                key={stat.id || index} 
                className="group relative overflow-hidden rounded-xl bg-background/80 backdrop-blur-sm border border-border/40 p-4 md:p-5 shadow-md hover:shadow-lg hover:border-primary/20 transition-all duration-300 hover:-translate-y-0.5"
                role="listitem"
              >
                {/* Glow effect on hover */}
                <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" aria-hidden="true" />
                
                {/* Icon badge - centered */}
                <div className="flex justify-center mb-3">
                  <div className={`relative inline-flex p-2.5 rounded-lg ${iconColorClass}`}>
                    <Icon className="h-5 w-5" aria-hidden="true" />
                  </div>
                </div>
                
                {/* Value - Centered and proportional */}
                <div className="relative text-2xl md:text-3xl font-bold gradient-text text-center mb-1">
                  <AnimatedCounter end={stat.value} suffix={stat.suffix || ''} />
                </div>
                
                {/* Label - Centered */}
                <div className="relative text-xs md:text-sm font-medium text-muted-foreground text-center">
                  {stat.label}
                </div>
              </div>
            );
          })}
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
