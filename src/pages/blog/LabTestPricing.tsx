import React from 'react';
import { Link } from 'react-router-dom';
import BlogLayout from '@/components/blog/BlogLayout';
import BlogCTA from '@/components/blog/BlogCTA';
import TableOfContents from '@/components/blog/TableOfContents';
import BlogCard from '@/components/blog/BlogCard';
import { getRelatedPosts, getBlogPost } from '@/lib/blogData';
import { getArticleJsonLd } from '@/lib/blogJsonLd';

const SLUG = 'why-lab-tests-cost-different-prices';
const post = getBlogPost(SLUG)!;
const tocItems = [
  { id: 'cost-factors', label: 'What Determines Test Prices' },
  { id: 'price-variations', label: 'Why Prices Vary Between Labs' },
  { id: 'cheap-vs-quality', label: 'Cheap vs Quality' },
  { id: 'save-money', label: 'How to Save on Lab Tests' },
];

const LabTestPricing = () => {
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

            <h2 id="cost-factors">What Determines the Price of a Lab Test?</h2>
            <p>When you see a CBC test priced at ₹200 in one lab and ₹600 in another, it's natural to wonder why. Several real factors drive lab test pricing:</p>
            <ul>
              <li><strong>Reagent costs</strong> — The chemicals and consumables used to analyse your sample. Premium reagents from international manufacturers cost 2-3x more than generic alternatives but offer higher accuracy.</li>
              <li><strong>Equipment quality</strong> — A fully automated analyser costing ₹50 lakh produces more reliable results than a ₹5 lakh semi-automatic machine. Labs amortise equipment costs across test prices.</li>
              <li><strong>Qualified staff</strong> — Labs with qualified pathologists (MD Pathology) reviewing every report have higher salary expenses than those relying on technicians alone.</li>
              <li><strong>Accreditation costs</strong> — <Link to="/blog/nabl-accreditation-guide">NABL-accredited labs</Link> invest significantly in quality systems, documentation, proficiency testing, and regular audits.</li>
              <li><strong>Infrastructure</strong> — Air-conditioned sample storage, backup power, proper waste disposal, and <Link to="/blog/lab-data-security-hipaa-india">data security systems</Link> all add to operational costs.</li>
            </ul>

            <h2 id="price-variations">Why Prices Vary So Much Between Labs</h2>
            <h3>Location Matters</h3>
            <p>Labs in metropolitan cities have higher rent and salary costs. A test in Mumbai or Delhi will naturally cost more than the same test in a Tier-3 city.</p>
            <h3>Volume Discounts</h3>
            <p>Large chain labs process thousands of samples daily, getting bulk pricing on reagents. Standalone labs pay retail prices for the same reagents, making it harder to compete on price.</p>
            <h3>Doctor Referral Commissions</h3>
            <p>A controversial but widespread practice — many labs pay <Link to="/blog/doctor-referral-management-labs">referring doctor commissions</Link> of 20-40% of the test price. Labs offering higher commissions charge patients more to maintain margins.</p>
            <h3>Home Collection Premium</h3>
            <p>Labs offering home <Link to="/blog/sample-tracking-pathology-lab">sample collection</Link> incur additional costs for phlebotomists, transportation, and cold-chain logistics, which may be reflected in pricing.</p>

            <h2 id="cheap-vs-quality">The Cheapest Lab Isn't Always the Best</h2>
            <p>Extremely low prices can indicate cost-cutting in critical areas:</p>
            <ul>
              <li><strong>Expired or substandard reagents</strong> — Some labs use reagents past their optimal date, affecting result accuracy</li>
              <li><strong>No quality control</strong> — Skipping daily <Link to="/blog/lab-quality-control-best-practices">quality control procedures</Link> saves time and reagent costs but compromises reliability</li>
              <li><strong>Unqualified reporting</strong> — Reports signed by unqualified personnel without proper pathologist verification</li>
              <li><strong>Outsourcing without disclosure</strong> — Some labs collect samples but secretly outsource testing to cheaper facilities</li>
            </ul>
            <p>An inaccurate test result can lead to wrong diagnoses, unnecessary treatments, or missed conditions — far more expensive than the price difference between labs.</p>

            <h2 id="save-money">How to Save on Lab Tests Wisely</h2>
            <ol>
              <li><strong>Choose health packages</strong> — <Link to="/blog/preventive-health-checkup-guide-india">Preventive health checkup packages</Link> offer 30-50% savings compared to ordering tests individually</li>
              <li><strong>Ask about NABL accreditation</strong> — NABL-accredited labs must meet quality standards, giving you confidence in results regardless of price</li>
              <li><strong>Compare, but verify quality</strong> — Check if the lab uses automated analysers, employs qualified pathologists, and follows <Link to="/blog/lab-report-formats-templates">proper report formats</Link></li>
              <li><strong>Use insurance</strong> — Many health insurance plans cover diagnostic tests. Check your policy before paying out-of-pocket</li>
              <li><strong>Ask your doctor</strong> — Not all recommended tests may be necessary. Discuss which tests are essential for your condition</li>
            </ol>

            <BlogCTA source="blog_lab_test_pricing" />
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

export default LabTestPricing;
