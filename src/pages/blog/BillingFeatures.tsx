import React from 'react';
import { Link } from 'react-router-dom';
import BlogLayout from '@/components/blog/BlogLayout';
import BlogCTA from '@/components/blog/BlogCTA';
import TableOfContents from '@/components/blog/TableOfContents';
import BlogCard from '@/components/blog/BlogCard';
import { getRelatedPosts, getBlogPost } from '@/lib/blogData';
import { getArticleJsonLd } from '@/lib/blogJsonLd';

const SLUG = 'lab-billing-software-features';
const post = getBlogPost(SLUG)!;
const tocItems = [
  { id: 'why-matters', label: 'Why Billing Features Matter' },
  { id: 'must-have', label: '7 Must-Have Features' },
  { id: 'comparison', label: 'What to Compare' },
];

const BillingFeatures = () => {
  const related = getRelatedPosts(SLUG);
  return (
    <BlogLayout title={post.title} description={post.excerpt} canonicalSlug={SLUG} datePublished={post.datePublished} dateModified={post.dateModified} ogImage={post.ogImage} jsonLd={getArticleJsonLd(post)}>
      <div className="max-w-6xl mx-auto px-4">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-10">
          <article className="prose prose-neutral dark:prose-invert max-w-none">
            <h1>{post.title}</h1>
            <p className="lead text-muted-foreground">{post.excerpt}</p>
            <div className="flex items-center gap-4 text-sm text-muted-foreground mb-8">
              <time dateTime={post.datePublished}>{new Date(post.datePublished).toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' })}</time>
              <span>•</span><span>{post.readTime}</span>
            </div>

            <h2 id="why-matters">Why Billing Features Make or Break Lab Software</h2>
            <p>Billing is the lifeblood of any lab's revenue cycle. Poor billing software means delayed payments, inaccurate invoices, and frustrated patients. In fact, billing-related issues are the #1 reason labs switch <Link to="/blog/what-is-lims-software">LIMS software</Link>.</p>

            <h2 id="must-have">7 Must-Have Features</h2>
            <h3>1. Automated Invoice Generation</h3>
            <p>Generate professional invoices instantly when tests are registered. No manual entry, no errors. The software should auto-populate patient details, test prices, and applicable discounts.</p>

            <h3>2. GST Compliance</h3>
            <p>Built-in <Link to="/blog/gst-billing-for-pathology-labs">GST handling</Link> with auto-calculated taxes, proper HSN/SAC codes, and GSTR export capabilities is non-negotiable for Indian labs.</p>

            <h3>3. Partial Payment Tracking</h3>
            <p>Most patients don't pay the full amount upfront. Your software must track partial payments, outstanding balances, and payment history per patient.</p>

            <h3>4. Multiple Payment Methods</h3>
            <p>Support for cash, UPI, card, bank transfer, and online payments. Each transaction should be recorded with the payment method for reconciliation.</p>

            <h3>5. Discount Management</h3>
            <p>Flexible discount options — percentage or flat, per-test or per-bill, with approval workflows for large discounts to prevent revenue leakage.</p>

            <h3>6. Outstanding Reports</h3>
            <p>Real-time visibility into unpaid bills, aging analysis, and automated reminders for overdue payments. This alone can improve collections by 30%.</p>

            <h3>7. Multi-Branch Billing</h3>
            <p>For labs with <Link to="/blog/multi-branch-lab-management">multiple branches</Link>, centralized billing with branch-specific pricing and separate GSTIN support is essential.</p>

            <h2 id="comparison">What to Compare When Choosing</h2>
            <p>When evaluating <Link to="/blog/best-lims-software-india">lab billing software</Link>, create a checklist of these 7 features and score each option. Also consider ease of use — if staff can't learn it quickly, even the best features are useless.</p>
            <p>See how LabFlow handles all 7 features: <Link to="/#features" className="text-primary">Explore Features →</Link></p>

            <BlogCTA source="blog_billing_features" />
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

export default BillingFeatures;
