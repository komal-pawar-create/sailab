import React from 'react';
import { useTranslation } from 'react-i18next';
import { Quote, Star } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from '@/components/ui/carousel';
import { AnimatedSection } from '@/components/AnimatedSection';
import type { TestimonialItem } from './types';

interface TestimonialsSectionProps {
  testimonials: TestimonialItem[];
}

const TestimonialsSection = ({ testimonials }: TestimonialsSectionProps) => {
  const { t } = useTranslation();
  
  return (
    <section id="testimonials" className="relative py-10 md:py-20 px-4">
      <div className="max-w-6xl mx-auto">
        <AnimatedSection className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass mb-4">
            <Quote className="h-5 w-5 text-primary" />
            <span className="text-sm font-medium text-foreground">{t('testimonials.badge')}</span>
          </div>
          <h2 className="text-2xl md:text-4xl font-heading font-semibold mb-4 text-foreground">
            {t('testimonials.title')}
            <span className="gradient-text"> {t('testimonials.titleHighlight')}</span>
          </h2>
          <p className="text-base md:text-lg text-muted-foreground max-w-2xl mx-auto">
            {t('testimonials.subtitle')}
          </p>
        </AnimatedSection>

        <AnimatedSection animation="blur" delay={200}>
          <Carousel
            opts={{
              align: "start",
              loop: true,
            }}
            className="w-full"
            aria-label="Customer testimonials carousel"
          >
            <CarouselContent className="-ml-4">
              {testimonials.map((testimonial, index) => (
                <CarouselItem key={index} className="pl-4 md:basis-1/2 lg:basis-1/3">
                  <Card className="glass hover-lift h-full p-6 flex flex-col focus-visible:ring-2 focus-visible:ring-primary" tabIndex={0}>
                    {/* Quote Icon */}
                    <Quote className="h-8 w-8 text-primary/30 mb-4" />
                    
                    {/* Star Rating */}
                    <div className="flex gap-1 mb-4">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star 
                          key={i} 
                          className={`h-4 w-4 ${i < testimonial.rating ? 'text-yellow-500 fill-yellow-500' : 'text-muted-foreground/30'}`} 
                        />
                      ))}
                    </div>
                    
                    {/* Testimonial Text */}
                    <p className="text-foreground/90 text-sm leading-relaxed flex-grow mb-6">
                      "{testimonial.testimonial_text}"
                    </p>
                    
                    {/* Author Info */}
                    <div className="flex items-center gap-3 pt-4 border-t border-border">
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-primary-foreground font-bold text-sm">
                        {testimonial.avatar_initials || testimonial.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <div className="font-semibold text-foreground">{testimonial.name}</div>
                        <div className="text-xs text-muted-foreground">{testimonial.role}</div>
                        <div className="text-xs text-primary">{testimonial.location}</div>
                      </div>
                    </div>
                  </Card>
                </CarouselItem>
              ))}
            </CarouselContent>
            <div className="flex justify-center gap-4 mt-8">
              <CarouselPrevious className="static translate-y-0 bg-background hover:bg-muted" />
              <CarouselNext className="static translate-y-0 bg-background hover:bg-muted" />
            </div>
          </Carousel>
        </AnimatedSection>
      </div>
    </section>
  );
};

export default TestimonialsSection;
