import React from 'react';
import { Link } from 'react-router-dom';
import BlogLayout from '@/components/blog/BlogLayout';
import BlogCTA from '@/components/blog/BlogCTA';
import TableOfContents from '@/components/blog/TableOfContents';
import BlogCard from '@/components/blog/BlogCard';
import { getRelatedPosts, getBlogPost } from '@/lib/blogData';
import { getArticleJsonLd } from '@/lib/blogJsonLd';

const SLUG = 'sample-tracking-pathology-lab';
const post = getBlogPost(SLUG)!;
const tocItems = [
  { id: 'why-tracking', label: 'Why Sample Tracking Matters' },
  { id: 'common-errors', label: 'Common Sample Errors' },
  { id: 'how-software-helps', label: 'How Software Prevents Errors' },
  { id: 'choosing-solution', label: 'Choosing the Right Solution' },
];

const SampleTracking = () => {
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

            <h2 id="why-tracking">Why Sample Tracking Matters in Pathology Labs</h2>
            <p>In a busy pathology lab, hundreds of samples move through collection, registration, processing, and reporting every day. Without a reliable tracking system, samples get lost, mislabelled, or delayed — leading to incorrect reports, repeat collections, and patient dissatisfaction.</p>
            <p>Studies show that pre-analytical errors (sample collection and handling) account for up to <strong>70% of all laboratory errors</strong>. A robust sample tracking system is the single most effective way to reduce these errors.</p>

            <h2 id="common-errors">Common Sample Errors in Indian Labs</h2>
            <h3>1. Sample Mix-ups</h3>
            <p>When samples from different patients are swapped during labelling or processing, it leads to catastrophic misdiagnosis. Manual labelling with handwritten stickers is the primary culprit.</p>
            <h3>2. Lost Samples</h3>
            <p>Samples that go missing between collection and processing waste time and resources. The patient must return for recollection, damaging the lab's reputation.</p>
            <h3>3. Delayed Processing</h3>
            <p>Without visibility into sample status, urgent samples sit unprocessed while routine ones get priority. This inflates <Link to="/blog/reduce-lab-report-turnaround-time">report turnaround time</Link> unnecessarily.</p>
            <h3>4. Chain-of-Custody Gaps</h3>
            <p>For <Link to="/blog/nabl-accreditation-guide">NABL-accredited labs</Link>, every sample must have a documented chain of custody. Manual logs are error-prone and hard to audit.</p>

            <h2 id="how-software-helps">How Sample Tracking Software Prevents Errors</h2>
            <p>Modern <Link to="/blog/what-is-lims-software">LIMS software</Link> with integrated sample tracking provides:</p>
            <ul>
              <li><strong>Barcode/QR generation</strong> — Unique identifiers printed at collection, eliminating handwritten labels</li>
              <li><strong>Real-time status updates</strong> — Track every sample from collection → received → processing → reported</li>
              <li><strong>Automated alerts</strong> — Notifications for samples nearing TAT deadlines or stuck in a stage</li>
              <li><strong>Rejection workflows</strong> — Flag haemolysed, clotted, or insufficient samples with documented reasons</li>
              <li><strong>Complete audit trail</strong> — Every action timestamped with the operator's identity for NABL compliance</li>
            </ul>
            <p>Labs using digital sample tracking report a <strong>60% reduction in sample-related errors</strong> and a <strong>40% improvement in TAT</strong> within the first three months.</p>

            <h2 id="choosing-solution">Choosing the Right Sample Tracking Solution</h2>
            <p>When evaluating <Link to="/blog/best-lims-software-india">LIMS software in India</Link>, ensure sample tracking includes barcode printing, mobile-friendly status updates for collection staff, and integration with your <Link to="/blog/lab-billing-software-features">billing workflow</Link>.</p>
            <p>LabFlow provides end-to-end sample tracking with barcode generation, real-time dashboards, and automated TAT alerts — all included in every plan.</p>

            <BlogCTA source="blog_sample_tracking" />
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

export default SampleTracking;
