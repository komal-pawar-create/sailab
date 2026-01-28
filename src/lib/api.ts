import { z } from 'zod';

// External Inquiry API Configuration
const INQUIRY_API_URL = 'https://gcyrapukltxjohjfxgza.supabase.co/functions/v1/submit-inquiry';
const PROJECT_SOURCE = 'labflow_lims'; // snake_case project identifier for cross-platform tracking

// Zod validation schema matching API requirements
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

// API payload type (includes auto-set fields)
interface InquiryPayload extends InquiryFormData {
  source: string;
  priority: string;
}

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
 * Submit an inquiry to the external API
 * Automatically sets source to project identifier and priority to "medium"
 */
export async function submitInquiry(
  formData: InquiryFormData
): Promise<InquiryResponse> {
  const payload: InquiryPayload = {
    ...formData,
    source: PROJECT_SOURCE,
    priority: 'medium',
    // Clean up empty optional fields
    email: formData.email || undefined,
    company_name: formData.company_name || undefined,
    message: formData.message || undefined,
  };

  try {
    const response = await fetch(INQUIRY_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    const data = await response.json();

    if (response.status === 201) {
      return { success: true, data };
    }

    if (response.status === 400) {
      return {
        success: false,
        error: {
          message: data.message || 'Validation failed',
          details: data.details || [],
        },
      };
    }

    // Handle other error statuses
    return {
      success: false,
      error: {
        message: data.message || 'Something went wrong. Please try again.',
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
