import React from 'react';
import { Link } from 'react-router-dom';
import BlogLayout from '@/components/blog/BlogLayout';
import BlogCTA from '@/components/blog/BlogCTA';
import TableOfContents from '@/components/blog/TableOfContents';
import BlogCard from '@/components/blog/BlogCard';
import { getRelatedPosts, getBlogPost } from '@/lib/blogData';
import { getArticleJsonLd } from '@/lib/blogJsonLd';

const SLUG = 'best-lims-software-india';
const post = getBlogPost(SLUG)!;
const tocItems = [
  { id: 'why-guide', label: 'Why This Guide' },
  { id: 'criteria', label: 'Evaluation Criteria' },
  { id: 'features', label: 'Must-Have Features' },
  { id: 'questions', label: 'Questions to Ask' },
  { id: 'recommendation', label: 'Our Recommendation' },
];

const BestLimsIndia = () => {
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

            <h2 id="why-guide">Why You Need This Guide</h2>
            <p>With dozens of <Link to="/blog/what-is-lims-software">LIMS software options</Link> available in India, choosing the right one can be overwhelming. This guide helps you cut through the noise and make an informed decision based on features that actually matter for Indian labs.</p>

            <h2 id="criteria">Key Evaluation Criteria</h2>
            <p>Rate each software on these dimensions:</p>
            <ol>
              <li><strong>India-specific features:</strong> <Link to="/blog/gst-billing-for-pathology-labs">GST billing</Link>, Indian report formats, regional language support</li>
              <li><strong>Ease of use:</strong> How quickly can your staff learn it? Most Indian lab technicians are not tech-savvy</li>
              <li><strong>Cloud vs On-premise:</strong> Cloud is preferred for smaller labs; on-premise for large hospitals</li>
              <li><strong>Pricing transparency:</strong> Beware of hidden costs — implementation, training, per-user fees</li>
              <li><strong>Support quality:</strong> Indian time zone support, response time, language of support</li>
              <li><strong>Scalability:</strong> Can it grow from 1 branch to 50? Check <Link to="/blog/multi-branch-lab-management">multi-branch capabilities</Link></li>
            </ol>

            <h2 id="features">Must-Have Features for Indian Labs</h2>
            <ul>
              <li>Patient registration with Aadhaar/mobile linking</li>
              <li><Link to="/blog/lab-billing-software-features">Comprehensive billing</Link> with GST, discounts, and partial payments</li>
              <li><Link to="/blog/digital-lab-reports-guide">Digital report generation</Link> with WhatsApp/SMS delivery</li>
              <li><Link to="/blog/nabl-accreditation-guide">NABL compliance</Link> features — audit trails, QC tracking</li>
              <li>Multi-branch management with role-based access</li>
              <li>Analytics and revenue dashboards</li>
              <li>PWA/mobile support for on-the-go access</li>
              <li>Doctor referral tracking and commission management</li>
              <li>Home collection scheduling</li>
              <li>WhatsApp integration for patient communication</li>
            </ul>

            <h2 id="questions">Questions to Ask Before Buying</h2>
            <ol>
              <li>Is there a free trial or demo available?</li>
              <li>What's the total cost including setup, training, and AMC?</li>
              <li>How long does implementation take?</li>
              <li>Can you migrate data from my current system?</li>
              <li>What happens to my data if I cancel?</li>
              <li>Do you offer support in Hindi/regional languages?</li>
              <li>How often do you release updates?</li>
              <li>Is my data backed up automatically?</li>
            </ol>

            <h2 id="recommendation">Our Recommendation</h2>
            <p>LabFlow is built specifically for Indian pathology and diagnostic labs. It offers all the features listed above with transparent pricing, same-day setup, and support in English, Hindi, and Marathi.</p>
            <p><Link to="/product-tour" className="text-primary">Take the LabFlow product tour →</Link></p>
            <p>Or <Link to="/#pricing" className="text-primary">check our pricing plans →</Link></p>

            <BlogCTA source="blog_best_lims" />
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

export default BestLimsIndia;
