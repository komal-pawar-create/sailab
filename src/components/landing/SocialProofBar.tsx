import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Users, TrendingUp, Star, Activity } from 'lucide-react';

interface StatItem {
  icon: React.ElementType;
  value: string;
  label: string;
  suffix?: string;
}

const stats: StatItem[] = [
  { icon: Users, value: '500', suffix: '+', label: 'Active Labs' },
  { icon: Activity, value: '2.5', suffix: 'M+', label: 'Tests Processed' },
  { icon: Star, value: '4.9', label: 'User Rating' },
  { icon: TrendingUp, value: '99.9', suffix: '%', label: 'Uptime' },
];

const SocialProofBar = () => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      // Show after scrolling past hero section (approximately 400px)
      setIsVisible(window.scrollY > 400);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <motion.div
      initial={{ y: -100, opacity: 0 }}
      animate={{ y: isVisible ? 0 : -100, opacity: isVisible ? 1 : 0 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
      className="fixed top-16 left-0 right-0 z-40 bg-background/80 backdrop-blur-lg border-b border-border/50 py-2 px-4 hidden lg:block"
    >
      <div className="max-w-6xl mx-auto flex items-center justify-center gap-8">
        {stats.map((stat, index) => (
          <div key={stat.label} className="flex items-center gap-2">
            <stat.icon className="w-4 h-4 text-primary" />
            <span className="font-bold text-foreground">
              {stat.value}{stat.suffix}
            </span>
            <span className="text-sm text-muted-foreground">
              {stat.label}
            </span>
            {index < stats.length - 1 && (
              <span className="ml-6 h-4 w-px bg-border" />
            )}
          </div>
        ))}
      </div>
    </motion.div>
  );
};

export default SocialProofBar;
