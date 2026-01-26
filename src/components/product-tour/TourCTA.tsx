import React from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Rocket, 
  Users, 
  Building2, 
  ArrowRight, 
  CheckCircle2,
  Phone,
  Mail,
  Calendar
} from 'lucide-react';

interface CTAOption {
  id: string;
  icon: React.ReactNode;
  titleKey: string;
  descriptionKey: string;
  featuresKey: string;
  buttonTextKey: string;
  buttonVariant: 'default' | 'outline' | 'secondary';
  href: string;
  highlighted?: boolean;
}

const ctaOptions: CTAOption[] = [
  {
    id: 'trial',
    icon: <Rocket className="h-8 w-8" />,
    titleKey: 'productTour.tourCta.startTrial.title',
    descriptionKey: 'productTour.tourCta.startTrial.description',
    featuresKey: 'productTour.tourCta.startTrial.features',
    buttonTextKey: 'productTour.tourCta.startTrial.button',
    buttonVariant: 'default',
    href: '/auth',
    highlighted: true
  },
  {
    id: 'demo',
    icon: <Users className="h-8 w-8" />,
    titleKey: 'productTour.tourCta.scheduleDemo.title',
    descriptionKey: 'productTour.tourCta.scheduleDemo.description',
    featuresKey: 'productTour.tourCta.scheduleDemo.features',
    buttonTextKey: 'productTour.tourCta.scheduleDemo.button',
    buttonVariant: 'outline',
    href: 'mailto:sales@labflow.mywebz.in?subject=Demo Request'
  },
  {
    id: 'enterprise',
    icon: <Building2 className="h-8 w-8" />,
    titleKey: 'productTour.tourCta.enterprise.title',
    descriptionKey: 'productTour.tourCta.enterprise.description',
    featuresKey: 'productTour.tourCta.enterprise.features',
    buttonTextKey: 'productTour.tourCta.enterprise.button',
    buttonVariant: 'secondary',
    href: 'mailto:enterprise@labflow.mywebz.in?subject=Enterprise Inquiry'
  }
];

const TourCTA = () => {
  const { t } = useTranslation();
  
  return (
    <section className="py-20 px-4 bg-gradient-to-b from-background to-muted/30" aria-labelledby="cta-heading">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <Badge variant="secondary" className="mb-4">{t('productTour.tourCta.badge')}</Badge>
          <h2 id="cta-heading" className="text-3xl md:text-4xl font-bold mb-4">
            {t('productTour.tourCta.title')} <span className="gradient-text">{t('productTour.tourCta.titleHighlight')}</span>
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            {t('productTour.tourCta.subtitle')}
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6 mb-12">
          {ctaOptions.map((option) => {
            const features = t(option.featuresKey, { returnObjects: true }) as string[];
            return (
              <Card
                key={option.id}
                className={`relative overflow-hidden transition-all hover-lift ${
                  option.highlighted
                    ? 'border-primary shadow-lg shadow-primary/10'
                    : 'glass border-0'
                }`}
              >
                {option.highlighted && (
                  <div className="absolute top-0 right-0 px-3 py-1 bg-primary text-primary-foreground text-xs font-medium rounded-bl-lg">
                    {t('productTour.tourCta.mostPopular')}
                  </div>
                )}
                <CardHeader className="text-center pb-4">
                  <div className={`mx-auto p-4 rounded-2xl mb-4 ${
                    option.highlighted ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'
                  }`}>
                    {option.icon}
                  </div>
                  <CardTitle className="text-xl">{t(option.titleKey)}</CardTitle>
                  <CardDescription>{t(option.descriptionKey)}</CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-3 mb-6">
                    {Array.isArray(features) && features.map((feature, index) => (
                      <li key={index} className="flex items-center gap-2 text-sm">
                        <CheckCircle2 className="h-4 w-4 text-primary flex-shrink-0" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                  <Button
                    variant={option.buttonVariant}
                    className="w-full"
                    asChild
                  >
                    {option.href.startsWith('mailto:') ? (
                      <a href={option.href} className="flex items-center justify-center gap-2">
                        {t(option.buttonTextKey)}
                        <ArrowRight className="h-4 w-4" />
                      </a>
                    ) : (
                      <Link to={option.href} className="flex items-center justify-center gap-2">
                        {t(option.buttonTextKey)}
                        <ArrowRight className="h-4 w-4" />
                      </Link>
                    )}
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Contact info */}
        <div className="text-center">
          <p className="text-muted-foreground mb-4">{t('productTour.tourCta.haveQuestions')}</p>
          <div className="flex flex-wrap justify-center gap-6">
            <a
              href="tel:+919876543210"
              className="flex items-center gap-2 text-foreground hover:text-primary transition-colors"
            >
              <Phone className="h-4 w-4" />
              +91 98765 43210
            </a>
            <a
              href="mailto:support@labflow.mywebz.in"
              className="flex items-center gap-2 text-foreground hover:text-primary transition-colors"
            >
              <Mail className="h-4 w-4" />
              support@labflow.mywebz.in
            </a>
            <a
              href="#"
              className="flex items-center gap-2 text-foreground hover:text-primary transition-colors"
            >
              <Calendar className="h-4 w-4" />
              {t('productTour.tourCta.bookCall')}
            </a>
          </div>
        </div>
      </div>
    </section>
  );
};

export default TourCTA;
