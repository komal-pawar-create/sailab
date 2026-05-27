
# Plan: New AI + Industry-Updates Blog Posts & SEO Boost

## Goal
Publish 4 fresh, SEO-optimized blog posts focused on **AI in labs** and **2026 lab industry updates**, then strengthen on-site SEO signals so they index and rank faster.

## New Blog Posts (4)

| # | Slug | Title (target keyword) | Cluster |
|---|------|------------------------|---------|
| 1 | `ai-lab-report-generation-2026` | AI-Powered Lab Report Generation: How Indian Labs Use It in 2026 | lab-reports |
| 2 | `generative-ai-pathology-diagnostics` | Generative AI in Pathology Diagnostics: Use Cases, Accuracy & ROI | lab-management |
| 3 | `lab-industry-trends-2026` | Lab Industry Trends 2026: AI, NABH Digital Health, ABDM & What's Next | lab-management |
| 4 | `ai-chatbot-patient-communication-labs` | AI Chatbots for Patient Communication in Diagnostic Labs | lab-management |

Each post (~1200-1500 words) will include:
- Proper H1/H2/H3 hierarchy, TOC, internal links to existing posts (LIMS, digitize, turnaround time, AI in pathology, WhatsApp reports, NABL, data security)
- BlogCTA, related-posts grid, Article + Breadcrumb JSON-LD (via existing `BlogLayout`)
- Indian context (ABDM, NDHM, DPDPA 2023, NABL/NABH), real workflow examples
- 4-6 long-tail keywords each

## Wiring (per post)
- Add entry to `src/lib/blogData.ts` (with cluster + keywords + dates)
- Create `src/pages/blog/<Name>.tsx` mirroring `AiInPathologyLabs.tsx` structure
- Register `React.lazy` import + `<Route>` in `src/App.tsx`
- Add `<url>` entry in `public/sitemap.xml` with current `lastmod`

## SEO Improvements

1. **Sitemap freshness** — bump `<lastmod>` on the blog index + add 4 new URLs.
2. **Internal linking** — add contextual links from existing AI/LIMS posts → the 4 new ones (and vice-versa) so they're crawl-discoverable from day 1.
3. **`public/llms.txt` + `llms-full.txt`** — append the new article titles + URLs so AI search engines (Perplexity, ChatGPT, etc.) can discover them.
4. **IndexNow ping** — no code change needed; user can click the existing "Notify Search Engines" button on `/blog` after publish (already implemented).
5. **Blog index hero** — add a short "Latest: AI & 2026 Trends" highlight strip above the cluster filters linking to the 4 new posts, improving CTR + crawl depth.
6. **Trigger an SEO scan** at the end so any regressions (missing meta, duplicate H1s, etc.) surface in the SEO panel.

## Out of Scope
- New OG images (existing posts reuse the brand image; we'll do the same — no placeholder generation)
- Backend / RLS / functions changes
- Changes to existing blog post bodies beyond adding 1-2 internal links each

## Files Changed

| File | Change |
|------|--------|
| `src/lib/blogData.ts` | +4 post entries |
| `src/pages/blog/AiLabReportGeneration.tsx` | NEW |
| `src/pages/blog/GenerativeAiPathology.tsx` | NEW |
| `src/pages/blog/LabIndustryTrends2026.tsx` | NEW |
| `src/pages/blog/AiChatbotPatientComms.tsx` | NEW |
| `src/App.tsx` | 4 lazy imports + 4 routes |
| `public/sitemap.xml` | +4 URLs, bumped lastmod |
| `public/llms.txt`, `public/llms-full.txt` | Append new posts |
| `src/pages/Blog.tsx` | "Latest" highlight strip |
| `src/pages/blog/AiInPathologyLabs.tsx` | 1-2 internal links to new AI posts |

## Verify
- `/blog` shows 4 new cards under their clusters + highlight strip
- Each new URL renders with proper title/meta/JSON-LD (Helmet via BlogLayout)
- Sitemap validates
- SEO scan returns 0 new failing findings
