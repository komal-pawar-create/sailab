import React, { useEffect, useState } from 'react';
import NavHeader from '@/components/landing/NavHeader';
import FooterSection from '@/components/landing/FooterSection';
import BackToTop from '@/components/landing/BackToTop';

const TermsOfService = () => {
  const [scrollY, setScrollY] = useState(0);

  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    document.title = 'Terms of Service | LabFlow';
    const setMeta = (attr: string, key: string, content: string) => {
      let el = document.querySelector(`meta[${attr}="${key}"]`) as HTMLMetaElement;
      if (!el) { el = document.createElement('meta'); el.setAttribute(attr, key); document.head.appendChild(el); }
      el.setAttribute('content', content);
    };
    setMeta('name', 'description', 'LabFlow Terms of Service — rules and conditions governing the use of our LIMS platform.');
    setMeta('property', 'og:title', 'Terms of Service | LabFlow');
    setMeta('property', 'og:description', 'LabFlow Terms of Service — rules and conditions governing the use of our LIMS platform.');
    setMeta('property', 'og:url', 'https://labflow.mywebz.in/terms-of-service');
    setMeta('property', 'og:type', 'website');
    setMeta('property', 'og:site_name', 'LabFlow');
    let canonical = document.querySelector('link[rel="canonical"]') as HTMLLinkElement;
    if (!canonical) { canonical = document.createElement('link'); canonical.rel = 'canonical'; document.head.appendChild(canonical); }
    canonical.href = 'https://labflow.mywebz.in/terms-of-service';
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <NavHeader scrollY={scrollY} />
      <main className="pt-24 pb-16">
        <div className="max-w-3xl mx-auto px-4">
          <h1 className="text-3xl md:text-4xl font-heading font-bold text-foreground mb-2">Terms of Service</h1>
          <p className="text-sm text-muted-foreground mb-8">Last updated: 21 February 2026</p>

          <div className="prose prose-sm md:prose-base max-w-none text-foreground/90 space-y-6">
            <section>
              <h2 className="text-xl font-semibold text-foreground">1. Acceptance of Terms</h2>
              <p>By accessing or using LabFlow ("the Service"), you agree to be bound by these Terms of Service. If you are using the Service on behalf of a laboratory or organization, you represent that you have authority to bind that entity to these terms.</p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground">2. Description of Service</h2>
              <p>LabFlow is a cloud-based Laboratory Information Management System (LIMS) designed for pathology and diagnostic labs in India. The Service includes patient management, test reporting, billing, analytics, and related features as described on our website.</p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground">3. User Accounts</h2>
              <ul className="list-disc pl-6 space-y-1">
                <li>You must provide accurate and complete registration information</li>
                <li>You are responsible for maintaining the confidentiality of your account credentials</li>
                <li>You must immediately notify us of any unauthorized access to your account</li>
                <li>One subscription covers one lab entity; multi-branch labs require appropriate plans</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground">4. Acceptable Use</h2>
              <p>You agree not to:</p>
              <ul className="list-disc pl-6 space-y-1">
                <li>Use the Service for any unlawful purpose</li>
                <li>Attempt to reverse-engineer, decompile, or disassemble the software</li>
                <li>Share your account credentials with unauthorized users</li>
                <li>Upload malicious content, viruses, or harmful code</li>
                <li>Exceed the usage limits of your subscription plan</li>
                <li>Use the Service to store data unrelated to laboratory operations</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground">5. Data Ownership</h2>
              <p>You retain full ownership of all data you enter into LabFlow, including patient records, test results, and billing data. We do not claim any ownership or intellectual property rights over your data. You may export your data at any time.</p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground">6. Subscription & Payments</h2>
              <ul className="list-disc pl-6 space-y-1">
                <li>Subscriptions are billed monthly or annually as selected during purchase</li>
                <li>Prices are exclusive of GST (18%) unless stated otherwise</li>
                <li>Payment is due at the beginning of each billing cycle</li>
                <li>Failure to pay may result in service suspension after a 7-day grace period</li>
                <li>Annual Maintenance Charges (AMC) cover updates, support, and maintenance</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground">7. Service Availability</h2>
              <p>We strive for 99% uptime. Scheduled maintenance will be communicated in advance. We are not liable for downtime caused by factors beyond our control, including internet outages, natural disasters, or third-party service failures.</p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground">8. Limitation of Liability</h2>
              <p>LabFlow is provided "as is" without warranties of any kind. We shall not be liable for any indirect, incidental, special, or consequential damages arising from the use of our Service. Our total liability shall not exceed the amount paid by you in the 12 months preceding the claim.</p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground">9. Termination</h2>
              <p>Either party may terminate the subscription with 30 days' written notice. Upon termination, you will have 30 days to export your data. We reserve the right to suspend or terminate accounts that violate these terms without notice.</p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground">10. Governing Law</h2>
              <p>These terms are governed by the laws of India. Any disputes shall be subject to the exclusive jurisdiction of courts in Pune, Maharashtra.</p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground">11. Contact</h2>
              <p>For questions about these Terms, contact us at <a href="mailto:support@labflow.mywebz.in" className="text-primary hover:underline">support@labflow.mywebz.in</a>.</p>
            </section>
          </div>
        </div>
      </main>
      <FooterSection footerContent={null} />
      <BackToTop />
    </div>
  );
};

export default TermsOfService;
