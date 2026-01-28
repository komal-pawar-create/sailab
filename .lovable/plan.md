
# Lead Generation System Upgrade - External Inquiry API Integration

## Overview
Implement a comprehensive lead generation system that integrates with an external Inquiry API, adds global CTAs, and polishes the UX across all inquiry touchpoints. The system will be designed for cross-platform identification (among 15 platforms) using the project's snake_case name as the source.

---

## Current State Analysis

### Existing Components
- **AddLeadForm.tsx**: Internal CRM form for Super Admins (writes to local `leads` table)
- **NavHeader.tsx**: Landing page navigation with "Get Started" and "Login" buttons
- **TourCTA.tsx**: Product Tour CTA with mailto: links for demo/enterprise inquiries
- **PricingSection.tsx**: Pricing with "Custom Quote" CTA linking to /auth
- **CTASection.tsx**: Final CTA section linking to /auth

### Key Observations
1. No public-facing inquiry form exists (all CTAs lead to /auth or mailto:)
2. No Floating Action Button (FAB) or sticky contact widget
3. Phone validation is not enforced (10-15 digits)
4. No external API integration for lead capture

---

## Implementation Architecture

```text
+------------------+     +--------------------+     +---------------------------+
|  InquiryForm     |---->|  submitInquiry()   |---->| External Supabase API     |
|  (Modal/Dialog)  |     |  src/lib/api.ts    |     | /functions/v1/submit-     |
+------------------+     +--------------------+     | inquiry                   |
        ^                        |                  +---------------------------+
        |                        |
+-------+--------+               v
| CTAs Trigger   |         +----------------+
| - NavHeader    |         | Error Handling |
| - FAB Button   |         | - 400: Inline  |
| - Pricing      |         | - Success:     |
| - TourCTA      |         |   Toast + Reset|
+----------------+         +----------------+
```

---

## Technical Implementation

### 1. API Helper Function
**New File**: `src/lib/api.ts`

```typescript
// Inquiry API integration
const INQUIRY_API_URL = 'https://gcyrapukltxjohjfxgza.supabase.co/functions/v1/submit-inquiry';
const PROJECT_SOURCE = 'labflow_lims'; // snake_case project identifier

// Type definitions
interface InquiryPayload {
  contact_person: string;  // Required: 2-100 chars
  phone: string;           // Required: 10-15 digits
  source: string;          // Auto-set to PROJECT_SOURCE
  email?: string;          // Optional: valid email
  company_name?: string;   // Optional
  message?: string;        // Optional: max 2000 chars
  priority?: string;       // Default: "medium"
}

interface InquiryResponse {
  success: boolean;
  data?: any;
  error?: {
    message: string;
    details?: Array<{ field: string; message: string }>;
  };
}

export async function submitInquiry(payload: Omit<InquiryPayload, 'source'>): Promise<InquiryResponse>
```

### 2. Zod Validation Schema
**Location**: `src/lib/api.ts` or separate `src/lib/validations/inquiry.ts`

```typescript
import { z } from 'zod';

export const inquirySchema = z.object({
  contact_person: z.string()
    .min(2, 'Name must be at least 2 characters')
    .max(100, 'Name must be less than 100 characters'),
  phone: z.string()
    .regex(/^\d{10,15}$/, 'Phone must be 10-15 digits'),
  email: z.string().email('Invalid email format').optional().or(z.literal('')),
  company_name: z.string().optional(),
  message: z.string().max(2000, 'Message must be less than 2000 characters').optional(),
});
```

### 3. Inquiry Form Component
**New File**: `src/components/forms/InquiryForm.tsx`

Features:
- Zod validation with react-hook-form
- Numeric phone input handler
- Inline field error mapping from API 400 responses
- Loading state with disabled submit button
- Success toast via Sonner + form reset
- Clean modal-friendly design consistent with Tailwind theme

### 4. Inquiry Dialog Component
**New File**: `src/components/InquiryDialog.tsx`

- Uses shadcn Dialog component
- Wraps InquiryForm
- Controlled open/close state
- Title: "Book a Demo" / "Get a Quote" (configurable)

---

## Global CTAs Implementation

### 5. NavHeader Updates
**File**: `src/components/landing/NavHeader.tsx`

