import React from 'react';
import { Link } from 'react-router-dom';
import BlogLayout from '@/components/blog/BlogLayout';
import BlogCTA from '@/components/blog/BlogCTA';
import TableOfContents from '@/components/blog/TableOfContents';
import BlogCard from '@/components/blog/BlogCard';
import { getRelatedPosts, getBlogPost } from '@/lib/blogData';
import { getArticleJsonLd } from '@/lib/blogJsonLd';

const SLUG = 'reduce-patient-complaints-pathology-lab';
const post = getBlogPost(SLUG)!;
const tocItems = [
  { id: 'complaint-types', label: 'Top 5 Complaints' },
  { id: 'root-causes', label: 'Root Causes' },
  { id: 'fixes', label: 'Systematic Fixes' },
  { id: 'feedback-system', label: 'Feedback Systems' },
];

const ReducePatientComplaints = () => {
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

            <p>Every pathology lab owner knows the sinking feeling of an angry patient call. But patient complaints aren't just unpleasant — they're expensive. Each complaint costs time, damages reputation, and can lead to losing not just that patient but their entire family and referral network.</p>

            <h2 id="complaint-types">Top 5 Patient Complaints in Pathology Labs</h2>
            <ol>
              <li><strong>Delayed reports:</strong> "My reports were promised in 4 hours but it's been 2 days" — this is the #1 complaint across Indian labs. Learn how to <Link to="/blog/reduce-lab-report-turnaround-time">fix report turnaround time</Link>.</li>
              <li><strong>Incorrect or swapped reports:</strong> Wrong patient name, swapped results, or data entry errors. These are dangerous and erode trust completely.</li>
              <li><strong>Billing confusion:</strong> Unexpected charges, missing itemization, or disputes over discounts. Transparent <Link to="/blog/lab-billing-software-features">billing software features</Link> eliminate these.</li>
              <li><strong>No status updates:</strong> Patients have no idea whether their sample has been collected, processed, or reported. They call repeatedly, tying up your staff.</li>
              <li><strong>Poor communication:</strong> Rude front desk, no explanation of tests, and difficulty reaching the lab for follow-ups.</li>
            </ol>

            <h2 id="root-causes">Root Causes Behind the Complaints</h2>
            <p>Most patient complaints stem from <strong>system failures, not people failures</strong>:</p>
            <ul>
              <li><strong>No process standardization:</strong> Each staff member handles things differently</li>
              <li><strong>Manual operations:</strong> Paper-based labs inherently create more errors and delays</li>
              <li><strong>Zero visibility:</strong> Neither staff nor patients know the current status of a sample</li>
              <li><strong>No feedback mechanism:</strong> Without structured feedback, you only hear the loudest complaints — missing systematic issues</li>
              <li><strong>Overloaded staff:</strong> <Link to="/blog/lab-staff-management-challenges">Staff management issues</Link> cascade into patient-facing problems</li>
            </ul>

            <h2 id="fixes">Systematic Fixes That Actually Work</h2>

            <h3>1. Automated TAT Alerts</h3>
            <p>Set up alerts that notify your team when reports approach their deadline. Proactive management prevents complaints before they happen.</p>

            <h3>2. QC Checks Before Report Release</h3>
            <p>Implement mandatory quality checks — verify patient details, flag abnormal values, and require pathologist sign-off before any report goes out. <Link to="/blog/nabl-accreditation-guide">NABL compliance</Link> requires these checks anyway.</p>

            <h3>3. Transparent, Itemized Billing</h3>
            <p>Use software that generates clear, itemized bills with <Link to="/blog/gst-billing-for-pathology-labs">proper GST breakdowns</Link>. When patients can see exactly what they're paying for, disputes drop dramatically.</p>

            <h3>4. WhatsApp and SMS Status Updates</h3>
            <p>Send automated updates at key milestones: sample received, processing started, report ready. <Link to="/blog/digital-lab-reports-guide">Digital report delivery</Link> via WhatsApp means patients get results instantly — no more "when will my report be ready?" calls.</p>

            <h3>5. Digital Feedback Collection</h3>
            <p>Don't wait for complaints to find you. Implement post-visit feedback forms (via SMS or QR codes at the counter). Track trends, identify recurring issues, and fix them systematically.</p>

            <h2 id="feedback-system">Building a Patient Feedback System</h2>
            <p>A good feedback system has three parts:</p>
            <ul>
              <li><strong>Collection:</strong> Automated post-visit surveys (SMS/WhatsApp) with star ratings and comments</li>
              <li><strong>Analysis:</strong> Dashboard showing complaint trends, common issues, and branch-wise comparisons</li>
              <li><strong>Action:</strong> Assign complaints to responsible staff, track resolution, and follow up with the patient</li>
            </ul>
            <p>LabFlow includes built-in feedback management: <Link to="/#features" className="text-primary">See How It Works →</Link></p>

            <BlogCTA source="blog_reduce_complaints" />
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

export default ReducePatientComplaints;
