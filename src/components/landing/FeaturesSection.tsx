import React from 'react';
import { useTranslation } from 'react-i18next';
import { Zap } from 'lucide-react';
import { AnimatedSection, AnimatedItems } from '@/components/AnimatedSection';
import { FeatureCard } from './shared';
import type { FeatureItem } from './types';

import billingScreenshot from '@/assets/screenshots/billing-interface.png';
import reportsScreenshot from '@/assets/screenshots/reports-view.png';
import patientsScreenshot from '@/assets/screenshots/patients-list.png';
import analyticsScreenshot from '@/assets/screenshots/analytics-dashboard.png';

interface FeaturesSectionProps {
  features: FeatureItem[];
}

const screenshots = [
  { src: billingScreenshot, alt: 'LabFlow billing interface with GST support and payment tracking', caption: 'Smart Billing & Invoicing' },
  { src: reportsScreenshot, alt: 'Professional lab report generation view', caption: 'Professional Lab Reports' },
  { src: patientsScreenshot, alt: 'Patient management list with search and filters', caption: 'Patient Management' },
  { src: analyticsScreenshot, alt: 'Analytics dashboard with revenue insights', caption: 'Real-time Analytics' },
];

const FeaturesSection = ({ features }: FeaturesSectionProps) => {
  const { t } = useTranslation();
  
  return (
    <section id="features" className="relative py-10 md:py-20 px-4">
      <div className="max-w-7xl mx-auto">
        <AnimatedSection className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass mb-4">
            <Zap className="h-5 w-5 text-accent" />
            <span className="text-sm font-medium text-foreground">{t('features.badge')}</span>
          </div>
          <h2 className="text-2xl md:text-4xl font-heading font-semibold mb-4 text-foreground">
            {t('features.title')}
            <span className="gradient-text"> {t('features.titleHighlight')}</span>
          </h2>
          <p className="text-base md:text-lg text-muted-foreground max-w-2xl mx-auto">
            {t('features.subtitle')}
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

        {/* Screenshot Grid */}
        <AnimatedSection animation="fade-up" delay={200} className="mt-16">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {screenshots.map((shot, i) => (
              <div key={i} className="group relative rounded-xl overflow-hidden border border-border/40 shadow-lg hover:shadow-xl transition-shadow duration-300">
                <img 
                  src={shot.src} 
                  alt={shot.alt} 
                  className="w-full h-auto group-hover:scale-[1.02] transition-transform duration-500" 
                  loading="lazy"
                  decoding="async"
                  width={640}
                  height={360}
                />
                <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-background/90 to-transparent p-4">
                  <span className="text-sm font-medium text-foreground">{shot.caption}</span>
                </div>
              </div>
            ))}
          </div>
        </AnimatedSection>
      </div>
    </section>
  );
};

export default FeaturesSection;
