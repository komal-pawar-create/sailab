import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { CreditCard, Building2, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { AnimatedSection, AnimatedItems } from '@/components/AnimatedSection';
import { PricingCard } from './shared';
import InquiryDialog from '@/components/InquiryDialog';
import type { PricingPlan } from './types';

interface PricingSectionProps {
  pricingPlans: PricingPlan[];
}

const PricingSection = ({ pricingPlans }: PricingSectionProps) => {
  const { t } = useTranslation();
  const [inquiryDialogOpen, setInquiryDialogOpen] = useState(false);
  
  return (
    <section id="pricing" className="relative py-24 px-4 bg-muted/30">
      <div className="max-w-6xl mx-auto">
        <AnimatedSection className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass mb-4">
            <CreditCard className="h-4 w-4 text-primary" />
            <span className="text-sm font-medium text-foreground">{t('pricing.badge')}</span>
          </div>
          <h2 className="text-4xl md:text-5xl font-bold mb-4 text-foreground">
            {t('pricing.title')}
            <span className="gradient-text"> {t('pricing.titleHighlight')}</span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            {t('pricing.subtitle')}
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
              onEnterpriseClick={plan.isEnterprise ? () => setInquiryDialogOpen(true) : undefined}
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
                <p className="font-semibold text-foreground">{t('pricing.multiLabTitle')}</p>
                <p className="text-sm text-muted-foreground">{t('pricing.multiLabSubtitle')}</p>
              </div>
            </div>
            <Button variant="outline" className="shrink-0" onClick={() => setInquiryDialogOpen(true)}>
              <span className="flex items-center gap-2">
                {t('pricing.customQuote')}
                <ArrowRight className="h-4 w-4" />
              </span>
            </Button>
          </div>
        </AnimatedSection>
      </div>

      {/* Inquiry Dialog */}
      <InquiryDialog
        open={inquiryDialogOpen}
        onOpenChange={setInquiryDialogOpen}
        title={t('pricing.customQuote')}
        context="Custom Quote - Multi-Lab Inquiry"
      />
    </section>
  );
};

export default PricingSection;
