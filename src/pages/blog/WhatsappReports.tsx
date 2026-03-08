import React from 'react';
import { Link } from 'react-router-dom';
import BlogLayout from '@/components/blog/BlogLayout';
import BlogCTA from '@/components/blog/BlogCTA';
import TableOfContents from '@/components/blog/TableOfContents';
import BlogCard from '@/components/blog/BlogCard';
import { getRelatedPosts, getBlogPost } from '@/lib/blogData';
import { getArticleJsonLd } from '@/lib/blogJsonLd';

const SLUG = 'whatsapp-reports-patient-communication';
const post = getBlogPost(SLUG)!;
const tocItems = [
  { id: 'why-whatsapp', label: 'Why WhatsApp for Lab Reports' },
  { id: 'how-it-works', label: 'How WhatsApp Report Delivery Works' },
  { id: 'benefits', label: 'Benefits for Labs & Patients' },
  { id: 'implementation', label: 'Setting Up WhatsApp Reports' },
];

const WhatsappReports = () => {
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

            <h2 id="why-whatsapp">Why WhatsApp Is the Best Channel for Lab Reports in India</h2>
            <p>With over <strong>500 million WhatsApp users in India</strong>, it's the most natural communication channel for patients. Unlike email (which many patients don't check) or SMS (limited to text), WhatsApp supports PDF attachments, images, and rich formatting.</p>
            <p>Patients increasingly expect to receive their <Link to="/blog/digital-lab-reports-guide">digital lab reports</Link> on WhatsApp. Labs that offer this see <strong>50% fewer "where is my report?" calls</strong> and significantly higher patient satisfaction scores.</p>

            <h2 id="how-it-works">How WhatsApp Report Delivery Works</h2>
            <h3>Step 1: Report Generation</h3>
            <p>When a pathologist approves a test result in the <Link to="/blog/what-is-lims-software">LIMS software</Link>, the system automatically generates a formatted PDF report with the lab's letterhead, digital signature, and QR verification code.</p>
            <h3>Step 2: Automated Delivery</h3>
            <p>The LIMS triggers a WhatsApp message to the patient's registered mobile number. The message includes a personalised greeting, the report PDF as an attachment, and a secure link to view the report online.</p>
            <h3>Step 3: Delivery Confirmation</h3>
            <p>The system tracks message delivery and read status. If a message fails (wrong number, phone off), staff are alerted to follow up manually.</p>
            <h3>Step 4: Doctor Copy</h3>
            <p>Optionally, the <Link to="/blog/doctor-referral-management-labs">referring doctor</Link> also receives a copy on WhatsApp, enabling faster clinical decision-making.</p>

            <h2 id="benefits">Benefits for Labs and Patients</h2>
            <h3>For Patients</h3>
            <ul>
              <li>Instant report delivery — no waiting, no travel to collect reports</li>
              <li>Easy to share with doctors or family members</li>
              <li>Reports stored in WhatsApp chat history for future reference</li>
              <li>QR code verification ensures report authenticity</li>
            </ul>
            <h3>For Labs</h3>
            <ul>
              <li><strong>80% reduction in report collection footfall</strong> — less crowding at reception</li>
              <li>Fewer phone calls asking for report status</li>
              <li>Professional brand image with branded message templates</li>
              <li>Opportunity to send follow-up reminders and <Link to="/blog/reduce-patient-complaints-pathology-lab">satisfaction surveys</Link></li>
              <li>Reduced printing costs — many patients don't need physical copies</li>
            </ul>

            <h2 id="implementation">Setting Up WhatsApp Reports in Your Lab</h2>
            <p>To send automated WhatsApp messages, you need:</p>
            <ul>
              <li><strong>WhatsApp Business API</strong> — Available through official Business Solution Providers (BSPs)</li>
              <li><strong>Pre-approved message templates</strong> — WhatsApp requires template approval for automated messages</li>
              <li><strong>LIMS integration</strong> — Your lab software should connect to the WhatsApp API to trigger messages automatically</li>
            </ul>
            <p>LabFlow integrates with WhatsApp Business API out of the box. Set up your templates once, and reports are delivered automatically as soon as they're approved — with delivery tracking and retry logic built in.</p>

            <BlogCTA source="blog_whatsapp_reports" />
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

export default WhatsappReports;
