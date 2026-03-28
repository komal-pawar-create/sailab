

# Plan: Add 6 Research-Oriented & Customer Awareness Blog Posts

## Current State
18 blog posts across 7 clusters, mostly product-focused. Missing: industry research/trends, patient education, and awareness-stage content that attracts top-of-funnel visitors.

## New Posts (2 new clusters + expanding existing ones)

| # | Slug | Title | Cluster | Type |
|---|------|-------|---------|------|
| 1 | `pathology-lab-industry-trends-india-2026` | Pathology Lab Industry in India 2026: Market Size, Trends & Growth Drivers | `industry-research` | Research |
| 2 | `ai-machine-learning-pathology-labs` | How AI and Machine Learning Are Transforming Pathology Labs in India | `industry-research` | Research |
| 3 | `patient-guide-understanding-lab-reports` | Understanding Your Lab Reports: A Patient's Complete Guide | `patient-awareness` | Awareness |
| 4 | `why-lab-tests-cost-different-prices` | Why Lab Tests Cost Different Prices: What Patients Should Know | `patient-awareness` | Awareness |
| 5 | `preventive-health-checkup-guide-india` | Preventive Health Checkups in India: Which Tests You Actually Need | `patient-awareness` | Awareness |
| 6 | `lab-quality-control-best-practices` | Lab Quality Control: Best Practices Every Lab Owner Must Follow in 2026 | `compliance` | Research |

## New Clusters to Add
- **`industry-research`** — label: "Industry Research"
- **`patient-awareness`** — label: "Patient Awareness"

## Files to Create (6)
- `src/pages/blog/PathologyIndustryTrends.tsx`
- `src/pages/blog/AiInPathologyLabs.tsx`
- `src/pages/blog/PatientGuideLabReports.tsx`
- `src/pages/blog/LabTestPricing.tsx`
- `src/pages/blog/PreventiveHealthCheckups.tsx`
- `src/pages/blog/LabQualityControl.tsx`

Each follows the existing pattern: SLUG constant, `getBlogPost`, `getArticleJsonLd`, TOC sidebar, prose article (~800 words), internal cross-links, `BlogCTA`, related posts grid.

## Files to Modify (3)
1. **`src/lib/blogData.ts`** — Add 6 new entries to `blogPosts` array + 2 new clusters to `blogClusters`
2. **`src/App.tsx`** — Add 6 lazy imports + 6 Route entries
3. **`public/sitemap.xml`** — Add 6 new URL entries

## Content Strategy
- Research posts use statistics, market data, and trend analysis to attract lab owners researching industry direction
- Patient awareness posts target end-consumers searching health queries — drives massive organic traffic and brand recognition
- All posts cross-link to existing product-focused articles (funnel from awareness to consideration)
- Dated `2026-03-28` for freshness

