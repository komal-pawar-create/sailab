import React from 'react';
import { Link } from 'react-router-dom';
import BlogLayout from '@/components/blog/BlogLayout';
import BlogCTA from '@/components/blog/BlogCTA';
import TableOfContents from '@/components/blog/TableOfContents';
import BlogCard from '@/components/blog/BlogCard';
import { getRelatedPosts, getBlogPost } from '@/lib/blogData';

const SLUG = 'gst-billing-for-pathology-labs';
const post = getBlogPost(SLUG)!;
const tocItems = [
  { id: 'gst-overview', label: 'GST Overview for Labs' },
  { id: 'tax-rates', label: 'Tax Rates' },
  { id: 'invoice-requirements', label: 'Invoice Requirements' },
  { id: 'software-helps', label: 'How Software Helps' },
];

const GstBillingLabs = () => {
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

            <h2 id="gst-overview">GST and Pathology Labs: An Overview</h2>
            <p>The Goods and Services Tax (GST) regime significantly impacted how pathology and diagnostic labs handle billing in India. Understanding the correct tax treatment is essential to avoid penalties and ensure smooth operations.</p>
            <p>Healthcare services are generally exempt from GST, but diagnostic and lab testing services fall into a nuanced category that depends on the type of establishment and services offered.</p>

            <h2 id="tax-rates">Tax Rates for Lab Services</h2>
            <p>Key GST considerations for pathology labs:</p>
            <ul>
              <li><strong>Clinical establishment services:</strong> Services provided by a clinical establishment (hospital, clinic, lab) are exempt under GST if they qualify as healthcare services</li>
              <li><strong>Standalone diagnostic labs:</strong> May be subject to 18% GST depending on their classification</li>
              <li><strong>Consumables and reagents:</strong> Subject to varying GST rates (5-18%)</li>
              <li><strong>Home collection charges:</strong> May attract GST separately</li>
            </ul>
            <p><em>Note: Always consult your tax advisor for specific guidance based on your lab's classification.</em></p>

            <h2 id="invoice-requirements">GST Invoice Requirements</h2>
            <p>A GST-compliant invoice must include:</p>
            <ol>
              <li>Lab's GSTIN (GST Identification Number)</li>
              <li>Patient/customer name and address</li>
              <li>Unique invoice number and date</li>
              <li>HSN/SAC code for services rendered</li>
              <li>Taxable value and applicable tax rate</li>
              <li>Place of supply details</li>
            </ol>
            <p>Managing all these fields manually is error-prone. That's where <Link to="/blog/lab-billing-software-features">lab billing software</Link> becomes essential.</p>

            <h2 id="software-helps">How Billing Software Simplifies GST Compliance</h2>
            <p>A modern <Link to="/blog/what-is-lims-software">LIMS with built-in billing</Link> handles GST automatically:</p>
            <ul>
              <li><strong>Auto-calculated taxes:</strong> GST is calculated based on your lab's configuration</li>
              <li><strong>Compliant invoices:</strong> All required fields are pre-populated</li>
              <li><strong>Report generation:</strong> GSTR-1 and GSTR-3B data exports for easy filing</li>
              <li><strong>Multi-branch support:</strong> Separate GSTIN handling for <Link to="/blog/multi-branch-lab-management">different branches</Link></li>
            </ul>
            <p>See how LabFlow handles <Link to="/#features" className="text-primary">billing and compliance →</Link></p>

            <BlogCTA source="blog_gst_billing" />
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

export default GstBillingLabs;
