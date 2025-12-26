import React from 'react';
import { useScrollAnimation } from '@/hooks/useScrollAnimation';
import { cn } from '@/lib/utils';

type AnimationType = 'fade-up' | 'fade-left' | 'fade-right' | 'scale' | 'blur';

interface AnimatedSectionProps {
  children: React.ReactNode;
  animation?: AnimationType;
  delay?: number;
  className?: string;
  threshold?: number;
}

const animationClasses: Record<AnimationType, { base: string; visible: string }> = {
  'fade-up': { base: 'scroll-animate', visible: 'visible' },
  'fade-left': { base: 'scroll-animate-left', visible: 'visible' },
  'fade-right': { base: 'scroll-animate-right', visible: 'visible' },
  'scale': { base: 'scroll-animate-scale', visible: 'visible' },
  'blur': { base: 'scroll-animate-blur', visible: 'visible' },
};

export const AnimatedSection: React.FC<AnimatedSectionProps> = ({
  children,
  animation = 'fade-up',
  delay = 0,
  className,
  threshold = 0.1,
}) => {
  const { ref, isVisible } = useScrollAnimation<HTMLDivElement>({ threshold });
  const { base, visible } = animationClasses[animation];

  return (
    <div
      ref={ref}
      className={cn(base, isVisible && visible, className)}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {children}
    </div>
  );
};

// For animating multiple items with staggered delays
interface AnimatedItemsProps {
  children: React.ReactNode[];
  animation?: AnimationType;
  staggerDelay?: number;
  className?: string;
  itemClassName?: string;
  threshold?: number;
}

export const AnimatedItems: React.FC<AnimatedItemsProps> = ({
  children,
  animation = 'fade-up',
  staggerDelay = 100,
  className,
  itemClassName,
  threshold = 0.1,
}) => {
  const { ref, isVisible } = useScrollAnimation<HTMLDivElement>({ threshold });
  const { base, visible } = animationClasses[animation];

  return (
    <div ref={ref} className={className}>
      {React.Children.map(children, (child, index) => (
        <div
          className={cn(base, isVisible && visible, itemClassName)}
          style={{ transitionDelay: `${index * staggerDelay}ms` }}
        >
          {child}
        </div>
      ))}
    </div>
  );
};

export default AnimatedSection;
