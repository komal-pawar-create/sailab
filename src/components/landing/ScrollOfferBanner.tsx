import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { X, FileCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import InquiryDialog from '@/components/InquiryDialog';
import { motion, AnimatePresence } from 'framer-motion';

const SESSION_KEY = 'labflow_scroll_offer_dismissed';

const ScrollOfferBanner = () => {
  const { t } = useTranslation();
  const [visible, setVisible] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);

  useEffect(() => {
    if (sessionStorage.getItem(SESSION_KEY)) return;

    const handleScroll = () => {
      const scrollPercent = window.scrollY / (document.documentElement.scrollHeight - window.innerHeight);
      if (scrollPercent > 0.6) {
        setVisible(true);
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const dismiss = () => {
    setVisible(false);
    sessionStorage.setItem(SESSION_KEY, '1');
  };

  return (
    <>
      <AnimatePresence>
        {visible && (
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed bottom-0 left-0 right-0 z-40 p-3 md:p-4"
          >
            <div className="max-w-3xl mx-auto glass-strong rounded-2xl p-4 md:p-5 flex items-center gap-4 shadow-xl border border-border">
              <div className="hidden sm:flex p-3 rounded-xl bg-primary/10 shrink-0">
                <FileCheck className="h-6 w-6 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-foreground text-sm md:text-base">
                  {t('leadMagnet.scrollTitle', 'Free Lab Efficiency Checklist')}
                </p>
                <p className="text-xs md:text-sm text-muted-foreground truncate">
                  {t('leadMagnet.scrollSubtitle', 'Get a free consultation & efficiency checklist for your lab')}
                </p>
              </div>
              <Button
                size="sm"
                onClick={() => {
                  setDialogOpen(true);
                  dismiss();
                }}
                className="shrink-0"
              >
                {t('leadMagnet.claimNow', 'Claim Now')}
              </Button>
              <button
                onClick={dismiss}
                className="p-1.5 rounded-lg hover:bg-muted transition-colors shrink-0"
                aria-label="Dismiss"
              >
                <X className="h-4 w-4 text-muted-foreground" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <InquiryDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        title={t('leadMagnet.scrollTitle', 'Free Lab Efficiency Checklist')}
        context="Free Consultation & Efficiency Checklist"
        source="scroll_offer"
      />
    </>
  );
};

export default ScrollOfferBanner;
