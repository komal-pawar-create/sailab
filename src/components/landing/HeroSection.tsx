import React from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Sparkles, ArrowRight, ChevronDown } from 'lucide-react';
import { AnimatedCounter } from './shared';
import type { HeroContent, StatItem } from './types';

interface HeroSectionProps {
  heroContent: HeroContent | null;
  stats: StatItem[];
  scrollY: number;
}

const HeroSection = ({ heroContent, stats, scrollY }: HeroSectionProps) => {
  const { t } = useTranslation();
  
  return (
    <section 
      className="relative min-h-screen flex items-center justify-center px-4 pt-20 pb-32"
      aria-label="Hero"
    >
      {/* Parallax background pattern */}
      <div 
        className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiM5Qzkyq0YyIiBmaWxsLW9wYWNpdHk9IjAuMDUiPjxwYXRoIGQ9Ik0zNiAxOGMzLjMxNCAwIDYtMi42ODYgNi02cy0yLjY4Ni02LTYtNi02IDIuNjg2LTYgNiAyLjY4NiA2IDYgNnptMCAzMGMzLjMxNCAwIDYtMi42ODYgNi02cy0yLjY4Ni02LTYtNi02IDIuNjg2LTYgNiAyLjY4NiA2IDYgNnoiLz48L2c+PC9nPjwvc3ZnPg==')] opacity-50"
        style={{ transform: `translateY(${scrollY * 0.3}px)` }}
        aria-hidden="true"
      />
      
      <div className="max-w-6xl mx-auto text-center relative z-10">
        {/* Badge */}
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass mb-8 animate-slide-up opacity-0" style={{ animationFillMode: 'forwards' }}>
          <Sparkles className="h-4 w-4 text-primary" aria-hidden="true" />
          <span className="text-sm font-medium text-foreground">
            {heroContent?.badge_text || t('hero.badge')}
          </span>
        </div>

        {/* Main heading - H1 for SEO */}
        <h1 className="text-5xl md:text-7xl font-bold mb-6 animate-slide-up opacity-0 delay-100" style={{ animationFillMode: 'forwards' }}>
          <span className="text-foreground">
            {heroContent?.main_headline?.split(' ').slice(0, 2).join(' ') || t('hero.headline').split(' ').slice(0, 2).join(' ')}
          </span>
          <br />
          <span className="gradient-text">
            {heroContent?.main_headline?.split(' ').slice(2).join(' ') || t('hero.headline').split(' ').slice(2).join(' ')}
          </span>
        </h1>

        {/* Subheading */}
        <p className="text-xl md:text-2xl text-muted-foreground mb-10 max-w-3xl mx-auto animate-slide-up opacity-0 delay-200" style={{ animationFillMode: 'forwards' }}>
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

        {/* Hero stats */}
        <div 
          className="grid grid-cols-2 md:grid-cols-4 gap-6 animate-slide-up opacity-0 delay-400" 
          style={{ animationFillMode: 'forwards' }}
          role="list"
          aria-label="Key statistics"
        >
          {stats.map((stat, index) => (
            <div 
              key={stat.id || index} 
              className="glass rounded-2xl p-6 hover-lift"
              role="listitem"
            >
              <div className="text-3xl md:text-4xl font-bold gradient-text mb-1">
                <AnimatedCounter end={stat.value} suffix={stat.suffix || ''} />
              </div>
              <div className="text-sm text-muted-foreground">{stat.label}</div>
            </div>
          ))}
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
