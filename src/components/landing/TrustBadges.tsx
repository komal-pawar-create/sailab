import React from 'react';
import { Shield, Lock, Clock, Award, Server, Headphones } from 'lucide-react';
import { AnimatedSection } from '@/components/AnimatedSection';

const badges = [
  {
    icon: Shield,
    title: 'HIPAA Compliant',
    description: 'Healthcare data protection',
  },
  {
    icon: Lock,
    title: 'SSL Encrypted',
    description: '256-bit encryption',
  },
  {
    icon: Server,
    title: '99.9% Uptime',
    description: 'Enterprise reliability',
  },
  {
    icon: Clock,
    title: '24/7 Backup',
    description: 'Automated daily backups',
  },
  {
    icon: Award,
    title: 'ISO Certified',
    description: 'Quality management',
  },
  {
    icon: Headphones,
    title: 'Priority Support',
    description: 'Dedicated assistance',
  },
];

const TrustBadges = () => {
  return (
    <section className="py-12 px-4 border-y border-border/50 bg-muted/20">
      <div className="max-w-6xl mx-auto">
        <AnimatedSection className="text-center mb-8">
          <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
            Trusted by 500+ Labs Across India
          </p>
        </AnimatedSection>
        
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
          {badges.map((badge, index) => (
            <AnimatedSection
              key={badge.title}
              delay={index * 100}
              className="flex flex-col items-center text-center group"
            >
              <div className="w-12 h-12 rounded-xl bg-primary/5 flex items-center justify-center mb-3 group-hover:bg-primary/10 transition-colors">
                <badge.icon className="w-6 h-6 text-primary" />
              </div>
              <h3 className="text-sm font-semibold text-foreground mb-1">
                {badge.title}
              </h3>
              <p className="text-xs text-muted-foreground">
                {badge.description}
              </p>
            </AnimatedSection>
          ))}
        </div>
      </div>
    </section>
  );
};

export default TrustBadges;
