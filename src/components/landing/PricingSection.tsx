import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { CreditCard, Building2, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { AnimatedSection, AnimatedItems } from '@/components/AnimatedSection';
import { PricingCard } from './shared';
import InquiryDialog from '@/components/InquiryDialog';
import { cn } from '@/lib/utils';
import type { PricingPlan, BillingPeriod } from './types';

interface PricingSectionProps {
  pricingPlans: PricingPlan[];
}

const billingOptions = [
  { value: 'monthly' as BillingPeriod, label: 'Monthly', discount: 0, badge: null },
  { value: 'yearly' as BillingPeriod, label: 'Yearly', discount: 20, badge: 'Save 20%' },
  { value: '3-year' as BillingPeriod, label: '3 Years', discount: 40, badge: 'Save 40%' },
];

const PricingSection = ({ pricingPlans }: PricingSectionProps) => {
  const { t } = useTranslation();
  const [inquiryDialogOpen, setInquiryDialogOpen] = useState(false);
  const [billingPeriod, setBillingPeriod] = useState<BillingPeriod>('monthly');
  
  return (
    <section id="pricing" className="relative py-10 md:py-20 px-4 bg-muted/30">
      <div className="max-w-6xl mx-auto">
        <AnimatedSection className="text-center mb-8">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass mb-4">
            <CreditCard className="h-5 w-5 text-primary" />
            <span className="text-sm font-medium text-foreground">{t('pricing.badge')}</span>
          </div>
          <h2 className="text-2xl md:text-4xl font-heading font-semibold mb-4 text-foreground">
            {t('pricing.title')}
            <span className="gradient-text"> {t('pricing.titleHighlight')}</span>
          </h2>
          <p className="text-base md:text-lg text-muted-foreground max-w-2xl mx-auto">
            {t('pricing.subtitle')}
          </p>
        </AnimatedSection>

        {/* Billing Period Toggle */}
        <AnimatedSection delay={100} className="flex justify-center mb-12">
          <div className="inline-flex items-center gap-1 p-1.5 bg-muted rounded-full border border-border">
            {billingOptions.map((option) => (
              <button
                key={option.value}
                onClick={() => setBillingPeriod(option.value)}
                className={cn(
                  "relative px-4 py-2 rounded-full text-sm font-medium transition-all duration-300",
                  billingPeriod === option.value
                    ? "bg-primary text-primary-foreground shadow-md"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted-foreground/10"
                )}
              >
                <span className="flex items-center gap-1.5">
                  {option.label}
                  {option.badge && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-accent text-accent-foreground font-semibold">
                      {option.badge}
                    </span>
                  )}
                </span>
              </button>
            ))}
          </div>
        </AnimatedSection>

        <AnimatedItems 
          animation="scale" 
          staggerDelay={150} 
          className="grid grid-cols-1 md:grid-cols-3 gap-8 items-start pt-6"
        >
          {pricingPlans.map((plan) => (
            <PricingCard 
              key={plan.name}
              plan={plan}
              billingPeriod={billingPeriod}
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
        source="pricing_enterprise"
      />
    </section>
  );
};

export default PricingSection;
