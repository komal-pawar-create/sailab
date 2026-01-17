import React from 'react';
import { Link } from 'react-router-dom';
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
  title: string;
  description: string;
  features: string[];
  buttonText: string;
  buttonVariant: 'default' | 'outline' | 'secondary';
  href: string;
  highlighted?: boolean;
}

const ctaOptions: CTAOption[] = [
  {
    id: 'trial',
    icon: <Rocket className="h-8 w-8" />,
    title: 'Start Free Trial',
    description: 'Try Lab Master free for 14 days with full access',
    features: [
      'No credit card required',
      'Full feature access',
      'Free data migration help',
      'Email & chat support'
    ],
    buttonText: 'Start Free Trial',
    buttonVariant: 'default',
    href: '/auth',
    highlighted: true
  },
  {
    id: 'demo',
    icon: <Users className="h-8 w-8" />,
    title: 'Schedule a Demo',
    description: 'Get a personalized walkthrough from our team',
    features: [
      '30-minute live demo',
      'Q&A with product expert',
      'Custom setup guidance',
      'No obligations'
    ],
    buttonText: 'Book a Demo',
    buttonVariant: 'outline',
    href: 'mailto:sales@labmaster.in?subject=Demo Request'
  },
  {
    id: 'enterprise',
    icon: <Building2 className="h-8 w-8" />,
    title: 'Enterprise Solution',
    description: 'Custom solutions for laboratory chains',
    features: [
      'Multi-location support',
      'Custom integrations',
      'Dedicated account manager',
      'Volume discounts'
    ],
    buttonText: 'Contact Sales',
    buttonVariant: 'secondary',
    href: 'mailto:enterprise@labmaster.in?subject=Enterprise Inquiry'
  }
];

const TourCTA = () => {
  return (
    <section className="py-20 px-4 bg-gradient-to-b from-background to-muted/30" aria-labelledby="cta-heading">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <Badge variant="secondary" className="mb-4">Get Started</Badge>
          <h2 id="cta-heading" className="text-3xl md:text-4xl font-bold mb-4">
            Ready to Transform Your <span className="gradient-text">Laboratory?</span>
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Choose the path that works best for you and your team
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6 mb-12">
          {ctaOptions.map((option) => (
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
                  Most Popular
                </div>
              )}
              <CardHeader className="text-center pb-4">
                <div className={`mx-auto p-4 rounded-2xl mb-4 ${
                  option.highlighted ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'
                }`}>
                  {option.icon}
                </div>
                <CardTitle className="text-xl">{option.title}</CardTitle>
                <CardDescription>{option.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3 mb-6">
                  {option.features.map((feature, index) => (
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
                      {option.buttonText}
                      <ArrowRight className="h-4 w-4" />
                    </a>
                  ) : (
                    <Link to={option.href} className="flex items-center justify-center gap-2">
                      {option.buttonText}
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                  )}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Contact info */}
        <div className="text-center">
          <p className="text-muted-foreground mb-4">Have questions? We're here to help.</p>
          <div className="flex flex-wrap justify-center gap-6">
            <a
              href="tel:+919876543210"
              className="flex items-center gap-2 text-foreground hover:text-primary transition-colors"
            >
              <Phone className="h-4 w-4" />
              +91 98765 43210
            </a>
            <a
              href="mailto:support@labmaster.in"
              className="flex items-center gap-2 text-foreground hover:text-primary transition-colors"
            >
              <Mail className="h-4 w-4" />
              support@labmaster.in
            </a>
            <a
              href="#"
              className="flex items-center gap-2 text-foreground hover:text-primary transition-colors"
            >
              <Calendar className="h-4 w-4" />
              Book a Call
            </a>
          </div>
        </div>
      </div>
    </section>
  );
};

export default TourCTA;
