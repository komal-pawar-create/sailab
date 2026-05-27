import React from 'react';
import { Link } from 'react-router-dom';
import BlogLayout from '@/components/blog/BlogLayout';
import BlogCTA from '@/components/blog/BlogCTA';
import TableOfContents from '@/components/blog/TableOfContents';
import BlogCard from '@/components/blog/BlogCard';
import { getRelatedPosts, getBlogPost } from '@/lib/blogData';
import { getArticleJsonLd } from '@/lib/blogJsonLd';

const SLUG = 'ai-chatbot-patient-communication-labs';
const post = getBlogPost(SLUG)!;
const tocItems = [
  { id: 'why-chatbots', label: 'Why Labs Need AI Chatbots' },
  { id: 'use-cases', label: 'Top Use Cases' },
  { id: 'channels', label: 'WhatsApp, Web & IVR Channels' },
  { id: 'building-blocks', label: 'Building Blocks' },
  { id: 'metrics', label: 'Metrics That Matter' },
  { id: 'pitfalls', label: 'Pitfalls to Avoid' },
];

const AiChatbotPatientComms = () => {
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

            <h2 id="why-chatbots">Why Labs Need AI Chatbots in 2026</h2>
            <p>A typical mid-sized lab handles 200-400 patient queries per day — 70% of which are repetitive: "Where is my report?", "What are your home-collection charges?", "Is fasting needed for lipid profile?". Each call ties up a front-desk operator for 2-3 minutes. That's 10-20 staff-hours per day spent on questions a chatbot can answer in seconds.</p>
            <p>AI chatbots — especially LLM-powered ones — handle these queries 24×7 in English, Hindi, and Marathi, and only escalate the genuinely complex cases. Labs deploying them report 40-60% drop in front-desk call volume and a measurable boost in patient satisfaction. This also cuts down on <Link to="/blog/reduce-patient-complaints-pathology-lab">patient complaints</Link>.</p>

            <h2 id="use-cases">Top 8 Use Cases</h2>
            <ol>
              <li><strong>Report status</strong> — "Is my report ready?" → patient sends OTP/bill number → bot fetches LIMS status.</li>
              <li><strong>Report delivery</strong> — Bot sends a secure link via WhatsApp once ready. See our <Link to="/blog/whatsapp-reports-patient-communication">WhatsApp reports guide</Link>.</li>
              <li><strong>Test pricing</strong> — "How much for full body checkup?" → bot answers from current price list.</li>
              <li><strong>Test preparation</strong> — "Do I need fasting for HbA1c?" → instant, accurate answer.</li>
              <li><strong>Home collection booking</strong> — Patient books slot, bot creates appointment in LIMS.</li>
              <li><strong>Feedback collection</strong> — Post-report bot asks for 1-5 rating + free-text feedback.</li>
              <li><strong>Outstanding payment reminders</strong> — Bot sends polite reminder with UPI payment link.</li>
              <li><strong>Doctor query handling</strong> — Doctors can query patient history via a separate bot interface (with stronger auth).</li>
            </ol>

            <h2 id="channels">WhatsApp, Web & IVR Channels</h2>
            <p><strong>WhatsApp Business API</strong> is the dominant channel in India (90%+ patient adoption). Use providers like MyOperator, Gupshup, or WATI to host a bot on your verified WhatsApp number with template messages for proactive notifications and free-form replies for queries within the 24-hour window.</p>
            <p><strong>Web chat widget</strong> on your patient portal — useful for first-time visitors browsing test prices.</p>
            <p><strong>Voice IVR with AI</strong> — newer, but speech-to-text + LLM can now handle Hindi calls reasonably well. Lower priority for most labs in 2026.</p>

            <h2 id="building-blocks">Building Blocks</h2>
            <ul>
              <li><strong>LIMS API access</strong> — bot needs read-access to bills, reports, and appointments. Your <Link to="/blog/what-is-lims-software">LIMS</Link> must expose a stable API.</li>
              <li><strong>WhatsApp Business provider</strong> — MyOperator, Gupshup, Interakt, or WATI.</li>
              <li><strong>LLM</strong> — OpenAI GPT-4o-mini, Anthropic Claude Haiku, or open-source Llama-3-70B. ₹0.50-2 per conversation.</li>
              <li><strong>RAG (retrieval-augmented generation)</strong> — feed the LLM your test list, pricing, preparation notes, and FAQ so it doesn't hallucinate.</li>
              <li><strong>Human handoff</strong> — when bot confidence is low, route to a real operator in your CRM.</li>
              <li><strong>DPDPA-compliant logging</strong> — store conversations with consent, allow deletion. See our <Link to="/blog/lab-data-security-hipaa-india">data security guide</Link>.</li>
            </ul>

            <h2 id="metrics">Metrics That Matter</h2>
            <ul>
              <li><strong>Containment rate</strong> — % conversations resolved without human escalation. Target: 60-75%.</li>
              <li><strong>First response time</strong> — should be &lt; 5 seconds.</li>
              <li><strong>CSAT</strong> — post-chat 1-5 rating. Target: 4.3+.</li>
              <li><strong>Cost per conversation</strong> — LLM tokens + WhatsApp template cost. Should be &lt; ₹3.</li>
              <li><strong>Front-desk call volume drop</strong> — typically 40-60% within 90 days.</li>
            </ul>

            <h2 id="pitfalls">Pitfalls to Avoid</h2>
            <ul>
              <li><strong>Don't let the bot give medical advice.</strong> "Should I worry about my high TSH?" should always route to a doctor — never the bot.</li>
              <li><strong>Don't skip the human fallback.</strong> Patients hate bots that can't escalate.</li>
              <li><strong>Don't use unapproved WhatsApp templates.</strong> Meta will throttle/ban your number.</li>
              <li><strong>Don't store patient chats indefinitely.</strong> Set a retention policy (90-180 days for queries; longer only with explicit consent).</li>
            </ul>

            <p>AI chatbots are no longer a luxury for big chains — they're how mid-sized labs in 2026 free up staff for higher-value work while keeping patients happy. Combined with <Link to="/blog/ai-lab-report-generation-2026">AI report drafting</Link>, they form the front-and-back of an AI-augmented lab.</p>

            <BlogCTA source="blog_ai_chatbot" />
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

export default AiChatbotPatientComms;
