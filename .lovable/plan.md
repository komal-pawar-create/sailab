
# Change Mobile Number to 8888567870

## Overview
Replace all instances of the placeholder phone number `9876543210` with `8888567870` across the codebase. This includes displayed numbers, tel: links, and placeholder text.

---

## Files to Modify

### 1. `src/components/landing/FooterSection.tsx` (line 136, 140)
- `href="tel:+919876543210"` -> `href="tel:+918888567870"`
- `+91 98765 43210` -> `+91 88885 67870`

### 2. `src/components/product-tour/TourCTA.tsx` (line 159, 163)
- `href="tel:+919876543210"` -> `href="tel:+918888567870"`
- `+91 98765 43210` -> `+91 88885 67870`

### 3. `src/components/product-tour/StakeholderTabs.tsx` (line 336)
- `'9876543210'` -> `'8888567870'`

### 4. `src/components/forms/InquiryForm.tsx` (line 107)
- `placeholder="9876543210"` -> `placeholder="8888567870"`

### 5. `src/components/bills/BillPreviewSample.tsx` (line 145)
- `+91 98765 43210` -> `+91 88885 67870`

### 6. `src/pages/LabProfile.tsx` (line 766)
- `placeholder="+91 9876543210"` -> `placeholder="+91 8888567870"`

---

## Summary
6 files, all straightforward find-and-replace of the old number with `8888567870`. No logic changes required.
