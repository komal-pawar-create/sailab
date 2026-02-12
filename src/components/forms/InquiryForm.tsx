import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslation } from 'react-i18next';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { toast } from 'sonner';
import { inquirySchema, submitInquiry, type InquiryFormData } from '@/lib/api';

interface InquiryFormProps {
  onSuccess?: () => void;
  context?: string; // e.g., "Demo Request", "Enterprise Inquiry"
}

const InquiryForm = ({ onSuccess, context }: InquiryFormProps) => {
  const { t } = useTranslation();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<InquiryFormData>({
    resolver: zodResolver(inquirySchema),
    defaultValues: {
      contact_person: '',
      phone: '',
      email: '',
      company_name: '',
      message: context ? `Inquiry Type: ${context}\n\n` : '',
    },
  });

  // Handle numeric-only input for phone field
  const handlePhoneInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, '').slice(0, 15);
    form.setValue('phone', value, { shouldValidate: true });
  };

  const onSubmit = async (data: InquiryFormData) => {
    setIsSubmitting(true);

    const result = await submitInquiry(data);

    if (result.success) {
      toast.success(t('inquiry.success'));
      form.reset();
      onSuccess?.();
    } else {
      // Handle API validation errors - map to specific fields
      const errorResult = result as { success: false; error: { message: string; details?: Array<{ field: string; message: string }> } };
      if (errorResult.error.details && errorResult.error.details.length > 0) {
        errorResult.error.details.forEach((detail) => {
          const fieldName = detail.field as keyof InquiryFormData;
          if (fieldName && form.getValues(fieldName) !== undefined) {
            form.setError(fieldName, { message: detail.message });
          }
        });
      } else {
        toast.error(errorResult.error.message || t('inquiry.errorGeneric'));
      }
    }

    setIsSubmitting(false);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        {/* Contact Person - Required */}
        <FormField
          control={form.control}
          name="contact_person"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('inquiry.contactPerson')} *</FormLabel>
              <FormControl>
                <Input
                  placeholder={t('inquiry.contactPerson')}
                  {...field}
                  disabled={isSubmitting}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Phone - Required */}
        <FormField
          control={form.control}
          name="phone"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('inquiry.phone')} *</FormLabel>
              <FormControl>
                <Input
                  type="tel"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  placeholder="8888567870"
                  {...field}
                  onChange={handlePhoneInput}
                  disabled={isSubmitting}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Email - Optional */}
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('inquiry.email')}</FormLabel>
              <FormControl>
                <Input
                  type="email"
                  placeholder="you@example.com"
                  {...field}
                  disabled={isSubmitting}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Company Name - Optional */}
        <FormField
          control={form.control}
          name="company_name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('inquiry.companyName')}</FormLabel>
              <FormControl>
                <Input
                  placeholder={t('inquiry.companyName')}
                  {...field}
                  disabled={isSubmitting}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Message - Optional */}
        <FormField
          control={form.control}
          name="message"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('inquiry.message')}</FormLabel>
              <FormControl>
                <Textarea
                  placeholder={t('inquiry.message')}
                  rows={3}
                  {...field}
                  disabled={isSubmitting}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Submit Button */}
        <Button
          type="submit"
          className="w-full"
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              {t('inquiry.submitting')}
            </>
          ) : (
            t('inquiry.submit')
          )}
        </Button>
      </form>
    </Form>
  );
};

export default InquiryForm;
