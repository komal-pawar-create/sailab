import React from 'react';
import { Link } from 'react-router-dom';
import BlogLayout from '@/components/blog/BlogLayout';
import BlogCTA from '@/components/blog/BlogCTA';
import TableOfContents from '@/components/blog/TableOfContents';
import BlogCard from '@/components/blog/BlogCard';
import { getRelatedPosts, getBlogPost } from '@/lib/blogData';

const SLUG = 'digital-lab-reports-guide';
const post = getBlogPost(SLUG)!;
const tocItems = [
  { id: 'problem', label: 'The Problem with Manual Reports' },
  { id: 'benefits', label: 'Benefits of Digital Reports' },
  { id: 'features', label: 'Essential Features' },
  { id: 'getting-started', label: 'Getting Started' },
];

const DigitalLabReports = () => {
  const related = getRelatedPosts(SLUG);
  return (
    <BlogLayout title={post.title} description={post.excerpt} canonicalSlug={SLUG} datePublished={post.datePublished} dateModified={post.dateModified} jsonLd={{
      '@context': 'https://schema.org', '@type': 'Article', headline: post.title, description: post.excerpt,
      author: { '@type': 'Organization', name: 'LabFlow' }, publisher: { '@type': 'Organization', name: 'LabFlow', url: 'https://labflow.mywebz.in' },
      datePublished: post.datePublished, dateModified: post.dateModified, mainEntityOfPage: `https://labflow.mywebz.in/blog/${SLUG}`, image: 'https://labflow.mywebz.in/images/labflow-logo.png',
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

            <h2 id="problem">The Problem with Manual Lab Reports</h2>
            <p>Handwritten or manually typed lab reports are still common in Indian labs. But they come with serious downsides:</p>
            <ul>
              <li><strong>Illegibility:</strong> Handwritten values can be misread by doctors and patients</li>
              <li><strong>Errors:</strong> Manual calculations and data entry increase the risk of mistakes</li>
              <li><strong>Slow delivery:</strong> Reports take hours or even days to prepare and deliver</li>
              <li><strong>No backup:</strong> Paper reports can be lost, damaged, or misplaced</li>
              <li><strong>Poor impression:</strong> Unprofessional-looking reports affect patient trust</li>
            </ul>

            <h2 id="benefits">Benefits of Digital Lab Reports</h2>
            <p>Switching to digital reports using <Link to="/blog/what-is-lims-software">LIMS software</Link> transforms the patient experience:</p>
            <ul>
              <li><strong>Instant generation:</strong> Reports are generated in seconds after results are entered</li>
              <li><strong>Professional format:</strong> Custom letterhead, logos, and standardized layouts</li>
              <li><strong>Online access:</strong> Patients can access reports via WhatsApp, email, or a patient portal</li>
              <li><strong>Reference ranges:</strong> Automatic flagging of abnormal values</li>
              <li><strong>Secure storage:</strong> All reports stored digitally with easy retrieval</li>
              <li><strong>Compliance:</strong> Meets <Link to="/blog/nabl-accreditation-guide">NABL documentation requirements</Link></li>
            </ul>

            <h2 id="features">Essential Features for Report Software</h2>
            <ol>
              <li><strong>Customizable templates</strong> for different test types (hematology, biochemistry, etc.)</li>
              <li><strong>Letterhead and branding</strong> with your lab's logo and details</li>
              <li><strong>Auto-populated reference ranges</strong> based on age and gender</li>
              <li><strong>Digital signature support</strong> for authorized signatories</li>
              <li><strong>Multi-format delivery</strong> — PDF, WhatsApp, SMS, email</li>
              <li><strong>Bulk report generation</strong> for high-volume labs</li>
            </ol>

            <h2 id="getting-started">Getting Started with Digital Reports</h2>
            <p>The transition is easier than you think. With a modern LIMS like LabFlow, you can <Link to="/blog/how-to-digitize-pathology-lab">digitize your lab</Link> in phases, starting with reports. Most labs complete the transition in under a week.</p>
            <p>See our report features in action: <Link to="/product-tour" className="text-primary">Take the Product Tour →</Link></p>

            <BlogCTA source="blog_digital_reports" />
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

export default DigitalLabReports;
