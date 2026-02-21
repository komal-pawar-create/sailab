import React, { useEffect, useState } from 'react';
import NavHeader from '@/components/landing/NavHeader';
import FooterSection from '@/components/landing/FooterSection';
import BackToTop from '@/components/landing/BackToTop';

const RefundPolicy = () => {
  const [scrollY, setScrollY] = useState(0);

  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    document.title = 'Refund Policy | LabFlow';
    const setMeta = (attr: string, key: string, content: string) => {
      let el = document.querySelector(`meta[${attr}="${key}"]`) as HTMLMetaElement;
      if (!el) { el = document.createElement('meta'); el.setAttribute(attr, key); document.head.appendChild(el); }
      el.setAttribute('content', content);
    };
    setMeta('name', 'description', 'LabFlow Refund Policy — our cancellation, refund, and subscription policies.');
    setMeta('property', 'og:title', 'Refund Policy | LabFlow');
    setMeta('property', 'og:description', 'LabFlow Refund Policy — our cancellation, refund, and subscription policies.');
    setMeta('property', 'og:url', 'https://labflow.mywebz.in/refund-policy');
    setMeta('property', 'og:type', 'website');
    setMeta('property', 'og:site_name', 'LabFlow');
    let canonical = document.querySelector('link[rel="canonical"]') as HTMLLinkElement;
    if (!canonical) { canonical = document.createElement('link'); canonical.rel = 'canonical'; document.head.appendChild(canonical); }
    canonical.href = 'https://labflow.mywebz.in/refund-policy';
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <NavHeader scrollY={scrollY} />
      <main className="pt-24 pb-16">
        <div className="max-w-3xl mx-auto px-4">
          <h1 className="text-3xl md:text-4xl font-heading font-bold text-foreground mb-2">Refund Policy</h1>
          <p className="text-sm text-muted-foreground mb-8">Last updated: 21 February 2026</p>

          <div className="prose prose-sm md:prose-base max-w-none text-foreground/90 space-y-6">
            <section>
              <h2 className="text-xl font-semibold text-foreground">1. Free Trial</h2>
              <p>LabFlow offers a free trial period for new users to evaluate the platform. No payment is required during the trial. If you choose not to continue after the trial, your account will be deactivated and no charges will apply.</p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground">2. Subscription Cancellation</h2>
              <ul className="list-disc pl-6 space-y-1">
                <li>You may cancel your subscription at any time from your account settings or by contacting support</li>
                <li>Cancellation takes effect at the end of the current billing cycle</li>
                <li>You will continue to have access to the Service until the end of your paid period</li>
                <li>No partial refunds are provided for unused days within a billing cycle</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground">3. Refund Eligibility</h2>
              <p>Refunds may be issued in the following cases:</p>
              <ul className="list-disc pl-6 space-y-1">
                <li><strong>Within 7 days of first payment:</strong> Full refund if you are not satisfied with the Service, no questions asked</li>
                <li><strong>Service outage:</strong> Pro-rata credit for extended outages (more than 24 consecutive hours) not caused by scheduled maintenance</li>
                <li><strong>Billing errors:</strong> Full refund for any duplicate or incorrect charges</li>
                <li><strong>Annual plans:</strong> Pro-rata refund for unused months if cancelled within the first 30 days</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground">4. Non-Refundable Items</h2>
              <ul className="list-disc pl-6 space-y-1">
                <li>Setup or onboarding fees (if applicable)</li>
                <li>Custom development or integration work</li>
                <li>Third-party add-on costs (SMS credits, WhatsApp API charges)</li>
                <li>Subscriptions cancelled after the 7-day satisfaction guarantee period</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground">5. How to Request a Refund</h2>
              <p>To request a refund:</p>
              <ol className="list-decimal pl-6 space-y-1">
                <li>Email <a href="mailto:support@labflow.mywebz.in" className="text-primary hover:underline">support@labflow.mywebz.in</a> with your account details and reason for the refund</li>
                <li>Or call us at <a href="tel:+918888567870" className="text-primary hover:underline">+91 88885 67870</a></li>
                <li>Include your registered email, lab name, and payment reference</li>
              </ol>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground">6. Refund Processing</h2>
              <ul className="list-disc pl-6 space-y-1">
                <li>Approved refunds are processed within 7–10 business days</li>
                <li>Refunds are credited to the original payment method</li>
                <li>Bank processing times may add 3–5 additional business days</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground">7. Plan Downgrades</h2>
              <p>If you downgrade your plan, the new pricing takes effect at the start of the next billing cycle. No refund is provided for the difference in the current cycle, but unused premium features remain accessible until the cycle ends.</p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground">8. Contact</h2>
              <p>For any billing or refund questions, reach us at <a href="mailto:support@labflow.mywebz.in" className="text-primary hover:underline">support@labflow.mywebz.in</a> or <a href="tel:+918888567870" className="text-primary hover:underline">+91 88885 67870</a>.</p>
            </section>
          </div>
        </div>
      </main>
      <FooterSection footerContent={null} />
      <BackToTop />
    </div>
  );
};

export default RefundPolicy;
