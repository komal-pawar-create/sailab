import React from 'react';
import { useTranslation } from 'react-i18next';
import { Shield, Lock, Clock, Award, Server, Headphones } from 'lucide-react';
import { AnimatedSection } from '@/components/AnimatedSection';

const TrustBadges = () => {
  const { t } = useTranslation();
  
  const badges = [
    {
      icon: Shield,
      titleKey: 'trust.hipaaCompliant',
      descKey: 'trust.hipaaDesc',
    },
    {
      icon: Lock,
      titleKey: 'trust.sslEncrypted',
      descKey: 'trust.sslDesc',
    },
    {
      icon: Server,
      titleKey: 'trust.uptime',
      descKey: 'trust.uptimeDesc',
    },
    {
      icon: Clock,
      titleKey: 'trust.backup',
      descKey: 'trust.backupDesc',
    },
    {
      icon: Award,
      titleKey: 'trust.isoCertified',
      descKey: 'trust.isoDesc',
    },
    {
      icon: Headphones,
      titleKey: 'trust.prioritySupport',
      descKey: 'trust.supportDesc',
    },
  ];

  return (
    <section className="py-12 px-4 border-y border-border/50 bg-muted/20">
      <div className="max-w-6xl mx-auto">
        <AnimatedSection className="text-center mb-8">
          <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
            {t('trust.headline')}
          </p>
        </AnimatedSection>
        
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
          {badges.map((badge, index) => (
            <AnimatedSection
              key={badge.titleKey}
              delay={index * 100}
              className="flex flex-col items-center text-center group"
            >
              <div className="w-12 h-12 rounded-xl bg-primary/5 flex items-center justify-center mb-3 group-hover:bg-primary/10 transition-colors">
                <badge.icon className="w-6 h-6 text-primary" />
              </div>
              <h3 className="text-sm font-semibold text-foreground mb-1">
                {t(badge.titleKey)}
              </h3>
              <p className="text-xs text-muted-foreground">
                {t(badge.descKey)}
              </p>
            </AnimatedSection>
          ))}
        </div>
      </div>
    </section>
  );
};

export default TrustBadges;
