import React from 'react';
import { useTranslation } from 'react-i18next';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import InquiryForm from '@/components/forms/InquiryForm';

interface InquiryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title?: string;
  description?: string;
  context?: string; // Passed to form for pre-filled context
}

const InquiryDialog = ({
  open,
  onOpenChange,
  title,
  description,
  context,
}: InquiryDialogProps) => {
  const { t } = useTranslation();

  const handleSuccess = () => {
    // Close dialog after a short delay to show success state
    setTimeout(() => onOpenChange(false), 500);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{title || t('inquiry.title')}</DialogTitle>
          {description && (
            <DialogDescription>{description}</DialogDescription>
          )}
        </DialogHeader>
        <InquiryForm onSuccess={handleSuccess} context={context} />
      </DialogContent>
    </Dialog>
  );
};

export default InquiryDialog;
