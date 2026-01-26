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

const faqItems: FAQItem[] = [
  {
    question: 'How long does it take to set up LabFlow?',
    answer: 'Most labs are fully operational within 3 days. Day 1 covers account setup and basic configuration (about 30 minutes). Day 2 is for adding staff and customizing settings. Day 3, you\'re ready to go live with patient registrations and reporting.'
  },
  {
    question: 'Can I migrate my existing patient data?',
    answer: 'Yes! We offer free data migration assistance for all new customers. Our team can help import patient records, test history, and billing data from Excel sheets or other systems. The process typically takes 1-2 days depending on data volume.'
  },
  {
    question: 'What training is provided?',
    answer: 'We provide comprehensive training including: video tutorials for all features, live onboarding sessions for your team, 24/7 chat support, and detailed documentation. Most users become proficient within 2-3 days of regular use.'
  },
  {
    question: 'Is there a contract or commitment?',
    answer: 'No long-term contracts required. We offer flexible monthly and annual plans. Start with a 14-day free trial to experience all features. Cancel anytime with no hidden fees. Annual plans come with 2 months free.'
  },
  {
    question: 'What if I need help during setup?',
    answer: 'Our support team is available via chat, email, and phone during business hours. For critical issues, we offer priority support. Enterprise customers get a dedicated account manager for personalized assistance.'
  },
  {
    question: 'How secure is my patient data?',
    answer: 'Security is our top priority. We use bank-grade encryption (AES-256), regular automated backups, role-based access control, complete audit logs, and HIPAA-ready infrastructure. Your data is stored in SOC 2 certified data centers.'
  },
  {
    question: 'Can I use LabFlow on mobile devices?',
    answer: 'Yes! LabFlow is fully responsive and works on smartphones and tablets. We also offer a Progressive Web App (PWA) that you can install on your device for an app-like experience without downloading from app stores.'
  },
  {
    question: 'What happens if I exceed my plan limits?',
    answer: 'We\'ll notify you when approaching limits. You can easily upgrade your plan anytime to accommodate growth. There are no hidden overage charges - we believe in transparent pricing with no surprises.'
  }
];

const TourFAQ = () => {
  const { t } = useTranslation();
  
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
