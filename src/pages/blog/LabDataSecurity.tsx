import React from 'react';
import { Link } from 'react-router-dom';
import BlogLayout from '@/components/blog/BlogLayout';
import BlogCTA from '@/components/blog/BlogCTA';
import TableOfContents from '@/components/blog/TableOfContents';
import BlogCard from '@/components/blog/BlogCard';
import { getRelatedPosts, getBlogPost } from '@/lib/blogData';
import { getArticleJsonLd } from '@/lib/blogJsonLd';

const SLUG = 'lab-data-security-hipaa-india';
const post = getBlogPost(SLUG)!;
const tocItems = [
  { id: 'why-security', label: 'Why Data Security Matters' },
  { id: 'indian-regulations', label: 'Indian Data Protection Laws' },
  { id: 'common-threats', label: 'Common Security Threats' },
  { id: 'best-practices', label: 'Security Best Practices' },
];

const LabDataSecurity = () => {
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

            <h2 id="why-security">Why Data Security Matters for Labs</h2>
            <p>Pathology labs handle some of the most sensitive personal data — patient names, addresses, phone numbers, and medical test results including HIV, genetic, and pregnancy tests. A data breach doesn't just violate privacy; it can destroy lives and your lab's reputation.</p>
            <p>With India's Digital Personal Data Protection Act (DPDPA) 2023 now in effect, labs face <strong>penalties up to ₹250 crore</strong> for data breaches. Security is no longer optional — it's a legal requirement.</p>

            <h2 id="indian-regulations">Indian Data Protection Regulations for Labs</h2>
            <h3>DPDPA 2023</h3>
            <p>The Digital Personal Data Protection Act classifies health data as "sensitive personal data." Labs must obtain explicit consent for data collection, implement reasonable security safeguards, and report breaches to the Data Protection Board.</p>
            <h3>IT Act 2000 & SPDI Rules</h3>
            <p>Under the existing IT Act, labs handling sensitive personal data must implement "reasonable security practices" (typically ISO 27001) and maintain a privacy policy.</p>
            <h3>NABL Requirements</h3>
            <p><Link to="/blog/nabl-accreditation-guide">NABL accreditation</Link> under ISO 15189 requires documented policies for confidentiality of patient information, access control, and data integrity.</p>

            <h2 id="common-threats">Common Security Threats to Lab Data</h2>
            <ul>
              <li><strong>Unauthorised staff access</strong> — Operators viewing patient data they shouldn't have access to</li>
              <li><strong>Unencrypted data transmission</strong> — Sending reports via plain WhatsApp or email without encryption</li>
              <li><strong>No backup strategy</strong> — Local-only data lost when hardware fails</li>
              <li><strong>Shared login credentials</strong> — Multiple staff using a single account, making audit trails meaningless</li>
              <li><strong>Physical data exposure</strong> — Printed reports left unattended, screens visible to patients</li>
            </ul>

            <h2 id="best-practices">Security Best Practices for Indian Labs</h2>
            <h3>1. Role-Based Access Control (RBAC)</h3>
            <p>Every user should have a unique login with permissions matching their role. An operator processing samples shouldn't access <Link to="/blog/lab-billing-software-features">billing data</Link> or financial reports.</p>
            <h3>2. End-to-End Encryption</h3>
            <p>All data should be encrypted at rest and in transit. When sharing <Link to="/blog/digital-lab-reports-guide">digital reports</Link>, use secure links with expiry rather than unprotected attachments.</p>
            <h3>3. Automated Cloud Backups</h3>
            <p>Cloud-based <Link to="/blog/what-is-lims-software">LIMS software</Link> provides automatic backups with geographic redundancy, eliminating the risk of data loss from hardware failure or disasters.</p>
            <h3>4. Audit Logging</h3>
            <p>Every action — login, data view, edit, delete, export — should be logged with timestamps and user identity. This is critical for both compliance and investigating incidents.</p>
            <h3>5. Regular Security Reviews</h3>
            <p>Conduct quarterly reviews of user access, remove inactive accounts, and update passwords. For <Link to="/blog/multi-branch-lab-management">multi-branch labs</Link>, centralised security management is essential.</p>
            <p>LabFlow is built with enterprise-grade security — role-based access, encrypted data, automatic backups, and comprehensive audit logs — keeping your lab compliant and your patients' data safe.</p>

            <BlogCTA source="blog_data_security" />
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

export default LabDataSecurity;
