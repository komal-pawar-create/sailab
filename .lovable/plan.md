

## Test All Inquiry/Lead Forms and Add Smart Lead Magnets

### Current State Audit

All inquiry forms flow through a single path:
- **InquiryForm** -> **submitInquiry()** (in `src/lib/api.ts`) -> **submit-crm-inquiry** edge function -> BizFlow CRM API

**7 touchpoints currently trigger the InquiryDialog:**

| Location | Trigger | Context |
|----------|---------|---------|
| NavHeader | "Book Demo" button | Book Demo |
| Landing Page (Index) | Floating Action Button (FAB) | General |
| Product Tour page | Floating Action Button (FAB) | General |
| TourCTA section | "Schedule Demo" card | Demo Request |
| TourCTA section | "Enterprise" card | Enterprise Inquiry |
| TourCTA section | "Book a Call" link | Book a Call |
| PricingSection | Enterprise plan + Multi-Lab CTA | Custom Quote |
| FAQSection | "Contact Support" button | General |

**1 missed opportunity (no inquiry form):**
- **CTASection** (final CTA) - currently links to `/auth` instead of opening inquiry dialog

---

### Plan

#### 1. Test the existing inquiry flow end-to-end
- Navigate to the landing page and test the FAB inquiry submission
- Verify the edge function returns a proper response (success or meaningful error from BizFlow)
- Check console and network logs for errors

#### 2. Convert CTASection from link to lead capture
The final CTA section currently sends users to `/auth`. Convert it to also offer an inquiry option -- add a secondary "Book a Demo" button alongside the existing "Get Started" button, opening the InquiryDialog.

#### 3. Add smart lead magnet features

**A. Exit-Intent Popup (Desktop)**
Create an exit-intent detector that shows the InquiryDialog when the user's mouse leaves the viewport (heading toward browser close/back). Only triggers once per session, with a 30-second delay after page load to avoid annoying visitors.

**B. Scroll-Triggered Offer**
After a user scrolls past 60% of the landing page without clicking any CTA, show a subtle bottom banner offering a free consultation or downloadable resource (e.g., "Free Lab Efficiency Checklist"). Clicking it opens the InquiryDialog with pre-filled context.

**C. Time-Delayed Soft CTA**
After 45 seconds on the page, slide in a small, dismissible notification card in the bottom-right corner: "Need help choosing a plan? Talk to our team" with a quick action button.

**D. Enhanced InquiryForm with Lead Source Tracking**
Add a hidden `source` field to the InquiryForm that automatically captures where the lead came from (e.g., "exit_intent", "scroll_trigger", "fab_button", "pricing_enterprise", "faq_support"). This data flows through to BizFlow CRM for attribution analytics.

---

### Technical Details

**Files to create:**
- `src/components/landing/ExitIntentPopup.tsx` -- detects mouse leaving viewport, shows InquiryDialog once per session
- `src/components/landing/ScrollOfferBanner.tsx` -- bottom banner after 60% scroll depth
- `src/components/landing/TimedSoftCTA.tsx` -- delayed notification card

**Files to modify:**
- `src/components/landing/CTASection.tsx` -- add "Book Demo" button with InquiryDialog
- `src/components/InquiryDialog.tsx` -- pass `source` prop through to form
- `src/components/forms/InquiryForm.tsx` -- accept and send `source` prop in payload
- `src/lib/api.ts` -- include `source` override in submitInquiry payload
- `src/pages/Index.tsx` -- add ExitIntentPopup, ScrollOfferBanner, and TimedSoftCTA components
- `src/pages/ProductTour.tsx` -- add ExitIntentPopup component
- All existing InquiryDialog usages -- add `source` prop for tracking (e.g., `source="navbar_book_demo"`, `source="pricing_enterprise"`)

**Edge function** (`submit-crm-inquiry/index.ts`): No changes needed -- `source` field is already forwarded in the payload.

**Session storage keys** used to prevent repeated popups:
- `labflow_exit_intent_shown`
- `labflow_scroll_offer_dismissed`
- `labflow_timed_cta_dismissed`

