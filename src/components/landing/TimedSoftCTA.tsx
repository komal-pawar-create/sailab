import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { X, MessageSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import InquiryDialog from '@/components/InquiryDialog';
import { motion, AnimatePresence } from 'framer-motion';

const SESSION_KEY = 'labflow_timed_cta_dismissed';

const TimedSoftCTA = () => {
  const { t } = useTranslation();
  const [visible, setVisible] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);

  useEffect(() => {
    if (sessionStorage.getItem(SESSION_KEY)) return;

    const timer = setTimeout(() => setVisible(true), 45000); // 45s
    return () => clearTimeout(timer);
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
            initial={{ x: 100, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 100, opacity: 0 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed bottom-24 right-4 z-40 w-72 max-w-[calc(100vw-2rem)]"
          >
            <div className="glass-strong rounded-2xl p-4 shadow-xl border border-border">
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-lg bg-primary/10 shrink-0">
                  <MessageSquare className="h-5 w-5 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-foreground text-sm">
                    {t('leadMagnet.timedTitle', 'Need help choosing a plan?')}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {t('leadMagnet.timedSubtitle', 'Talk to our team — we\'ll help you find the right fit.')}
                  </p>
                </div>
                <button
                  onClick={dismiss}
                  className="p-1 rounded hover:bg-muted transition-colors shrink-0"
                  aria-label="Dismiss"
                >
                  <X className="h-3.5 w-3.5 text-muted-foreground" />
                </button>
              </div>
              <Button
                size="sm"
                className="w-full mt-3"
                onClick={() => {
                  setDialogOpen(true);
                  dismiss();
                }}
              >
                {t('leadMagnet.talkToTeam', 'Talk to Our Team')}
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <InquiryDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        title={t('leadMagnet.timedTitle', 'Need help choosing a plan?')}
        source="timed_soft_cta"
      />
    </>
  );
};

export default TimedSoftCTA;
