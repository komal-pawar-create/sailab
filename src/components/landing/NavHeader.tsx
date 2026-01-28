import React, { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useTheme } from 'next-themes';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Menu, X, Sun, Moon, Calendar } from 'lucide-react';
import LanguageSelector from './LanguageSelector';
import InquiryDialog from '@/components/InquiryDialog';
interface NavHeaderProps {
  scrollY: number;
}

const NavHeader = ({ scrollY }: NavHeaderProps) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [inquiryDialogOpen, setInquiryDialogOpen] = useState(false);
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const { t } = useTranslation();
  const isScrolled = scrollY > 50;

  // Prevent hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

  // Close mobile menu on escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMobileMenuOpen(false);
    };
    if (mobileMenuOpen) {
      document.addEventListener('keydown', handleEscape);
      // Prevent body scroll when menu is open
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = '';
    };
  }, [mobileMenuOpen]);

  const navLinks = [
    { href: '#demo', labelKey: 'nav.demo' },
    { href: '#features', labelKey: 'nav.features' },
    { href: '/product-tour', labelKey: 'nav.productTour', isRoute: true },
    { href: '#pricing', labelKey: 'nav.pricing' },
    { href: '#faq', labelKey: 'nav.faq' },
  ];

  const toggleTheme = useCallback(() => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  }, [theme, setTheme]);

  const handleSmoothScroll = useCallback((e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    e.preventDefault();
    const target = document.querySelector(href);
    if (target) {
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
    setMobileMenuOpen(false);
  }, []);

  return (
    <>
      <header 
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          isScrolled 
            ? 'glass-strong shadow-lg py-3' 
            : 'bg-transparent py-5'
        }`}
        role="banner"
      >
        <div className="max-w-7xl mx-auto px-4 flex items-center justify-between">
          {/* Logo - Maximum prominence with animated glow and scroll shrink */}
          <Link to="/" className="flex items-center gap-3 group relative" aria-label="LabFlow - Home">
            <div className="relative transition-all duration-500 ease-out">
              {/* Animated glow effect - fades when scrolled */}
              <div 
                className={`absolute inset-0 bg-gradient-to-r from-primary/30 via-primary/20 to-primary/30 blur-2xl -z-10 rounded-full scale-150 animate-pulse group-hover:from-primary/40 group-hover:via-primary/30 group-hover:to-primary/40 transition-all duration-500 ${
                  isScrolled ? 'opacity-50 scale-100' : 'opacity-100 scale-150'
                }`} 
                aria-hidden="true" 
              />
              <img 
                src="/images/labflow-logo.png" 
                alt="LabFlow" 
                className={`w-auto group-hover:scale-105 transition-all duration-500 ease-out ${
                  isScrolled 
                    ? 'h-10 md:h-12 lg:h-14 drop-shadow-lg' 
                    : 'h-16 md:h-20 lg:h-24 drop-shadow-xl'
                }`}
              />
            </div>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-8" aria-label="Main navigation">
            {navLinks.map((link) => (
              link.isRoute ? (
                <Link
                  key={link.href}
                  to={link.href}
                  className={`text-sm font-medium transition-colors duration-300 hover:text-primary relative group ${
                    isScrolled ? 'text-foreground' : 'text-foreground'
                  }`}
                >
                  {t(link.labelKey)}
                  <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-primary transition-all duration-300 group-hover:w-full" aria-hidden="true" />
                </Link>
              ) : (
                <a
                  key={link.href}
                  href={link.href}
                  onClick={(e) => handleSmoothScroll(e, link.href)}
                  className={`text-sm font-medium transition-colors duration-300 hover:text-primary relative group ${
                    isScrolled ? 'text-foreground' : 'text-foreground'
                  }`}
                >
                  {t(link.labelKey)}
                  <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-primary transition-all duration-300 group-hover:w-full" aria-hidden="true" />
                </a>
              )
            ))}
          </nav>

          {/* Desktop CTA */}
          <div className="hidden md:flex items-center gap-3">
            {/* Language Selector */}
            <LanguageSelector isScrolled={isScrolled} />
            
            {/* Dark Mode Toggle */}
            <button
              onClick={toggleTheme}
              className={`p-2 rounded-lg transition-all duration-300 hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 ${
                isScrolled ? 'bg-muted/50' : 'bg-background/50 backdrop-blur-sm'
              }`}
              aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
            >
              {mounted && (
                theme === 'dark' ? (
                  <Sun className="h-5 w-5 text-foreground" aria-hidden="true" />
                ) : (
                  <Moon className="h-5 w-5 text-foreground" aria-hidden="true" />
                )
              )}
            </button>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => setInquiryDialogOpen(true)}
              className="flex items-center gap-2"
            >
              <Calendar className="h-4 w-4" />
              {t('nav.bookDemo')}
            </Button>
            <Button variant="ghost" asChild className="text-sm">
              <Link to="/auth">{t('nav.login')}</Link>
            </Button>
            <Button asChild size="sm" className={`transition-all duration-300 active:scale-95 ${
              isScrolled ? '' : 'shadow-lg'
            }`}>
              <Link to="/auth">{t('nav.getStarted')}</Link>
            </Button>
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden flex items-center gap-2">
            {/* Language Selector - Mobile */}
            <LanguageSelector isScrolled={isScrolled} />
            
            {/* Dark Mode Toggle - Mobile */}
            <button
              onClick={toggleTheme}
              className="p-2.5 rounded-lg hover:bg-muted transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
            >
              {mounted && (
                theme === 'dark' ? (
                  <Sun className="h-5 w-5 text-foreground" aria-hidden="true" />
                ) : (
                  <Moon className="h-5 w-5 text-foreground" aria-hidden="true" />
                )
              )}
            </button>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2.5 rounded-lg hover:bg-muted transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}
              aria-expanded={mobileMenuOpen}
              aria-controls="mobile-menu"
            >
              {mobileMenuOpen ? (
                <X className="h-6 w-6 text-foreground" aria-hidden="true" />
              ) : (
                <Menu className="h-6 w-6 text-foreground" aria-hidden="true" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        <nav
          id="mobile-menu"
          className={`md:hidden absolute top-full left-0 right-0 glass-strong shadow-lg transition-all duration-300 overflow-hidden ${
            mobileMenuOpen ? 'max-h-[80vh] opacity-100' : 'max-h-0 opacity-0'
          }`}
          aria-label="Mobile navigation"
          aria-hidden={!mobileMenuOpen}
        >
          <div className="flex flex-col p-4 gap-1">
            {navLinks.map((link) => (
              link.isRoute ? (
                <Link
                  key={link.href}
                  to={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className="text-foreground hover:text-primary py-3.5 px-4 rounded-lg hover:bg-muted/50 transition-colors min-h-[48px] flex items-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary"
                  tabIndex={mobileMenuOpen ? 0 : -1}
                >
                  {t(link.labelKey)}
                </Link>
              ) : (
                <a
                  key={link.href}
                  href={link.href}
                  onClick={(e) => handleSmoothScroll(e, link.href)}
                  className="text-foreground hover:text-primary py-3.5 px-4 rounded-lg hover:bg-muted/50 transition-colors min-h-[48px] flex items-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary"
                  tabIndex={mobileMenuOpen ? 0 : -1}
                >
                  {t(link.labelKey)}
                </a>
              )
            ))}
            <div className="border-t border-border my-2" />
            <Link
              to="/auth"
              className="text-foreground hover:text-primary py-3.5 px-4 rounded-lg hover:bg-muted/50 transition-colors min-h-[48px] flex items-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary"
              tabIndex={mobileMenuOpen ? 0 : -1}
              onClick={() => setMobileMenuOpen(false)}
            >
              {t('nav.login')}
            </Link>
            <Button 
              className="mt-2 min-h-[48px]" 
              tabIndex={mobileMenuOpen ? 0 : -1}
              onClick={() => {
                setMobileMenuOpen(false);
                setInquiryDialogOpen(true);
              }}
            >
              {t('nav.bookDemo')}
            </Button>
            <Button asChild className="mt-2 min-h-[48px]" variant="outline" tabIndex={mobileMenuOpen ? 0 : -1}>
              <Link to="/auth" onClick={() => setMobileMenuOpen(false)}>{t('nav.getStarted')}</Link>
            </Button>
          </div>
        </nav>
      </header>

      {/* Mobile menu backdrop */}
      {mobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-background/80 backdrop-blur-sm z-40 md:hidden"
          onClick={() => setMobileMenuOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Inquiry Dialog */}
      <InquiryDialog
        open={inquiryDialogOpen}
        onOpenChange={setInquiryDialogOpen}
        title={t('inquiry.bookDemoTitle')}
      />
    </>
  );
};

export default NavHeader;
