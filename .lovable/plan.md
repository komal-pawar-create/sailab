

## Add Topical Mapping Blog Pages for SEO and Internal Linking

### Overview

Create a blog section with static, SEO-optimized articles organized into topical clusters that target high-intent keywords for pathology labs and diagnostic centers in India. Each article includes JSON-LD structured data, internal links to relevant landing page sections and product tour, and a CTA to capture leads.

### Topical Clusters and Articles

**Cluster 1: Lab Management**
- `/blog/what-is-lims-software` -- "What is LIMS Software? A Complete Guide for Indian Labs"
- `/blog/how-to-digitize-pathology-lab` -- "How to Digitize Your Pathology Lab in 2026"

**Cluster 2: Lab Billing**
- `/blog/gst-billing-for-pathology-labs` -- "GST Billing for Pathology Labs: Complete Guide"
- `/blog/lab-billing-software-features` -- "7 Must-Have Features in Lab Billing Software"

**Cluster 3: Lab Reports**
- `/blog/digital-lab-reports-guide` -- "Digital Lab Reports: Why Your Lab Should Switch Today"

**Cluster 4: Compliance**
- `/blog/nabl-accreditation-guide` -- "NABL Accreditation for Labs: Requirements and How Software Helps"

**Cluster 5: Multi-Branch**
- `/blog/multi-branch-lab-management` -- "Managing Multiple Lab Branches: Challenges and Solutions"

**Cluster 6: Comparison/Buying Guide**
- `/blog/best-lims-software-india` -- "Best LIMS Software in India 2026: How to Choose"

### Architecture

Each blog post is a standalone React component with:
- Dynamic `document.title` and meta description set via `useEffect`
- JSON-LD `Article` schema for rich search results
- Internal links to `/#features`, `/#pricing`, `/product-tour`, and other blog posts (topical interlinking)
- A lead-capture CTA (InquiryDialog) at the bottom of each post
- Consistent layout using NavHeader and FooterSection from the landing page
- Responsive typography optimized for readability

A blog index page at `/blog` lists all articles with excerpts, organized by cluster.

### Technical Details

**New files to create:**

| File | Description |
|------|-------------|
| `src/pages/Blog.tsx` | Blog index page listing all articles by cluster |
| `src/pages/blog/WhatIsLims.tsx` | Article: What is LIMS Software |
| `src/pages/blog/DigitizePathologyLab.tsx` | Article: How to Digitize Your Lab |
| `src/pages/blog/GstBillingLabs.tsx` | Article: GST Billing for Labs |
| `src/pages/blog/BillingFeatures.tsx` | Article: Must-Have Billing Features |
| `src/pages/blog/DigitalLabReports.tsx` | Article: Digital Lab Reports |
| `src/pages/blog/NablAccreditation.tsx` | Article: NABL Accreditation Guide |
| `src/pages/blog/MultiBranchManagement.tsx` | Article: Multi-Branch Lab Management |
| `src/pages/blog/BestLimsIndia.tsx` | Article: Best LIMS Software India 2026 |
| `src/components/blog/BlogLayout.tsx` | Shared layout wrapper (NavHeader + Footer + CTA) |
| `src/components/blog/BlogCard.tsx` | Card component for the blog index |
| `src/components/blog/BlogCTA.tsx` | Bottom-of-article lead capture CTA |
| `src/components/blog/TableOfContents.tsx` | Sticky sidebar TOC for long articles |
| `src/lib/blogData.ts` | Centralized blog metadata (title, slug, excerpt, category, keywords) |

**Files to modify:**

| File | Change |
|------|--------|
| `src/App.tsx` | Add `/blog` and `/blog/:slug` routes (no sidebar) |
| `src/components/landing/NavHeader.tsx` | Add "Blog" link to nav |
| `src/components/landing/FooterSection.tsx` | Add "Blog" link to footer quick links |
| `public/sitemap.xml` | Add all 9 blog URLs |
| `public/robots.txt` | Ensure `/blog` is allowed |
| `index.html` | No changes needed (individual pages set their own meta) |

**SEO per article:**
- Unique `<title>` and `<meta name="description">` via useEffect
- JSON-LD `Article` schema with `author`, `datePublished`, `headline`, `image`
- Canonical URL pointing to `https://labflow.mywebz.in/blog/{slug}`
- 3-5 internal links per article to other blog posts, features section, pricing, and product tour
- Keyword-optimized H1, H2, H3 hierarchy

**Internal linking strategy:**
- Each blog links to 2-3 other blog posts (cross-cluster where relevant)
- Each blog links to at least 1 landing page section (`/#features`, `/#pricing`, `/#demo`)
- Landing page footer and nav link to `/blog`
- Product tour page can link to relevant blogs
- Blog index is organized by topical cluster for crawl clarity

**Routing structure:**
```text
/blog                           --> Blog index (list all articles)
/blog/what-is-lims-software     --> Article page
/blog/gst-billing-for-labs      --> Article page
...etc
```

All blog routes will be added to the `noSidebarPages` array and rendered without the dashboard sidebar, using the same NavHeader/Footer as the landing page.
