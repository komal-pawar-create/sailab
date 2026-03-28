import React from 'react';
import { Link } from 'react-router-dom';
import BlogLayout from '@/components/blog/BlogLayout';
import BlogCTA from '@/components/blog/BlogCTA';
import TableOfContents from '@/components/blog/TableOfContents';
import BlogCard from '@/components/blog/BlogCard';
import { getRelatedPosts, getBlogPost } from '@/lib/blogData';
import { getArticleJsonLd } from '@/lib/blogJsonLd';

const SLUG = 'preventive-health-checkup-guide-india';
const post = getBlogPost(SLUG)!;
const tocItems = [
  { id: 'why-preventive', label: 'Why Preventive Checkups Matter' },
  { id: 'age-wise', label: 'Tests by Age Group' },
  { id: 'packages', label: 'Choosing the Right Package' },
  { id: 'frequency', label: 'How Often to Get Tested' },
];

const PreventiveHealthCheckups = () => {
  const related = getRelatedPosts(SLUG);
  return (
    <BlogLayout title={post.title} description={post.excerpt} canonicalSlug={SLUG} datePublished={post.datePublished} dateModified={post.dateModified} ogImage={post.ogImage} jsonLd={getArticleJsonLd(post)} author={post.author} readTime={post.readTime}>
      <div className="max-w-6xl mx-auto px-4">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-10">
          <article className="prose prose-neutral dark:prose-invert max-w-none">
            <h1>{post.title}</h1>
            <p className="lead text-muted-foreground">{post.excerpt}</p>
            <div className="flex items-center gap-4 text-sm text-muted-foreground mb-8">
              <time dateTime={post.datePublished}>{new Date(post.datePublished).toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' })}</time>
              <span>•</span><span>{post.readTime}</span>
            </div>

            <h2 id="why-preventive">Why Preventive Health Checkups Matter</h2>
            <p>India faces a silent epidemic of lifestyle diseases. According to ICMR data, <strong>1 in 4 Indians</strong> has hypertension, <strong>1 in 10</strong> has diabetes, and <strong>1 in 5</strong> has abnormal cholesterol levels — most without knowing it.</p>
            <p>Preventive health checkups catch these conditions early, when treatment is most effective and least expensive. A ₹2,000 annual checkup can prevent a ₹5 lakh cardiac emergency. Yet, less than 5% of Indians get regular preventive screenings.</p>
            <p>Modern labs make this easy with comprehensive packages, home collection, and <Link to="/blog/whatsapp-reports-patient-communication">WhatsApp report delivery</Link> — removing every barrier to getting tested.</p>

            <h2 id="age-wise">Recommended Tests by Age Group</h2>
            <h3>Ages 20-30: Baseline Screening</h3>
            <ul>
              <li>Complete Blood Count (CBC)</li>
              <li>Blood sugar (fasting)</li>
              <li>Lipid profile</li>
              <li>Thyroid function (TSH) — especially for women</li>
              <li>Vitamin D and B12 — deficiency is rampant in India</li>
              <li>Urine routine examination</li>
            </ul>

            <h3>Ages 30-45: Expanded Screening</h3>
            <ul>
              <li>All of the above, plus:</li>
              <li>HbA1c (diabetes risk assessment)</li>
              <li>Liver function tests (LFT)</li>
              <li>Kidney function tests (KFT/RFT)</li>
              <li>ECG (for those with family history of heart disease)</li>
              <li>Women: Pap smear every 3 years</li>
            </ul>

            <h3>Ages 45-60: Comprehensive Screening</h3>
            <ul>
              <li>All of the above, plus:</li>
              <li>PSA (for men — prostate cancer screening)</li>
              <li>Mammography (for women)</li>
              <li>Bone density test (DEXA) — especially for post-menopausal women</li>
              <li>Stool occult blood test (colorectal cancer screening)</li>
              <li>Eye examination including retinal screening</li>
            </ul>

            <h3>Ages 60+: Annual Comprehensive</h3>
            <ul>
              <li>All of the above with increased frequency</li>
              <li>Cardiac markers (Troponin, BNP)</li>
              <li>Cancer markers as recommended by your doctor</li>
              <li>Pulmonary function tests</li>
              <li>Cognitive screening</li>
            </ul>

            <h2 id="packages">Choosing the Right Health Checkup Package</h2>
            <p>Most labs offer tiered packages. Here's how to choose:</p>
            <ul>
              <li><strong>Basic package (₹999-1,999)</strong> — CBC, blood sugar, lipid profile, thyroid, urine routine. Good for healthy individuals under 30.</li>
              <li><strong>Comprehensive package (₹2,999-4,999)</strong> — Adds liver, kidney, vitamin tests, and HbA1c. Recommended for 30-45 age group.</li>
              <li><strong>Executive package (₹5,999-9,999)</strong> — Adds cardiac markers, cancer screening, imaging. Best for 45+ or those with family history of chronic diseases.</li>
            </ul>
            <p>Always choose an <Link to="/blog/nabl-accreditation-guide">NABL-accredited lab</Link> for health checkups. The <Link to="/blog/why-lab-tests-cost-different-prices">price difference</Link> is worth the accuracy guarantee.</p>

            <h2 id="frequency">How Often Should You Get Tested?</h2>
            <ul>
              <li><strong>Under 30, no risk factors</strong> — Every 2-3 years</li>
              <li><strong>30-45, no risk factors</strong> — Annually</li>
              <li><strong>Family history of diabetes/heart disease</strong> — Annually from age 25</li>
              <li><strong>Known chronic conditions</strong> — Every 3-6 months as advised by your doctor</li>
              <li><strong>Post-45</strong> — Annually, with additional tests as recommended</li>
            </ul>
            <p>Keep all your reports in one place — labs using <Link to="/blog/digital-lab-reports-guide">digital report systems</Link> let you access your complete history anytime, making it easy to track trends over the years.</p>

            <BlogCTA source="blog_preventive_health" />
            <h2>Related Articles</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 not-prose">
              {related.map((r) => <BlogCard key={r.slug} {...r} />)}
            </div>
          </article>
          <aside className="hidden lg:block"><TableOfContents items={tocItems} /></aside>
        </div>
      </div>
    </BlogLayout>
  );
};

export default PreventiveHealthCheckups;
