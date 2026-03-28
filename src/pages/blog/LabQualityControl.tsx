import React from 'react';
import { Link } from 'react-router-dom';
import BlogLayout from '@/components/blog/BlogLayout';
import BlogCTA from '@/components/blog/BlogCTA';
import TableOfContents from '@/components/blog/TableOfContents';
import BlogCard from '@/components/blog/BlogCard';
import { getRelatedPosts, getBlogPost } from '@/lib/blogData';
import { getArticleJsonLd } from '@/lib/blogJsonLd';

const SLUG = 'lab-quality-control-best-practices';
const post = getBlogPost(SLUG)!;
const tocItems = [
  { id: 'why-qc', label: 'Why QC Matters' },
  { id: 'iqc-eqas', label: 'IQC vs EQAS' },
  { id: 'best-practices', label: 'Best Practices Checklist' },
  { id: 'software-role', label: 'How Software Helps' },
];

const LabQualityControl = () => {
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

            <h2 id="why-qc">Why Quality Control Is Non-Negotiable</h2>
            <p>Laboratory errors affect 1 in every 130 test results, according to international studies. In a lab processing 200 samples daily, that's 1-2 erroneous reports <em>every single day</em> — each potentially leading to misdiagnosis, wrong treatment, or <Link to="/blog/reduce-patient-complaints-pathology-lab">patient complaints</Link>.</p>
            <p>Quality control (QC) is the systematic process of monitoring and validating that your lab's analytical systems produce accurate, precise, and reproducible results. For <Link to="/blog/nabl-accreditation-guide">NABL-accredited labs</Link>, robust QC is mandatory under ISO 15189.</p>

            <h2 id="iqc-eqas">Internal QC (IQC) vs External Quality Assessment (EQAS)</h2>
            <h3>Internal Quality Control (IQC)</h3>
            <p>IQC involves running control samples (with known values) alongside patient samples every day. If controls fall outside acceptable limits (typically ±2 SD), patient results from that run are flagged for review.</p>
            <ul>
              <li>Run controls at the <strong>start of each shift</strong> and after calibration</li>
              <li>Use <strong>two levels</strong> of controls (normal and abnormal) for each analyte</li>
              <li>Apply <strong>Westgard rules</strong> (1-2s, 1-3s, 2-2s, R-4s) to detect systematic and random errors</li>
              <li>Document all QC results and corrective actions</li>
            </ul>

            <h3>External Quality Assessment (EQAS)</h3>
            <p>EQAS (or proficiency testing) involves testing unknown samples from an external agency and comparing your results with other labs. This validates your IQC program and is required for NABL accreditation.</p>
            <ul>
              <li>Enrol with a recognised EQAS provider (e.g., CMC Vellore, Bio-Rad, RIQAS)</li>
              <li>Participate in <strong>every cycle</strong> — missed cycles are flagged during NABL audits</li>
              <li>Investigate and document corrective actions for any unsatisfactory results</li>
            </ul>

            <h2 id="best-practices">Quality Control Best Practices Checklist</h2>
            <ol>
              <li><strong>Pre-analytical QC</strong> — Verify patient identity, check sample quality (haemolysis, lipemia, clots), ensure proper <Link to="/blog/sample-tracking-pathology-lab">sample collection and tracking</Link></li>
              <li><strong>Analytical QC</strong> — Daily IQC, regular calibration, preventive maintenance schedules, Levy-Jennings charts</li>
              <li><strong>Post-analytical QC</strong> — Delta checks (comparing current results with patient's previous values), critical value alerts, pathologist review of all abnormal results</li>
              <li><strong>Document everything</strong> — Maintain QC logs, corrective action records, equipment maintenance logs, and <Link to="/blog/lab-report-formats-templates">standardised report templates</Link></li>
              <li><strong>Staff training</strong> — Regular competency assessments, SOP training, and error reporting culture. Addressing <Link to="/blog/lab-staff-management-challenges">staff management challenges</Link> directly improves QC compliance.</li>
              <li><strong>Reagent management</strong> — FIFO inventory, temperature monitoring, lot-to-lot validation, and expiry tracking</li>
              <li><strong>Instrument maintenance</strong> — Preventive maintenance schedules, breakdown logs, and backup plans</li>
            </ol>

            <h2 id="software-role">How LIMS Software Automates Quality Control</h2>
            <p>Manual QC tracking on paper or Excel is error-prone and time-consuming. Modern <Link to="/blog/what-is-lims-software">LIMS software</Link> automates the entire QC workflow:</p>
            <ul>
              <li><strong>Automated Westgard rule application</strong> — Instantly flags QC failures and blocks patient result release</li>
              <li><strong>Digital Levy-Jennings charts</strong> — Real-time trend monitoring with automatic alerts for drift</li>
              <li><strong>Delta checks</strong> — Automatic comparison with patient's previous results, flagging significant changes</li>
              <li><strong>Audit trail</strong> — Complete documentation of QC data, actions taken, and approvals</li>
              <li><strong>EQAS tracking</strong> — Schedule reminders, result entry, and performance trend analysis</li>
            </ul>
            <p>Labs using automated QC through LIMS report <strong>60% fewer analytical errors</strong> and spend 70% less time on QC documentation, directly improving the <Link to="/blog/lab-automation-roi-calculator">ROI of lab automation</Link>.</p>

            <BlogCTA source="blog_quality_control" />
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

export default LabQualityControl;
