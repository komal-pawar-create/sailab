

## Minor UI/UX Issue Fixes

### Issues Found

| # | Issue | Severity | Location |
|---|-------|----------|----------|
| 1 | **Wrong brand name "Lab Master"** in PWA install prompt | Medium | `InstallPrompt.tsx` line 99 |
| 2 | **Wrong brand name "Lab Master"** in database (footer, testimonials, FAQs) | Medium | `landing_footer` table + `en.json` translations |
| 3 | **Footer Quick Links show wrong content** -- DB has Privacy Policy/Terms/Contact instead of Features/Pricing/Blog | Medium | `landing_footer.nav_links` in DB |
| 4 | **Duplicate footer columns** -- Quick Links and Legal both show Privacy Policy + Terms | Low | Footer data + design overlap |
| 5 | **"Lab Master" in i18n strings** -- testimonials subtitle, FAQ subtitle, CTA subtitle all say "Lab Master" | Medium | `src/i18n/locales/en.json` |
| 6 | **"Lab Master" in App.tsx sidebar header** | Medium | `src/App.tsx` line 84 |
| 7 | **"Lab Master" in hardcoded FAQ answers** | Low | `src/pages/Index.tsx` lines 94, 98 |

### Plan

#### 1. Fix InstallPrompt brand name
Change "Install Lab Master" to "Install LabFlow" in `src/components/InstallPrompt.tsx`.

#### 2. Fix all "Lab Master" references in i18n
Update `src/i18n/locales/en.json` to replace all "Lab Master" with "LabFlow" in:
- `testimonials.subtitle`
- `faq.subtitle`
- `cta.subtitle`

Also check `hi.json` and `mr.json` for the same issue.

#### 3. Fix App.tsx sidebar brand name
Change "Lab Master" to "LabFlow" in `src/App.tsx` line 84.

#### 4. Fix hardcoded FAQ/testimonial data in Index.tsx
Replace "Lab Master" with "LabFlow" in the default FAQ and testimonial entries (lines 94, 98).

#### 5. Fix footer database content
Update the `landing_footer` table to:
- Change `brand_name` from "Lab Master" to "LabFlow"
- Update `nav_links` to include Features, Pricing, Demo, Product Tour, Blog (matching the default links)
- Update `copyright_text` to reference LabFlow

#### 6. Fix AddDemoVideoForm placeholder
Change placeholder text from "Getting Started with Lab Master" to "Getting Started with LabFlow" in `src/components/forms/AddDemoVideoForm.tsx`.

---

### Technical Details

**Files to modify:**
- `src/components/InstallPrompt.tsx` -- line 99: "Install Lab Master" to "Install LabFlow"
- `src/App.tsx` -- line 84: "Lab Master" to "LabFlow"
- `src/i18n/locales/en.json` -- 3 strings referencing "Lab Master"
- `src/i18n/locales/hi.json` -- check and fix any "Lab Master" references
- `src/i18n/locales/mr.json` -- check and fix any "Lab Master" references
- `src/pages/Index.tsx` -- lines 94, 98: hardcoded "Lab Master" in FAQ/testimonial defaults
- `src/components/forms/AddDemoVideoForm.tsx` -- line 108: placeholder text

**Database update (SQL):**
```sql
UPDATE landing_footer
SET brand_name = 'LabFlow',
    copyright_text = '© 2026 LabFlow. All rights reserved.',
    nav_links = '[
      {"label": "Features", "href": "#features"},
      {"label": "Pricing", "href": "#pricing"},
      {"label": "Demo", "href": "#demo"},
      {"label": "Product Tour", "href": "/product-tour"},
      {"label": "Blog", "href": "/blog"}
    ]'::jsonb
WHERE id = '330c6213-4415-46c5-a517-517c828a48ab';
```

**Total: 7 files + 1 DB update, all straightforward string replacements.**
