import React from 'react';
import { useTranslation } from 'react-i18next';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Badge } from '@/components/ui/badge';
import { HelpCircle } from 'lucide-react';

interface FAQItem {
  question: string;
  answer: string;
}

const TourFAQ = () => {
  const { t } = useTranslation();
  
  // Get FAQ items from translations (returns array)
  const faqItems = t('productTour.tourFaq.items', { returnObjects: true }) as FAQItem[];
  
  return (
    <section className="py-20 px-4" aria-labelledby="faq-heading">
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-12">
          <Badge variant="secondary" className="mb-4">
            <HelpCircle className="h-3 w-3 mr-1" />
            {t('productTour.tourFaq.badge')}
          </Badge>
          <h2 id="faq-heading" className="text-3xl md:text-4xl font-bold mb-4">
            {t('productTour.tourFaq.title')} <span className="gradient-text">{t('productTour.tourFaq.titleHighlight')}</span>
          </h2>
          <p className="text-muted-foreground text-lg">
            {t('productTour.tourFaq.subtitle')}
          </p>
        </div>

        <Accordion type="single" collapsible className="space-y-4">
          {faqItems.map((item, index) => (
            <AccordionItem
              key={index}
              value={`item-${index}`}
              className="bg-muted/30 rounded-xl border-0 px-6"
            >
              <AccordionTrigger className="py-4 text-left hover:no-underline hover:text-primary transition-colors">
                {item.question}
              </AccordionTrigger>
              <AccordionContent className="pb-4 text-muted-foreground">
                {item.answer}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </section>
  );
};

export default TourFAQ;
