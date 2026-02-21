

## SEO Improvement Plan

A set of targeted SEO enhancements to boost search visibility, fix gaps, and strengthen structured data.

---

### 1. Update Sitemap with Missing Pages

The sitemap is missing 7 pages: 4 new blog articles and 3 legal pages.

**File:** `public/sitemap.xml`
- Add entries for:
  - `/blog/reduce-lab-report-turnaround-time` (priority 0.8)
  - `/blog/lab-staff-management-challenges` (priority 0.8)
  - `/blog/reduce-patient-complaints-pathology-lab` (priority 0.8)
  - `/blog/lab-revenue-leakage-prevention` (priority 0.8)
  - `/privacy-policy` (priority 0.5)
  - `/terms-of-service` (priority 0.5)
  - `/refund-policy` (priority 0.5)
- Update `lastmod` dates to `2026-02-21`

---

### 2. Add BreadcrumbList Structured Data to Blog Articles

Only the Product Tour page has breadcrumb schema. Adding it to all blog articles improves Google's rich results display.

**File:** `src/components/blog/BlogLayout.tsx`
- Automatically inject a `BreadcrumbList` JSON-LD alongside the article's existing JSON-LD
- Breadcrumb path: Home > Blog > [Article Title]
- This is handled centrally so all 12 articles benefit without individual changes

---

### 3. Add Visible Breadcrumb Navigation to Blog Articles

Complement the structured data with a visible breadcrumb UI at the top of every article page.

**File:** `src/components/blog/BlogLayout.tsx`
- Add a breadcrumb bar (Home / Blog / Article Title) above the content using the existing `Breadcrumb` UI component
- Only show the breadcrumb when `canonicalSlug` is not empty (skip it on the blog index page)

---

### 4. Add SEO Meta Tags to Legal Pages

The three new legal pages are missing dynamic meta tags (description, canonical, OG tags).

**Files:** `src/pages/PrivacyPolicy.tsx`, `src/pages/TermsOfService.tsx`, `src/pages/RefundPolicy.tsx`
- Add a `useEffect` to each page that sets:
  - `document.title`
  - `meta[name="description"]`
  - `link[rel="canonical"]`
  - Open Graph tags (`og:title`, `og:description`, `og:url`)

---

### 5. Update llms.txt and llms-full.txt with New Content

AI crawlers reference these files. They are missing the new blog articles and legal pages.

**File:** `public/llms.txt`
- Add the 4 new blog article titles/URLs under a "Blog Articles" section
- Add legal page URLs

**File:** `public/llms-full.txt`
- Add a "Blog Content" section listing all 12 article titles with brief descriptions
- Add a "Legal" section with links to privacy policy, terms, and refund policy

---

### 6. Add `article:published_time` and `article:modified_time` OG Meta Tags

Blog articles set `og:type` to `article` but are missing the article-specific time properties that search engines and social platforms use.

**File:** `src/components/blog/BlogLayout.tsx`
- Accept optional `datePublished` and `dateModified` props
- Set `article:published_time` and `article:modified_time` meta tags when provided

**Files:** All 12 blog article pages
- Pass `datePublished` and `dateModified` from the post data to `BlogLayout`

---

### 7. Add `noindex` to Auth and Forgot Password Pages

These are already blocked in `robots.txt` but not in the pages themselves. Adding `noindex` meta tags provides defense-in-depth.

**Files:** `src/pages/Auth.tsx`, `src/pages/ForgotPassword.tsx`
- Add `useEffect` that sets `<meta name="robots" content="noindex, nofollow">` (same pattern as `NotFound.tsx`)

---

### Summary

| # | Improvement | Files | Impact |
|---|-------------|-------|--------|
| 1 | Update sitemap with 7 missing pages | `sitemap.xml` | Crawling |
| 2 | BreadcrumbList schema on blog articles | `BlogLayout.tsx` | Rich results |
| 3 | Visible breadcrumb navigation | `BlogLayout.tsx` | UX + SEO |
| 4 | Meta tags on legal pages | 3 legal page files | Indexing |
| 5 | Update llms.txt / llms-full.txt | 2 files | AI discoverability |
| 6 | Article time OG meta tags | `BlogLayout.tsx` + 12 blog pages | Social sharing |
| 7 | noindex on auth pages | `Auth.tsx`, `ForgotPassword.tsx` | Crawl budget |

### Technical Notes

- No new dependencies required
- BlogLayout changes benefit all 12 existing + future blog articles automatically
- The breadcrumb schema and visible breadcrumb are both handled in BlogLayout, keeping individual article files untouched for items 2-3
- Item 6 requires a small prop addition to BlogLayout and passing dates from each blog page

