import React from 'react';
import { Link } from 'react-router-dom';
import BlogLayout from '@/components/blog/BlogLayout';
import BlogCTA from '@/components/blog/BlogCTA';
import TableOfContents from '@/components/blog/TableOfContents';
import BlogCard from '@/components/blog/BlogCard';
import { getRelatedPosts, getBlogPost } from '@/lib/blogData';
import { getArticleJsonLd } from '@/lib/blogJsonLd';

const SLUG = 'doctor-referral-management-labs';
const post = getBlogPost(SLUG)!;
const tocItems = [
  { id: 'why-referrals', label: 'Why Doctor Referrals Matter' },
  { id: 'challenges', label: 'Common Challenges' },
  { id: 'commission-tracking', label: 'Commission Tracking Done Right' },
  { id: 'growing-revenue', label: 'Growing Revenue via Referrals' },
];

const DoctorReferralManagement = () => {
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

            <h2 id="why-referrals">Why Doctor Referrals Are Your Lab's Biggest Revenue Driver</h2>
            <p>For most pathology labs in India, <strong>60–80% of patients</strong> come through doctor referrals. A single referring doctor can send 10–50 patients per month. Managing these relationships well directly impacts your lab's growth and <Link to="/blog/lab-revenue-leakage-prevention">revenue</Link>.</p>
            <p>Yet, most labs manage referrals through informal agreements, Excel sheets, or even memory — leading to missed commissions, unhappy doctors, and lost business.</p>

            <h2 id="challenges">Common Challenges in Referral Management</h2>
            <h3>1. Inaccurate Commission Calculations</h3>
            <p>When commission rates vary by doctor, by test, or by volume tier, manual calculations inevitably produce errors. Underpaying a doctor risks losing them; overpaying eats into your margins.</p>
            <h3>2. Delayed Settlements</h3>
            <p>Doctors expect timely commission payments. When settlements are delayed because staff couldn't compile the data, it strains the relationship. Many labs lose referring doctors simply due to settlement delays.</p>
            <h3>3. No Visibility into Referral Patterns</h3>
            <p>Which doctors are sending the most patients? Which ones have stopped referring? Without analytics, you're flying blind and can't proactively manage relationships.</p>
            <h3>4. Compliance Concerns</h3>
            <p>Untracked cash settlements create compliance risks. A proper audit trail of every commission calculation and payment protects your lab during <Link to="/blog/nabl-accreditation-guide">accreditation audits</Link>.</p>

            <h2 id="commission-tracking">Commission Tracking Done Right with Software</h2>
            <p>Modern <Link to="/blog/what-is-lims-software">LIMS software</Link> automates the entire referral commission workflow:</p>
            <ul>
              <li><strong>Auto-link patients to referring doctors</strong> — Doctor tagged at registration, linked to every bill</li>
              <li><strong>Flexible commission structures</strong> — Percentage-based, flat-rate, test-specific, or volume-tiered</li>
              <li><strong>Real-time commission ledger</strong> — Doctors can see pending vs. settled amounts</li>
              <li><strong>One-click settlement</strong> — Generate settlement reports with bill-wise breakdowns</li>
              <li><strong>Settlement receipts</strong> — Professional PDF receipts for every payment, maintaining a complete audit trail</li>
            </ul>

            <h2 id="growing-revenue">Growing Revenue Through Better Referral Management</h2>
            <p>Labs that systematically manage referrals see <strong>25–40% revenue growth</strong> within a year. The key strategies:</p>
            <ul>
              <li>Identify top-referring doctors and offer them priority <Link to="/blog/reduce-lab-report-turnaround-time">turnaround times</Link></li>
              <li>Send automated monthly referral reports to doctors showing patient counts and test summaries</li>
              <li>Use <Link to="/blog/whatsapp-reports-patient-communication">WhatsApp</Link> to share reports directly with referring doctors</li>
              <li>Track lapsed referrers and run re-engagement campaigns</li>
            </ul>
            <p>LabFlow includes a complete doctor referral module with commission tracking, settlement management, and referral analytics — built specifically for Indian pathology labs.</p>

            <BlogCTA source="blog_doctor_referrals" />
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

export default DoctorReferralManagement;
