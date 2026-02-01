import React from 'react';
import { useTranslation } from 'react-i18next';
import { Globe } from 'lucide-react';
import { AnimatedSection } from '@/components/AnimatedSection';
import { Step } from './shared';
import type { StepItem } from './types';

interface HowItWorksSectionProps {
  steps: StepItem[];
}

const HowItWorksSection = ({ steps }: HowItWorksSectionProps) => {
  const { t } = useTranslation();
  
  return (
    <>
      <section id="how-it-works" />
      <section className="relative py-10 md:py-20 px-4 bg-muted/30">
        <div className="max-w-4xl mx-auto">
          <AnimatedSection className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass mb-4">
              <Globe className="h-5 w-5 text-primary" />
              <span className="text-sm font-medium text-foreground">{t('howItWorks.badge')}</span>
            </div>
            <h2 className="text-2xl md:text-4xl font-heading font-semibold mb-4 text-foreground">
              {t('howItWorks.title')}
              <span className="gradient-text"> {t('howItWorks.titleHighlight')}</span>
            </h2>
            <p className="text-base md:text-lg text-muted-foreground">
              {t('howItWorks.subtitle')}
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
    </>
  );
};

export default HowItWorksSection;
