import React from 'react';
import { Link } from 'react-router-dom';
import { TestTube } from 'lucide-react';
import type { FooterContent } from './types';

interface FooterSectionProps {
  footerContent: FooterContent | null;
}

const FooterSection = ({ footerContent }: FooterSectionProps) => {
  const defaultNavLinks = [
    { label: 'Features', href: '#features' },
    { label: 'Login', href: '/auth' },
    { label: 'Privacy', href: '#' },
    { label: 'Terms', href: '#' }
  ];

  return (
    <footer className="relative py-12 px-4 border-t border-border">
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-primary/10">
              <TestTube className="h-6 w-6 text-primary" />
            </div>
            <span className="text-xl font-bold text-foreground">
              {footerContent?.brand_name || 'Lab Master'}
            </span>
          </div>
          
          <div className="flex items-center gap-8 text-sm text-muted-foreground">
            {(footerContent?.nav_links && footerContent.nav_links.length > 0 
              ? footerContent.nav_links 
              : defaultNavLinks
            ).map((link, index) => (
              link.href.startsWith('/') || link.href.startsWith('http') ? (
                <Link key={index} to={link.href} className="hover:text-foreground transition-colors">
                  {link.label}
                </Link>
              ) : (
                <a key={index} href={link.href} className="hover:text-foreground transition-colors">
                  {link.label}
                </a>
              )
            ))}
          </div>
          
          <p className="text-sm text-muted-foreground">
            {footerContent?.copyright_text || `© ${new Date().getFullYear()} Lab Master. All rights reserved.`}
          </p>
        </div>
      </div>
    </footer>
  );
};

export default FooterSection;
