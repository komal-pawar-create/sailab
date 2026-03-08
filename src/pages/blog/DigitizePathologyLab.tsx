import React from 'react';
import { Link } from 'react-router-dom';
import BlogLayout from '@/components/blog/BlogLayout';
import BlogCTA from '@/components/blog/BlogCTA';
import TableOfContents from '@/components/blog/TableOfContents';
import BlogCard from '@/components/blog/BlogCard';
import { getRelatedPosts, getBlogPost } from '@/lib/blogData';
import { getArticleJsonLd } from '@/lib/blogJsonLd';

const SLUG = 'how-to-digitize-pathology-lab';
const post = getBlogPost(SLUG)!;
const tocItems = [
  { id: 'why-digitize', label: 'Why Digitize?' },
  { id: 'step-by-step', label: 'Step-by-Step Guide' },
  { id: 'common-mistakes', label: 'Common Mistakes' },
  { id: 'costs', label: 'Costs & ROI' },
];

const DigitizePathologyLab = () => {
  const related = getRelatedPosts(SLUG);
  return (
    <BlogLayout title={post.title} description={post.excerpt} canonicalSlug={SLUG} datePublished={post.datePublished} dateModified={post.dateModified} ogImage={post.ogImage} jsonLd={{
      '@context': 'https://schema.org', '@type': 'Article', headline: post.title, description: post.excerpt,
      author: { '@type': 'Organization', name: 'LabFlow' }, publisher: { '@type': 'Organization', name: 'LabFlow', url: 'https://labflow.mywebz.in' },
      datePublished: post.datePublished, dateModified: post.dateModified, mainEntityOfPage: `https://labflow.mywebz.in/blog/${SLUG}`, image: post.ogImage || 'https://labflow.mywebz.in/images/labflow-logo.png',
    }}>
      <div className="max-w-6xl mx-auto px-4">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-10">
          <article className="prose prose-neutral dark:prose-invert max-w-none">
            <h1>{post.title}</h1>
            <p className="lead text-muted-foreground">{post.excerpt}</p>
            <div className="flex items-center gap-4 text-sm text-muted-foreground mb-8">
              <time dateTime={post.datePublished}>{new Date(post.datePublished).toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' })}</time>
              <span>•</span><span>{post.readTime}</span>
            </div>

            <h2 id="why-digitize">Why Digitize Your Pathology Lab?</h2>
            <p>The Indian diagnostic industry is growing at 15% annually. Labs that continue with paper-based systems risk falling behind competitors who offer faster results, online reports, and seamless patient experiences.</p>
            <p>Digital transformation is no longer optional — it's a survival strategy. Here's what going digital means for your lab:</p>
            <ul>
              <li><strong>Speed:</strong> Generate reports in minutes instead of hours</li>
              <li><strong>Accuracy:</strong> Eliminate handwriting errors and manual calculations</li>
              <li><strong>Compliance:</strong> Meet <Link to="/blog/nabl-accreditation-guide">NABL accreditation requirements</Link> with standardized workflows</li>
              <li><strong>Growth:</strong> Scale to <Link to="/blog/multi-branch-lab-management">multiple branches</Link> without losing control</li>
            </ul>

            <h2 id="step-by-step">Step-by-Step Guide to Digitization</h2>
            <h3>Step 1: Audit Your Current Workflow</h3>
            <p>Map every process from patient registration to report delivery. Identify bottlenecks — these are your biggest digitization opportunities.</p>
            <h3>Step 2: Choose the Right <Link to="/blog/what-is-lims-software">LIMS Software</Link></h3>
            <p>Select a <Link to="/blog/best-lims-software-india">LIMS that fits your lab size and budget</Link>. Prioritize ease of use, as staff adoption is the biggest factor in successful digitization.</p>
            <h3>Step 3: Digitize Billing First</h3>
            <p><Link to="/blog/gst-billing-for-pathology-labs">Start with billing</Link> — it shows immediate ROI through fewer errors and faster collections. Ensure your software handles GST compliance automatically.</p>
            <h3>Step 4: Move to Digital Reports</h3>
            <p>Transition to <Link to="/blog/digital-lab-reports-guide">digital lab reports</Link> with professional templates. Patients increasingly expect online access to their results.</p>
            <h3>Step 5: Train Staff and Go Live</h3>
            <p>Invest in proper training. Most modern LIMS software like <Link to="/product-tour">LabFlow</Link> can be learned in a day, but ongoing support ensures smooth adoption.</p>

            <h2 id="common-mistakes">Common Digitization Mistakes</h2>
            <ul>
              <li>Trying to digitize everything at once instead of a phased approach</li>
              <li>Choosing software based solely on price without evaluating features</li>
              <li>Not involving lab technicians in the software selection process</li>
              <li>Skipping data migration from existing records</li>
            </ul>

            <h2 id="costs">Costs & ROI</h2>
            <p>A cloud-based LIMS typically costs ₹200–500/month per user. Most labs see ROI within 3 months through time savings, reduced errors, and improved collections. View <Link to="/#pricing" className="text-primary">LabFlow pricing →</Link></p>

            <BlogCTA source="blog_digitize_lab" />
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

export default DigitizePathologyLab;
