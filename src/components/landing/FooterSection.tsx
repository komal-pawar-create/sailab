import React from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Mail, Phone, MapPin, Linkedin, Twitter, Youtube } from 'lucide-react';
import type { FooterContent } from './types';

interface FooterSectionProps {
  footerContent: FooterContent | null;
}

const FooterSection = ({ footerContent }: FooterSectionProps) => {
  const { t } = useTranslation();
  
  const defaultNavLinks = [
    { labelKey: 'footer.features', href: '#features' },
    { labelKey: 'footer.pricing', href: '#pricing' },
    { labelKey: 'footer.demo', href: '#demo' },
    { labelKey: 'footer.productTour', href: '/product-tour' },
    { labelKey: 'Blog', href: '/blog' },
  ];

  const legalLinks = [
    { labelKey: 'footer.privacyPolicy', href: '/privacy-policy' },
    { labelKey: 'footer.termsOfService', href: '/terms-of-service' },
    { labelKey: 'footer.refundPolicy', href: '/refund-policy' },
  ];

  const socialLinks = [
    { icon: Twitter, href: '#', label: 'Twitter' },
    { icon: Linkedin, href: '#', label: 'LinkedIn' },
    { icon: Youtube, href: '#', label: 'YouTube' },
  ];

  return (
    <footer className="relative py-16 px-4 border-t border-border bg-muted/30" role="contentinfo">
      <div className="max-w-6xl mx-auto">
        {/* Main Footer Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 mb-12">
          {/* Brand Column */}
          <div className="lg:col-span-1">
            <Link to="/" className="flex items-center gap-2 mb-4 group">
              <img 
                src="/images/labflow-logo.png" 
                alt="LabFlow" 
                loading="lazy"
                className="h-10 w-auto"
              />
            </Link>
            <p className="text-sm text-muted-foreground mb-4 leading-relaxed">
              {t('footer.tagline')}
            </p>
            {/* Made in India Badge */}
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400 text-xs font-medium">
              <span aria-hidden="true">🇮🇳</span>
              <span>{t('footer.madeInIndia')}</span>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="font-semibold text-foreground mb-4">{t('footer.quickLinks')}</h3>
            <nav aria-label="Footer navigation">
              <ul className="space-y-3">
                {footerContent?.nav_links && footerContent.nav_links.length > 0 
                  ? footerContent.nav_links.map((link, index) => (
                      <li key={index}>
                        {link.href.startsWith('/') || link.href.startsWith('http') ? (
                          <Link 
                            to={link.href} 
                            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                          >
                            {link.label}
                          </Link>
                        ) : (
                          <a 
                            href={link.href} 
                            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                          >
                            {link.label}
                          </a>
                        )}
                      </li>
                    ))
                  : defaultNavLinks.map((link, index) => (
                      <li key={index}>
                        {link.href.startsWith('/') ? (
                          <Link 
                            to={link.href} 
                            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                          >
                            {t(link.labelKey)}
                          </Link>
                        ) : (
                          <a 
                            href={link.href} 
                            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                          >
                            {t(link.labelKey)}
                          </a>
                        )}
                      </li>
                    ))
                }
              </ul>
            </nav>
          </div>

          {/* Legal */}
          <div>
            <h3 className="font-semibold text-foreground mb-4">{t('footer.legal')}</h3>
            <ul className="space-y-3">
              {legalLinks.map((link, index) => (
                <li key={index}>
                  <Link
                    to={link.href}
                    className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {t(link.labelKey)}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="font-semibold text-foreground mb-4">{t('footer.contactUs')}</h3>
            <address className="not-italic space-y-3">
              <a 
                href="mailto:support@labflow.mywebz.in" 
                className="flex items-center gap-3 text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                <Mail className="h-4 w-4 flex-shrink-0" aria-hidden="true" />
                <span>support@labflow.mywebz.in</span>
              </a>
              <a 
                href="tel:+918888567870" 
                className="flex items-center gap-3 text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                <Phone className="h-4 w-4 flex-shrink-0" aria-hidden="true" />
                <span>+91 88885 67870</span>
              </a>
              <div className="flex items-start gap-3 text-sm text-muted-foreground">
                <MapPin className="h-4 w-4 flex-shrink-0 mt-0.5" aria-hidden="true" />
                <span>India</span>
              </div>
            </address>

            {/* Social Links */}
            <div className="flex items-center gap-3 mt-6">
              {socialLinks.map((social, index) => (
                <a
                  key={index}
                  href={social.href}
                  aria-label={social.label}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 rounded-lg bg-muted hover:bg-muted/80 text-muted-foreground hover:text-foreground transition-colors"
                >
                  <social.icon className="h-4 w-4" aria-hidden="true" />
                </a>
              ))}
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 border-t border-border flex flex-col sm:flex-row justify-between items-center gap-4">
          <p className="text-sm text-muted-foreground">
            © {new Date().getFullYear()} {footerContent?.brand_name || 'LabFlow'}. {t('footer.allRightsReserved')}
          </p>
          <p className="text-xs text-muted-foreground">
            LIMS Software for Pathology & Diagnostic Labs
          </p>
        </div>
      </div>
    </footer>
  );
};

export default FooterSection;