Changes:
- Add "Book Demo" button between nav links and "Get Started"
- Desktop: Button with calendar icon
- Mobile: Include in mobile menu
- Opens InquiryDialog on click

### 6. Floating Action Button (FAB)
**New File**: `src/components/FloatingContactButton.tsx`

Features:
- Fixed position: bottom-right corner
- Sticky visibility (shows after scrolling 100px)
- Pulse animation to draw attention
- MessageCircle or Phone icon
- Opens InquiryDialog on click
- z-index to stay above content but below modals

### 7. Layout Integration
**File**: `src/pages/Index.tsx`

- Add FloatingContactButton component
- Add InquiryDialog with state management

**File**: `src/pages/ProductTour.tsx`

- Add FloatingContactButton component
- Add InquiryDialog with state management

### 8. TourCTA Refactor
**File**: `src/components/product-tour/TourCTA.tsx`

Changes:
- Replace `mailto:` links with InquiryDialog triggers
- "Schedule Demo" card opens dialog with "Demo Request" context
- "Enterprise" card opens dialog with "Enterprise Inquiry" context

### 9. PricingSection Update
**File**: `src/components/landing/PricingSection.tsx`

Changes:
- "Contact for Custom Quote" button opens InquiryDialog instead of /auth link

---

## Files to Create

| File | Purpose |
|------|---------|
| `src/lib/api.ts` | API helper with submitInquiry function + validation schema |
| `src/components/forms/InquiryForm.tsx` | Reusable inquiry form with Zod validation |
| `src/components/InquiryDialog.tsx` | Modal wrapper for InquiryForm |
| `src/components/FloatingContactButton.tsx` | Sticky FAB component |

## Files to Modify

| File | Changes |
|------|---------|
| `src/pages/Index.tsx` | Add FloatingContactButton + InquiryDialog |
| `src/pages/ProductTour.tsx` | Add FloatingContactButton + InquiryDialog |
| `src/components/landing/NavHeader.tsx` | Add "Book Demo" button |
| `src/components/product-tour/TourCTA.tsx` | Replace mailto with dialog triggers |
| `src/components/landing/PricingSection.tsx` | Replace link with dialog trigger |
| `src/i18n/locales/en.json` | Add inquiry form translations |
| `src/i18n/locales/hi.json` | Add inquiry form translations (Hindi) |
| `src/i18n/locales/mr.json` | Add inquiry form translations (Marathi) |

---

## UI/UX Polish Details

### Form UX
- Phone input: `type="tel"` with `inputMode="numeric"` and `pattern="[0-9]*"`
- Submit button: Shows "Sending..." with spinner while `isSubmitting`
- All inputs use shadcn/ui components for consistency
- Field errors appear immediately below each input

### FAB Design
- Primary color background with white icon
- Subtle pulse animation (CSS keyframes)
- Tooltip on hover: "Contact Us"
- Hides on mobile when near bottom of page (optional)

### Success State
- Toast message: "Inquiry Received! We'll contact you shortly."
- Form resets to empty state
- Dialog closes automatically (optional via prop)

### Error Handling
- Network errors: Toast with retry suggestion
- 400 errors: Map `details` array to specific field errors
- Unknown errors: Generic error toast

---

## i18n Additions

```json
{
  "inquiry": {
    "title": "Get in Touch",
    "bookDemo": "Book Demo",
    "contactPerson": "Your Name",
    "phone": "Phone Number",
    "email": "Email (Optional)",
    "companyName": "Company/Lab Name (Optional)",
    "message": "Message (Optional)",
    "submit": "Send Inquiry",
    "submitting": "Sending...",
    "success": "Inquiry Received! We'll contact you shortly.",
    "errorGeneric": "Failed to submit. Please try again.",
    "validationPhone": "Please enter a valid 10-15 digit phone number",
    "validationName": "Name must be 2-100 characters"
  },
  "nav": {
    "bookDemo": "Book Demo"
  }
}
```

---

## Testing Checklist

1. NavHeader "Book Demo" button opens dialog
2. FAB appears on scroll and opens dialog
3. Form validation prevents submission with invalid data
4. Phone field only accepts numeric input
5. API 201 response triggers success toast and form reset
6. API 400 response shows inline field errors
7. Network failure shows error toast
8. Submit button is disabled during submission
9. Works correctly in Hindi and Marathi locales
10. Mobile responsive layout maintained

