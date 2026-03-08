import React from 'react';
import { Link } from 'react-router-dom';
import BlogLayout from '@/components/blog/BlogLayout';
import BlogCTA from '@/components/blog/BlogCTA';
import TableOfContents from '@/components/blog/TableOfContents';
import BlogCard from '@/components/blog/BlogCard';
import { getRelatedPosts, getBlogPost } from '@/lib/blogData';
import { getArticleJsonLd } from '@/lib/blogJsonLd';

const SLUG = 'lab-revenue-leakage-prevention';
const post = getBlogPost(SLUG)!;
const tocItems = [
  { id: 'unbilled-tests', label: '1. Unbilled Tests' },
  { id: 'discount-abuse', label: '2. Discount Abuse' },
  { id: 'outstanding-dues', label: '3. Outstanding Dues' },
  { id: 'cash-handling', label: '4. Cash Handling' },
  { id: 'referral-errors', label: '5. Referral Errors' },
  { id: 'duplicates', label: '6. Duplicate Entries' },
  { id: 'roi', label: 'ROI of Fixing Leakage' },
];

const RevenueLeakagePrevention = () => {
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

            <p>Most lab owners focus on increasing revenue — more patients, more tests, higher prices. But many labs are <strong>losing 10-15% of their revenue</strong> to leakage they don't even know about. Before chasing growth, plug the leaks.</p>

            <h2 id="unbilled-tests">1. Unbilled Tests</h2>
            <p>The most common and costly leak. Tests get performed but never billed — either due to manual oversight, verbal instructions that aren't logged, or add-on tests that slip through.</p>
            <p><strong>The fix:</strong> Use <Link to="/blog/lab-billing-software-features">billing software</Link> that's integrated with your test workflow. Every test registered should automatically create a billing line item. If a test is processed without a corresponding bill entry, the system flags it.</p>

            <h2 id="discount-abuse">2. Unapproved Discounts</h2>
            <p>Front desk staff giving discounts to "known patients," unauthorized percentage-off deals, or discounts applied after billing. Over a month, these small discounts add up to lakhs in lost revenue.</p>
            <p><strong>The fix:</strong> Implement tiered discount approval. Staff can offer discounts up to a limit (e.g., 5%); anything above requires admin approval. Every discount is logged with the reason and approver. Monthly discount reports reveal patterns of abuse.</p>

            <h2 id="outstanding-dues">3. Outstanding Dues That Never Get Collected</h2>
            <p>"We'll pay next time" — and next time never comes. Without systematic tracking, partial payments and credit patients become write-offs. Labs with ₹2-5 lakh in outstanding dues are common.</p>
            <p><strong>The fix:</strong> Automated outstanding tracking with aging reports. Send automated payment reminders via SMS/WhatsApp. Block report delivery for patients with overdue balances (configurable per lab policy). Use LabFlow's <Link to="/blog/gst-billing-for-pathology-labs">GST-compliant billing</Link> with integrated payment tracking.</p>

            <h2 id="cash-handling">4. Cash Handling Issues</h2>
            <p>Cash collections that don't match billing records, petty cash mismanagement, and lack of daily reconciliation. In cash-heavy businesses like labs, even small daily discrepancies compound into significant losses.</p>
            <p><strong>The fix:</strong> Digital payment tracking for every transaction. Daily cash reconciliation reports that compare billed amounts vs collected amounts. Encourage UPI/digital payments which are automatically tracked. Flag discrepancies immediately rather than discovering them during monthly reviews.</p>

            <h2 id="referral-errors">5. Referral Commission Calculation Errors</h2>
            <p>Doctor referral commissions calculated manually are prone to errors — paying commissions on discounted amounts, missing tests from calculations, or applying wrong commission rates. These errors go both ways: overpaying costs you money; underpaying damages relationships.</p>
            <p><strong>The fix:</strong> Automated commission calculations based on predefined rates per doctor and per test type. Monthly commission reports that doctors can verify. Integration with your <Link to="/blog/what-is-lims-software">LIMS system</Link> ensures every referral is captured accurately.</p>

            <h2 id="duplicates">6. Duplicate Patient Entries</h2>
            <p>The same patient registered multiple times with slight name variations ("Rajesh Kumar" vs "R. Kumar") leads to split billing records, missed outstanding tracking, and inaccurate patient history. This makes <Link to="/blog/reduce-patient-complaints-pathology-lab">patient experience worse</Link> too.</p>
            <p><strong>The fix:</strong> Smart patient search with phone number as the primary identifier. Duplicate detection alerts when similar records exist. Patient merge functionality to consolidate duplicate entries without losing data.</p>

            <h2 id="roi">The ROI of Fixing Revenue Leakage</h2>
            <p>For a lab processing 100 patients/day with an average bill of ₹800:</p>
            <ul>
              <li><strong>Monthly revenue:</strong> ₹24,00,000</li>
              <li><strong>Estimated leakage at 10%:</strong> ₹2,40,000/month</li>
              <li><strong>Annual leakage:</strong> ₹28,80,000</li>
            </ul>
            <p>Even plugging <strong>half</strong> of this leakage — through better <Link to="/blog/lab-billing-software-features">billing software</Link>, automated tracking, and audit trails — recovers ₹14+ lakh per year. That's many times the cost of a good <Link to="/blog/best-lims-software-india">LIMS solution</Link>.</p>

            <p>LabFlow's billing, analytics, and audit features are built specifically to prevent revenue leakage: <Link to="/#pricing" className="text-primary">See Pricing →</Link></p>

            <BlogCTA source="blog_revenue_leakage" />
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

export default RevenueLeakagePrevention;
