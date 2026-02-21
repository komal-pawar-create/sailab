import React from 'react';
import { Link } from 'react-router-dom';
import BlogLayout from '@/components/blog/BlogLayout';
import BlogCTA from '@/components/blog/BlogCTA';
import TableOfContents from '@/components/blog/TableOfContents';
import BlogCard from '@/components/blog/BlogCard';
import { getRelatedPosts, getBlogPost } from '@/lib/blogData';

const SLUG = 'nabl-accreditation-guide';
const post = getBlogPost(SLUG)!;
const tocItems = [
  { id: 'what-is-nabl', label: 'What is NABL?' },
  { id: 'requirements', label: 'Key Requirements' },
  { id: 'software-role', label: 'How Software Helps' },
  { id: 'preparation', label: 'Preparing for Accreditation' },
];

const NablAccreditation = () => {
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

            <h2 id="what-is-nabl">What is NABL Accreditation?</h2>
            <p><strong>NABL (National Accreditation Board for Testing and Calibration Laboratories)</strong> is the body that certifies medical laboratories in India meet international quality standards (ISO 15189). NABL accreditation is increasingly becoming mandatory for labs seeking empanelment with insurance companies and government schemes like Ayushman Bharat.</p>

            <h2 id="requirements">Key Requirements for NABL</h2>
            <p>NABL accreditation requires labs to demonstrate:</p>
            <ul>
              <li><strong>Document control:</strong> All procedures must be documented, versioned, and accessible</li>
              <li><strong>Quality management:</strong> Internal quality control (IQC) and external quality assessment (EQA) programs</li>
              <li><strong>Personnel competence:</strong> Staff qualifications and training records</li>
              <li><strong>Equipment calibration:</strong> Regular calibration with documented records</li>
              <li><strong>Sample management:</strong> Proper sample collection, labeling, transport, and storage protocols</li>
              <li><strong>Reporting standards:</strong> <Link to="/blog/digital-lab-reports-guide">Standardized report formats</Link> with all required fields</li>
              <li><strong>Audit trails:</strong> Complete traceability of all results and actions</li>
            </ul>

            <h2 id="software-role">How LIMS Software Helps with NABL</h2>
            <p>A good <Link to="/blog/what-is-lims-software">LIMS system</Link> automates many NABL requirements:</p>
            <ul>
              <li><strong>Automatic audit trails:</strong> Every action is logged with user ID, timestamp, and details</li>
              <li><strong>SOP management:</strong> Standard operating procedures stored and accessible within the system</li>
              <li><strong>QC tracking:</strong> Built-in quality control charts and Westgard rules</li>
              <li><strong>Document management:</strong> Centralized storage with version control</li>
              <li><strong>Standardized reports:</strong> Consistent format meeting ISO 15189 requirements</li>
              <li><strong>Sample tracking:</strong> Barcode-based chain of custody from collection to reporting</li>
            </ul>

            <h2 id="preparation">Preparing for NABL Accreditation</h2>
            <p>The preparation process typically takes 6-12 months. Here's a roadmap:</p>
            <ol>
              <li><strong>Implement a LIMS:</strong> <Link to="/blog/how-to-digitize-pathology-lab">Digitize your lab operations</Link> first</li>
              <li><strong>Establish QC programs:</strong> Set up internal and external quality controls</li>
              <li><strong>Document everything:</strong> SOPs, calibration records, training logs</li>
              <li><strong>Conduct internal audits:</strong> Identify gaps before the NABL assessment</li>
              <li><strong>Apply and prepare:</strong> Submit your application and prepare for the assessment visit</li>
            </ol>
            <p>LabFlow includes built-in compliance features to help you prepare: <Link to="/#features" className="text-primary">Explore Features →</Link></p>

            <BlogCTA source="blog_nabl" />
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

export default NablAccreditation;
