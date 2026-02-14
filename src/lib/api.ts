import { z } from 'zod';
import { supabase } from '@/integrations/supabase/client';

// Zod validation schema matching BizFlow CRM API requirements
export const inquirySchema = z.object({
  contact_person: z
    .string()
    .min(2, 'Name must be at least 2 characters')
    .max(100, 'Name must be less than 100 characters'),
  phone: z
    .string()
    .regex(/^\d{10,15}$/, 'Phone must be 10-15 digits'),
  email: z
    .string()
    .email('Invalid email format')
    .optional()
    .or(z.literal('')),
  company_name: z.string().optional(),
  message: z
    .string()
    .max(2000, 'Message must be less than 2000 characters')
    .optional(),
});

export type InquiryFormData = z.infer<typeof inquirySchema>;

// API response types
interface InquirySuccessResponse {
  success: true;
  data?: unknown;
}

interface InquiryErrorResponse {
  success: false;
  error: {
    message: string;
    details?: Array<{ field: string; message: string }>;
  };
}

export type InquiryResponse = InquirySuccessResponse | InquiryErrorResponse;

/**
 * Submit an inquiry to the BizFlow CRM via edge function proxy.
 * The edge function adds the x-public-api-key header securely.
 * company_name is merged into message since the CRM API rejects it as a standalone field.
 */
export async function submitInquiry(
  formData: InquiryFormData,
  source?: string
): Promise<InquiryResponse> {
  const payload = {
    contact_person: formData.contact_person,
    phone: formData.phone,
    source: source || 'labflow_lims',
    email: formData.email || undefined,
    company_name: formData.company_name || undefined,
    message: formData.message || undefined,
  };

  try {
    const { data, error } = await supabase.functions.invoke('submit-crm-inquiry', {
      body: payload,
    });

    if (error) {
      console.error('Edge function error:', error);
      return {
        success: false,
        error: {
          message: error.message || 'Something went wrong. Please try again.',
        },
      };
    }

    if (data?.success) {
      return { success: true, data };
    }

    // Handle CRM API validation errors
    return {
      success: false,
      error: {
        message: data?.error || data?.message || 'Submission failed',
        details: data?.details || [],
      },
    };
  } catch (error) {
    console.error('Inquiry submission error:', error);
    return {
      success: false,
      error: {
        message: 'Network error. Please check your connection and try again.',
      },
    };
  }
}
