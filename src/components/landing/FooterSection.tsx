import React from 'react';
import { Link } from 'react-router-dom';
import { TestTube, Mail, Phone, MapPin, Linkedin, Twitter, Youtube } from 'lucide-react';
import type { FooterContent } from './types';

interface FooterSectionProps {
  footerContent: FooterContent | null;
}

const FooterSection = ({ footerContent }: FooterSectionProps) => {
  const defaultNavLinks = [
    { label: 'Features', href: '#features' },
    { label: 'Pricing', href: '#pricing' },
    { label: 'FAQ', href: '#faq' },
    { label: 'Login', href: '/auth' },
  ];

  const legalLinks = [
    { label: 'Privacy Policy', href: '#' },
    { label: 'Terms of Service', href: '#' },
    { label: 'Cookie Policy', href: '#' },
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
            <Link to="/" className="flex items-center gap-3 mb-4 group">
              <div className="p-2 rounded-xl bg-primary/10">
                <TestTube className="h-6 w-6 text-primary" aria-hidden="true" />
              </div>
              <span className="text-xl font-bold text-foreground">
                {footerContent?.brand_name || 'Lab Master'}
              </span>
            </Link>
            <p className="text-sm text-muted-foreground mb-4 leading-relaxed">
              Complete laboratory management system trusted by 500+ labs across India.
            </p>
            {/* Made in India Badge */}
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400 text-xs font-medium">
              <span aria-hidden="true">🇮🇳</span>
              <span>Made in India</span>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="font-semibold text-foreground mb-4">Quick Links</h3>
            <nav aria-label="Footer navigation">
              <ul className="space-y-3">
                {(footerContent?.nav_links && footerContent.nav_links.length > 0 
                  ? footerContent.nav_links 
                  : defaultNavLinks
                ).map((link, index) => (
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
                ))}
              </ul>
            </nav>
          </div>

          {/* Legal */}
          <div>
            <h3 className="font-semibold text-foreground mb-4">Legal</h3>
            <ul className="space-y-3">
              {legalLinks.map((link, index) => (
                <li key={index}>
                  <a 
                    href={link.href} 
                    className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="font-semibold text-foreground mb-4">Contact Us</h3>
            <address className="not-italic space-y-3">
              <a 
                href="mailto:support@labmaster.in" 
                className="flex items-center gap-3 text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                <Mail className="h-4 w-4 flex-shrink-0" aria-hidden="true" />
                <span>support@labmaster.in</span>
              </a>
              <a 
                href="tel:+919876543210" 
                className="flex items-center gap-3 text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                <Phone className="h-4 w-4 flex-shrink-0" aria-hidden="true" />
                <span>+91 98765 43210</span>
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
            © {new Date().getFullYear()} {footerContent?.brand_name || 'Lab Master'}. All rights reserved.
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
