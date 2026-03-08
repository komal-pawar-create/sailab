

## Plan: Add 6 New Blog Posts

### Current Coverage (12 posts across 7 clusters)
- Lab Management: 2 posts
- Lab Billing: 2 posts
- Lab Reports: 1 post
- Compliance: 1 post
- Multi-Branch: 1 post
- Buying Guide: 1 post
- Lab Owner Challenges: 4 posts

### New Posts (filling gaps + new high-value topics)

| # | Slug | Title | Cluster |
|---|------|-------|---------|
| 1 | `sample-tracking-pathology-lab` | How Sample Tracking Software Prevents Errors in Pathology Labs | lab-management |
| 2 | `lab-report-formats-templates` | Lab Report Formats: Best Practices and Free Templates | lab-reports |
| 3 | `doctor-referral-management-labs` | Doctor Referral Management for Labs: Track Commissions & Grow Revenue | lab-billing |
| 4 | `lab-data-security-hipaa-india` | Data Security for Indian Labs: Protecting Patient Records in 2026 | compliance |
| 5 | `whatsapp-reports-patient-communication` | WhatsApp Lab Reports: How to Send Reports & Improve Patient Communication | lab-reports |
| 6 | `lab-automation-roi-calculator` | Lab Automation ROI: How Much Can Your Lab Save with LIMS Software? | comparison |

### Files to Create/Modify

**New files (6):**
- `src/pages/blog/SampleTracking.tsx`
- `src/pages/blog/LabReportFormats.tsx`
- `src/pages/blog/DoctorReferralManagement.tsx`
- `src/pages/blog/LabDataSecurity.tsx`
- `src/pages/blog/WhatsappReports.tsx`
- `src/pages/blog/LabAutomationRoi.tsx`

Each follows the exact pattern of `BillingFeatures.tsx`: slug constant, `getBlogPost`, `getArticleJsonLd`, TOC sidebar, prose article with internal cross-links, `BlogCTA`, and related posts grid.

**Modified files (3):**
1. **`src/lib/blogData.ts`** — Add 6 new entries to `blogPosts` array with SEO-optimized titles, excerpts, keywords, and correct cluster assignments
2. **`src/App.tsx`** — Add 6 lazy imports and 6 `<Route>` entries for the new blog pages
3. **`public/sitemap.xml`** — Add 6 new `<url>` entries with today's date

### Content Strategy
- Each post will have 3-4 TOC sections, ~800 words of substantive content
- Internal cross-links to existing posts (strengthens topical authority)
- All posts dated `2026-03-08` for freshness signals
- Keywords target high-intent search queries relevant to Indian pathology labs

