import React from 'react';
import { Link } from 'react-router-dom';
import { HelpCircle, MessageCircle, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { AnimatedSection } from '@/components/AnimatedSection';
import type { FaqItem } from './types';

interface FAQSectionProps {
  faqs: FaqItem[];
}

const FAQSection = ({ faqs }: FAQSectionProps) => {
  return (
    <section id="faq" className="relative py-24 px-4">
      <div className="max-w-4xl mx-auto">
        <AnimatedSection className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass mb-4">
            <HelpCircle className="h-4 w-4 text-primary" />
            <span className="text-sm font-medium text-foreground">FAQ</span>
          </div>
          <h2 className="text-4xl md:text-5xl font-bold mb-4 text-foreground">
            Frequently Asked
            <span className="gradient-text"> Questions</span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Got questions? We've got answers. Find everything you need to know about Lab Master.
          </p>
        </AnimatedSection>

        <AnimatedSection animation="blur" delay={150}>
          <Accordion type="single" collapsible className="space-y-4">
            {faqs.map((faq, index) => (
              <AccordionItem 
                key={index} 
                value={`item-${index}`}
                className="glass rounded-xl px-6 border-none"
              >
                <AccordionTrigger className="text-left hover:no-underline py-5 gap-4">
                  <div className="flex items-start gap-3">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium shrink-0 mt-0.5 ${
                      faq.category === 'pricing' 
                        ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                        : faq.category === 'features'
                        ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400'
                        : 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400'
                    }`}>
                      {faq.category === 'pricing' ? '💰' : faq.category === 'features' ? '🔧' : '🛠️'}
                    </span>
                    <span className="font-medium text-foreground">{faq.question}</span>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground pb-5 pl-9">
                  {faq.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </AnimatedSection>

        {/* Still have questions CTA */}
        <AnimatedSection delay={300} className="mt-12 text-center">
          <div className="inline-flex flex-col sm:flex-row items-center gap-4 p-6 rounded-2xl glass">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-xl bg-primary/10">
                <MessageCircle className="h-6 w-6 text-primary" />
              </div>
              <div className="text-left">
                <p className="font-semibold text-foreground">Still have questions?</p>
                <p className="text-sm text-muted-foreground">Our team is here to help you</p>
              </div>
            </div>
            <Button asChild variant="outline" className="shrink-0">
              <Link to="/auth" className="flex items-center gap-2">
                Contact Support
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>
        </AnimatedSection>
      </div>
    </section>
  );
};

export default FAQSection;
