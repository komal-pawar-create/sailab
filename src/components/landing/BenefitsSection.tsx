import React from 'react';
import { useTranslation } from 'react-i18next';
import { HeartHandshake, CheckCircle2, TestTube, CreditCard, Users } from 'lucide-react';
import { AnimatedSection } from '@/components/AnimatedSection';
import type { BenefitItem, SectionContent } from './types';

interface BenefitsSectionProps {
  benefits: BenefitItem[];
  sectionContent: SectionContent;
}

const BenefitsSection = ({ benefits, sectionContent }: BenefitsSectionProps) => {
  const { t } = useTranslation();
  
  const defaultBenefits = [
    { id: '1', benefit_text: 'HIPAA-compliant security with role-based access' },
    { id: '2', benefit_text: 'Multi-branch support with centralized management' },
    { id: '3', benefit_text: 'Real-time analytics and AI-powered insights' },
    { id: '4', benefit_text: 'Professional billing with GST and ledger tracking' },
    { id: '5', benefit_text: 'PWA support — works offline, installs like an app' }
  ];

  return (
    <>
      <section id="benefits" />
      <section className="relative py-24 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <AnimatedSection animation="fade-left">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass mb-4">
                <HeartHandshake className="h-4 w-4 text-primary" />
                <span className="text-sm font-medium text-foreground">
                  {sectionContent?.benefits_badge || t('benefits.badge')}
                </span>
              </div>
              <h2 className="text-4xl md:text-5xl font-bold mb-6 text-foreground">
                {sectionContent?.benefits_title || t('benefits.title')}
                <span className="gradient-text"> {sectionContent?.benefits_title_highlight || t('benefits.titleHighlight')}</span>
              </h2>
              <p className="text-xl text-muted-foreground mb-8">
                {sectionContent?.benefits_subtitle || t('benefits.subtitle')}
              </p>
              
              <div className="space-y-4">
                {(benefits.length > 0 ? benefits : defaultBenefits).map((benefit, index) => (
                  <div key={benefit.id} className="flex items-start gap-3 scroll-animate visible" style={{ transitionDelay: `${index * 100}ms` }}>
                    <CheckCircle2 className="h-6 w-6 text-primary flex-shrink-0 mt-0.5" />
                    <span className="text-foreground">{benefit.benefit_text}</span>
                  </div>
                ))}
              </div>
            </AnimatedSection>

            <AnimatedSection animation="fade-right" delay={200} className="relative">
              <div className="glass-strong rounded-3xl p-8 animate-float">
                <div className="space-y-6">
                  <div className="flex items-center justify-between p-4 rounded-xl bg-primary/5">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                        <TestTube className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <div className="font-medium text-foreground">Blood Test Report</div>
                        <div className="text-sm text-muted-foreground">Patient: John Doe</div>
                      </div>
                    </div>
                    <span className="px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">Completed</span>
                  </div>
                  
                  <div className="flex items-center justify-between p-4 rounded-xl bg-accent/5">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-accent/20 flex items-center justify-center">
                        <CreditCard className="h-5 w-5 text-accent" />
                      </div>
                      <div>
                        <div className="font-medium text-foreground">Invoice #2024-0142</div>
                        <div className="text-sm text-muted-foreground">₹2,450.00</div>
                      </div>
                    </div>
                    <span className="px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700">Paid</span>
                  </div>
                  
                  <div className="flex items-center justify-between p-4 rounded-xl bg-primary/5">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                        <Users className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <div className="font-medium text-foreground">New Patient</div>
                        <div className="text-sm text-muted-foreground">Registration complete</div>
                      </div>
                    </div>
                    <span className="px-3 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-700">New</span>
                  </div>
                </div>
              </div>
              
              {/* Decorative elements */}
              <div className="absolute -top-4 -right-4 w-24 h-24 bg-primary/10 rounded-full blur-2xl" />
              <div className="absolute -bottom-4 -left-4 w-32 h-32 bg-accent/10 rounded-full blur-2xl" />
            </AnimatedSection>
          </div>
        </div>
      </section>
    </>
  );
};

export default BenefitsSection;
