import React from 'react';
import { useTranslation } from 'react-i18next';
import { Zap } from 'lucide-react';
import { AnimatedSection, AnimatedItems } from '@/components/AnimatedSection';
import { FeatureCard } from './shared';
import type { FeatureItem } from './types';

interface FeaturesSectionProps {
  features: FeatureItem[];
}

const FeaturesSection = ({ features }: FeaturesSectionProps) => {
  const { t } = useTranslation();
  
  return (
    <section id="features" className="relative py-24 px-4">
      <div className="max-w-7xl mx-auto">
        <AnimatedSection className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass mb-4">
            <Zap className="h-4 w-4 text-accent" />
            <span className="text-sm font-medium text-foreground">{t('features.badge')}</span>
          </div>
          <h2 className="text-4xl md:text-5xl font-bold mb-4 text-foreground">
            {t('features.title')}
            <span className="gradient-text"> {t('features.titleHighlight')}</span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
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
      </div>
    </section>
  );
};

export default FeaturesSection;
