import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ChevronDown, Globe } from 'lucide-react';
import { languages, type LanguageCode } from '@/i18n';

interface LanguageSelectorProps {
  isScrolled?: boolean;
}

const LanguageSelector = ({ isScrolled = false }: LanguageSelectorProps) => {
  const { i18n } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);

  const currentLang = languages.find(l => l.code === i18n.language) || languages[0];

  const handleLanguageChange = (code: LanguageCode) => {
    i18n.changeLanguage(code);
    setIsOpen(false);
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-all duration-300 hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 ${
          isScrolled ? 'bg-muted/50' : 'bg-background/50 backdrop-blur-sm'
        }`}
        aria-label="Select language"
        aria-expanded={isOpen}
        aria-haspopup="listbox"
      >
        <Globe className="h-4 w-4 text-foreground" />
        <span className="text-sm font-medium text-foreground hidden sm:inline">
          {currentLang.nativeName}
        </span>
        <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform duration-200 hidden sm:block ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 z-40" 
            onClick={() => setIsOpen(false)}
            aria-hidden="true"
          />
          
          {/* Dropdown */}
          <div 
            className="absolute right-0 mt-2 w-40 py-1 rounded-xl glass-strong shadow-lg border border-border/50 z-50 animate-in fade-in slide-in-from-top-2 duration-200"
            role="listbox"
            aria-label="Language options"
          >
            {languages.map((lang) => (
              <button
                key={lang.code}
                onClick={() => handleLanguageChange(lang.code)}
                className={`w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors hover:bg-muted/50 ${
                  currentLang.code === lang.code 
                    ? 'bg-primary/10 text-primary' 
                    : 'text-foreground'
                }`}
                role="option"
                aria-selected={currentLang.code === lang.code}
              >
                <span className="text-lg" aria-hidden="true">{lang.flag}</span>
                <div className="flex flex-col">
                  <span className="text-sm font-medium">{lang.nativeName}</span>
                  <span className="text-xs text-muted-foreground">{lang.name}</span>
                </div>
                {currentLang.code === lang.code && (
                  <span className="ml-auto text-primary">✓</span>
                )}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export default LanguageSelector;
