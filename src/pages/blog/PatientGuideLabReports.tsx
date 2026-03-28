import React from 'react';
import { Link } from 'react-router-dom';
import BlogLayout from '@/components/blog/BlogLayout';
import BlogCTA from '@/components/blog/BlogCTA';
import TableOfContents from '@/components/blog/TableOfContents';
import BlogCard from '@/components/blog/BlogCard';
import { getRelatedPosts, getBlogPost } from '@/lib/blogData';
import { getArticleJsonLd } from '@/lib/blogJsonLd';

const SLUG = 'patient-guide-understanding-lab-reports';
const post = getBlogPost(SLUG)!;
const tocItems = [
  { id: 'anatomy', label: 'Anatomy of a Lab Report' },
  { id: 'common-tests', label: 'Understanding Common Tests' },
  { id: 'reference-ranges', label: 'Reading Reference Ranges' },
  { id: 'next-steps', label: 'What to Do Next' },
];

const PatientGuideLabReports = () => {
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

            <h2 id="anatomy">Anatomy of a Lab Report</h2>
            <p>A lab report may look intimidating with its numbers, abbreviations, and medical jargon, but every section serves a clear purpose. Here's what you'll typically find:</p>
            <ul>
              <li><strong>Patient information</strong> — Your name, age, gender, and a unique patient ID ensure the report belongs to you</li>
              <li><strong>Sample details</strong> — When your blood/urine was collected and what type of sample was tested</li>
              <li><strong>Test results</strong> — The actual values measured, with units (mg/dL, mmol/L, cells/µL, etc.)</li>
              <li><strong>Reference ranges</strong> — The "normal" range for each test, so you can see if your values are within bounds</li>
              <li><strong>Abnormal flags</strong> — Letters like <strong>H</strong> (high) or <strong>L</strong> (low) next to values outside the reference range</li>
              <li><strong>Lab information</strong> — The lab's name, accreditation status, and pathologist's signature</li>
            </ul>
            <p>Modern labs using <Link to="/blog/digital-lab-reports-guide">digital report software</Link> often include colour-coded abnormal values and QR codes for verification, making reports easier to read.</p>

            <h2 id="common-tests">Understanding Common Tests</h2>
            <h3>Complete Blood Count (CBC)</h3>
            <p>The most frequently ordered test. Key parameters include haemoglobin (Hb), white blood cell count (WBC), platelet count, and red blood cell indices. Low haemoglobin may indicate anaemia, while high WBC could suggest infection.</p>
            <h3>Lipid Profile</h3>
            <p>Measures total cholesterol, LDL ("bad" cholesterol), HDL ("good" cholesterol), and triglycerides. Used to assess cardiovascular risk. Your doctor looks at the <strong>ratio</strong> of total cholesterol to HDL, not just individual numbers.</p>
            <h3>Blood Sugar (Glucose)</h3>
            <p>Fasting blood sugar (FBS), post-prandial blood sugar (PPBS), and HbA1c are the three key diabetes markers. HbA1c gives a 3-month average, making it the most reliable indicator of blood sugar control.</p>
            <h3>Thyroid Function Tests (TFT)</h3>
            <p>TSH, T3, and T4 assess thyroid health. An elevated TSH with low T4 indicates hypothyroidism — extremely common in India, affecting ~10% of the population.</p>
            <h3>Liver Function Tests (LFT)</h3>
            <p>SGOT, SGPT, bilirubin, and albumin assess liver health. Elevated liver enzymes may indicate fatty liver, hepatitis, or medication side effects.</p>

            <h2 id="reference-ranges">How to Read Reference Ranges</h2>
            <p>Reference ranges represent the values found in 95% of healthy individuals. Important things to know:</p>
            <ul>
              <li><strong>Slightly out-of-range doesn't always mean disease</strong> — A value marginally above or below the range may be your normal. Your doctor considers trends over time, not single values.</li>
              <li><strong>Ranges vary by lab</strong> — Different instruments and methods produce slightly different reference ranges. Always compare your results against the range printed on <em>that specific report</em>.</li>
              <li><strong>Age and gender matter</strong> — Reference ranges for children differ from adults, and many tests have separate male/female ranges.</li>
              <li><strong>Fasting affects results</strong> — Blood sugar, lipid profile, and iron studies require 8-12 hours of fasting. Non-fasting samples give inaccurate results.</li>
            </ul>

            <h2 id="next-steps">What to Do After Getting Your Report</h2>
            <ol>
              <li><strong>Don't panic</strong> — Abnormal values don't automatically mean a serious condition. Wait for your doctor's interpretation.</li>
              <li><strong>Show your doctor</strong> — Never self-diagnose based on lab reports. Your doctor considers your symptoms, history, and multiple test results together.</li>
              <li><strong>Keep a record</strong> — Store your reports chronologically. Labs using <Link to="/blog/whatsapp-reports-patient-communication">WhatsApp delivery</Link> make this easier with digital copies.</li>
              <li><strong>Get regular checkups</strong> — <Link to="/blog/preventive-health-checkup-guide-india">Preventive health checkups</Link> help catch problems early when they're easiest to treat.</li>
              <li><strong>Ask questions</strong> — If anything is unclear, ask your lab or doctor. Good labs welcome patient queries.</li>
            </ol>

            <BlogCTA source="blog_patient_guide_reports" />
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

export default PatientGuideLabReports;
