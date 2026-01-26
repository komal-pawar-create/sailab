import React from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { CtaContent } from './types';

interface CTASectionProps {
  ctaContent: { final_cta?: CtaContent };
}

const CTASection = ({ ctaContent }: CTASectionProps) => {
  const { t } = useTranslation();
  
  return (
    <section className="relative py-24 px-4 bg-muted/30">
      <div className="max-w-4xl mx-auto">
        <div className="relative glass-strong rounded-3xl p-12 text-center overflow-hidden">
          {/* Animated background */}
          <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-accent/10 animate-gradient" />
          
          <div className="relative z-10">
            <h2 className="text-4xl md:text-5xl font-bold mb-4 text-foreground">
              {ctaContent?.final_cta?.title || t('cta.title')}
            </h2>
            <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
              {ctaContent?.final_cta?.subtitle || t('cta.subtitle')}
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button asChild size="lg" className="text-lg px-10 py-6 animated-border">
                <Link to={ctaContent?.final_cta?.button_url || '/auth'} className="flex items-center gap-2">
                  {ctaContent?.final_cta?.button_text || t('cta.button')}
                  <ArrowRight className="h-5 w-5" />
                </Link>
              </Button>
            </div>
            
            <p className="mt-6 text-sm text-muted-foreground">
              {ctaContent?.final_cta?.footer_text || t('cta.footer')}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default CTASection;
