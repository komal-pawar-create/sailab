import { useEffect, useState } from 'react';
import InquiryDialog from '@/components/InquiryDialog';
import { useTranslation } from 'react-i18next';

const SESSION_KEY = 'labflow_exit_intent_shown';

const ExitIntentPopup = () => {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (sessionStorage.getItem(SESSION_KEY)) return;

    let enabled = false;
    const enableTimer = setTimeout(() => { enabled = true; }, 30000); // 30s delay

    const handleMouseLeave = (e: MouseEvent) => {
      if (!enabled) return;
      if (e.clientY <= 0) {
        sessionStorage.setItem(SESSION_KEY, '1');
        setOpen(true);
      }
    };

    document.addEventListener('mouseleave', handleMouseLeave);
    return () => {
      clearTimeout(enableTimer);
      document.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, []);

  return (
    <InquiryDialog
      open={open}
      onOpenChange={setOpen}
      title={t('inquiry.exitIntentTitle', 'Wait! Get a Free Demo')}
      description={t('inquiry.exitIntentDescription', 'Before you go — schedule a free personalized demo and see how LabFlow can transform your lab.')}
      source="exit_intent"
    />
  );
};

export default ExitIntentPopup;
