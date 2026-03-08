import React from 'react';
import { Link } from 'react-router-dom';
import BlogLayout from '@/components/blog/BlogLayout';
import BlogCTA from '@/components/blog/BlogCTA';
import TableOfContents from '@/components/blog/TableOfContents';
import BlogCard from '@/components/blog/BlogCard';
import { getRelatedPosts, getBlogPost } from '@/lib/blogData';
import { getArticleJsonLd } from '@/lib/blogJsonLd';

const SLUG = 'what-is-lims-software';
const post = getBlogPost(SLUG)!;
const tocItems = [
  { id: 'what-is-lims', label: 'What is LIMS?' },
  { id: 'why-indian-labs', label: 'Why Indian Labs Need LIMS' },
  { id: 'key-features', label: 'Key Features' },
  { id: 'benefits', label: 'Benefits' },
  { id: 'how-to-choose', label: 'How to Choose' },
];

const WhatIsLims = () => {
  const related = getRelatedPosts(SLUG);
  return (
    <BlogLayout
      title={post.title}
      description={post.excerpt}
      canonicalSlug={SLUG}
      datePublished={post.datePublished}
      dateModified={post.dateModified}
      ogImage={post.ogImage}
      jsonLd={getArticleJsonLd(post)}
      author={post.author}
      readTime={post.readTime}
    >
      <div className="max-w-6xl mx-auto px-4">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-10">
          <article className="prose prose-neutral dark:prose-invert max-w-none">
            <h1>{post.title}</h1>
            <p className="lead text-muted-foreground">{post.excerpt}</p>
            <div className="flex items-center gap-4 text-sm text-muted-foreground mb-8">
              <time dateTime={post.datePublished}>{new Date(post.datePublished).toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' })}</time>
              <span>•</span>
              <span>{post.readTime}</span>
            </div>

            <h2 id="what-is-lims">What is LIMS Software?</h2>
            <p>
              A <strong>Laboratory Information Management System (LIMS)</strong> is specialized software designed to manage the day-to-day operations of a pathology or diagnostic laboratory. It handles everything from patient registration and sample tracking to test result management, billing, and reporting.
            </p>
            <p>
              Unlike generic office software, LIMS is purpose-built for lab workflows. It understands test types, result formats, reference ranges, and the compliance requirements that labs in India must follow.
            </p>

            <h2 id="why-indian-labs">Why Do Indian Labs Need LIMS?</h2>
            <p>India has over 100,000 pathology and diagnostic labs, yet the majority still rely on paper registers, Excel sheets, or outdated software. This creates several problems:</p>
            <ul>
              <li><strong>Data errors:</strong> Manual data entry leads to transcription mistakes in reports</li>
              <li><strong>Slow turnaround:</strong> Patients wait longer for results when processes are manual</li>
              <li><strong>Billing issues:</strong> GST compliance and accurate invoicing are difficult without automation</li>
              <li><strong>No analytics:</strong> Without digital data, labs cannot track revenue trends or operational efficiency</li>
              <li><strong>Compliance gaps:</strong> <Link to="/blog/nabl-accreditation-guide">NABL accreditation</Link> requires standardized processes that manual workflows cannot guarantee</li>
            </ul>

            <h2 id="key-features">Key Features of Modern LIMS</h2>
            <p>When evaluating <Link to="/blog/best-lims-software-india">LIMS software for your Indian lab</Link>, look for these essential features:</p>
            <ol>
              <li><strong>Patient Management</strong> — Complete patient profiles with history, auto-generated IDs, and quick search</li>
              <li><strong>Sample Tracking</strong> — Barcode-based sample tracking from collection to reporting</li>
              <li><strong>Test Management</strong> — Configurable test types with reference ranges and result templates</li>
              <li><strong>Billing & Invoicing</strong> — <Link to="/blog/gst-billing-for-pathology-labs">GST-compliant billing</Link> with partial payments and ledger tracking</li>
              <li><strong>Report Generation</strong> — <Link to="/blog/digital-lab-reports-guide">Professional digital reports</Link> with customizable templates and letterhead</li>
              <li><strong>Multi-Branch Support</strong> — <Link to="/blog/multi-branch-lab-management">Centralized management</Link> for lab chains</li>
              <li><strong>Analytics & Dashboards</strong> — Real-time insights into revenue, test volumes, and operational metrics</li>
            </ol>
            <p>Explore all <Link to="/#features" className="text-primary">LabFlow features →</Link></p>

            <h2 id="benefits">Benefits of Using LIMS in Your Lab</h2>
            <p>Labs that switch to a modern LIMS typically see:</p>
            <ul>
              <li>50–70% reduction in report generation time</li>
              <li>Near-zero billing errors with automated calculations</li>
              <li>Improved patient satisfaction through faster turnaround</li>
              <li>Better compliance readiness for NABL and ISO 15189</li>
              <li>Data-driven decision making with real-time analytics</li>
            </ul>

            <h2 id="how-to-choose">How to Choose the Right LIMS</h2>
            <p>
              Choosing the right LIMS depends on your lab size, budget, and specific needs. Key factors include cloud vs on-premise deployment, pricing model, feature completeness, and vendor support quality. Read our comprehensive <Link to="/blog/best-lims-software-india">buyer's guide</Link> for a detailed comparison.
            </p>
            <p>
              Ready to see LIMS in action? <Link to="/product-tour" className="text-primary">Take the LabFlow product tour →</Link>
            </p>

            <BlogCTA source="blog_what_is_lims" />

            {/* Related Posts */}
            <h2>Related Articles</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 not-prose">
              {related.map((r) => <BlogCard key={r.slug} {...r} />)}
            </div>
          </article>
          <aside className="hidden lg:block">
            <TableOfContents items={tocItems} />
          </aside>
        </div>
      </div>
    </BlogLayout>
  );
};

export default WhatIsLims;
