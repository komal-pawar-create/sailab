import React from 'react';
import { Link } from 'react-router-dom';
import BlogLayout from '@/components/blog/BlogLayout';
import BlogCTA from '@/components/blog/BlogCTA';
import TableOfContents from '@/components/blog/TableOfContents';
import BlogCard from '@/components/blog/BlogCard';
import { getRelatedPosts, getBlogPost } from '@/lib/blogData';
import { getArticleJsonLd } from '@/lib/blogJsonLd';

const SLUG = 'lab-report-formats-templates';
const post = getBlogPost(SLUG)!;
const tocItems = [
  { id: 'why-format-matters', label: 'Why Report Format Matters' },
  { id: 'essential-elements', label: 'Essential Report Elements' },
  { id: 'best-practices', label: 'Best Practices' },
  { id: 'templates', label: 'Free Templates & Tools' },
];

const LabReportFormats = () => {
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

            <h2 id="why-format-matters">Why Lab Report Format Matters</h2>
            <p>A well-designed lab report is more than just data — it's a communication tool between the lab and the treating physician. Poor formatting leads to misinterpretation, delayed diagnosis, and <Link to="/blog/reduce-patient-complaints-pathology-lab">patient complaints</Link>.</p>
            <p>For <Link to="/blog/nabl-accreditation-guide">NABL-accredited labs</Link>, report formats must meet specific ISO 15189 requirements including patient demographics, reference ranges, units, methodology, and authorised signatures.</p>

            <h2 id="essential-elements">Essential Elements of a Lab Report</h2>
            <ul>
              <li><strong>Patient Information</strong> — Full name, age, gender, unique patient ID, referring doctor</li>
              <li><strong>Sample Details</strong> — Sample type, collection date/time, received date/time, sample ID/barcode</li>
              <li><strong>Test Results</strong> — Parameter name, result value, unit, reference range, abnormal flag (H/L)</li>
              <li><strong>Lab Information</strong> — Lab name, address, NABL accreditation number, contact details</li>
              <li><strong>Authorisation</strong> — Pathologist name, qualification, digital signature, report date</li>
              <li><strong>Interpretive Comments</strong> — Clinical notes, methodology used, limitations (when applicable)</li>
            </ul>

            <h2 id="best-practices">Best Practices for Lab Report Design</h2>
            <h3>Use Clear Visual Hierarchy</h3>
            <p>Abnormal values should be immediately visible — bold text, colour coding (red for critical), or flagging with arrows. Doctors scan reports quickly; make critical findings impossible to miss.</p>
            <h3>Consistent Formatting Across Tests</h3>
            <p>Whether it's a CBC, lipid profile, or thyroid panel, the layout should be consistent. This reduces cognitive load for doctors reading multiple reports from your lab.</p>
            <h3>Include QR Codes for Verification</h3>
            <p>A QR code linking to a secure <Link to="/blog/digital-lab-reports-guide">digital copy of the report</Link> helps patients verify authenticity and share reports with specialists easily.</p>
            <h3>Multi-Language Support</h3>
            <p>In India, offering reports in both English and the local language (Hindi, Marathi, etc.) significantly improves patient understanding and satisfaction.</p>

            <h2 id="templates">Free Templates & How Software Helps</h2>
            <p>Instead of manually designing reports in Word or Excel, modern <Link to="/blog/what-is-lims-software">LIMS software</Link> auto-generates professionally formatted reports from test results. LabFlow includes customisable report templates with your lab's letterhead, digital signatures, and automatic abnormal value highlighting.</p>
            <p>You can also upload your existing letterhead and configure templates for different test categories — haematology, biochemistry, microbiology, and more.</p>

            <BlogCTA source="blog_report_formats" />
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

export default LabReportFormats;
