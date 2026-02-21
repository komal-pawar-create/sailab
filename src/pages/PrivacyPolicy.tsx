import React, { useEffect, useState } from 'react';
import NavHeader from '@/components/landing/NavHeader';
import FooterSection from '@/components/landing/FooterSection';
import BackToTop from '@/components/landing/BackToTop';

const PrivacyPolicy = () => {
  const [scrollY, setScrollY] = useState(0);

  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    document.title = 'Privacy Policy | LabFlow';
    const setMeta = (attr: string, key: string, content: string) => {
      let el = document.querySelector(`meta[${attr}="${key}"]`) as HTMLMetaElement;
      if (!el) { el = document.createElement('meta'); el.setAttribute(attr, key); document.head.appendChild(el); }
      el.setAttribute('content', content);
    };
    setMeta('name', 'description', 'LabFlow Privacy Policy — how we collect, use, and protect your data.');
    let canonical = document.querySelector('link[rel="canonical"]') as HTMLLinkElement;
    if (!canonical) { canonical = document.createElement('link'); canonical.rel = 'canonical'; document.head.appendChild(canonical); }
    canonical.href = 'https://labflow.mywebz.in/privacy-policy';
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <NavHeader scrollY={scrollY} />
      <main className="pt-24 pb-16">
        <div className="max-w-3xl mx-auto px-4">
          <h1 className="text-3xl md:text-4xl font-heading font-bold text-foreground mb-2">Privacy Policy</h1>
          <p className="text-sm text-muted-foreground mb-8">Last updated: 21 February 2026</p>

          <div className="prose prose-sm md:prose-base max-w-none text-foreground/90 space-y-6">
            <section>
              <h2 className="text-xl font-semibold text-foreground">1. Information We Collect</h2>
              <p>We collect information you provide directly when you create an account, register your lab, or contact us. This includes:</p>
              <ul className="list-disc pl-6 space-y-1">
                <li>Name, email address, phone number</li>
                <li>Lab/organization name and address</li>
                <li>Patient data entered into the system (managed by your lab)</li>
                <li>Billing and payment information</li>
                <li>Usage data and analytics (pages visited, features used)</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground">2. How We Use Your Information</h2>
              <ul className="list-disc pl-6 space-y-1">
                <li>To provide, maintain, and improve our LIMS platform</li>
                <li>To process transactions and send billing notifications</li>
                <li>To send service-related communications (updates, security alerts)</li>
                <li>To provide customer support</li>
                <li>To analyze usage patterns and improve user experience</li>
                <li>To comply with legal obligations</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground">3. Data Storage & Security</h2>
              <p>Your data is stored on secure, encrypted servers hosted in India. We implement industry-standard security measures including:</p>
              <ul className="list-disc pl-6 space-y-1">
                <li>AES-256 encryption for data at rest</li>
                <li>TLS 1.3 encryption for data in transit</li>
                <li>Role-based access controls</li>
                <li>Regular security audits and vulnerability assessments</li>
                <li>Automated backups with disaster recovery procedures</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground">4. Patient Data</h2>
              <p>Patient data entered into LabFlow is owned and controlled by your laboratory. We act as a data processor on your behalf. We do not sell, share, or use patient data for any purpose other than providing our services to your lab. Labs are responsible for obtaining appropriate patient consent as required by applicable laws.</p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground">5. Third-Party Services</h2>
              <p>We may use third-party services for analytics, payment processing, and communication (SMS, WhatsApp, email). These providers have their own privacy policies and are bound by data processing agreements with us.</p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground">6. Cookies & Tracking</h2>
              <p>We use essential cookies for authentication and session management. Analytics cookies help us understand how you use our platform. You can disable non-essential cookies in your browser settings.</p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground">7. Your Rights</h2>
              <ul className="list-disc pl-6 space-y-1">
                <li>Access, correct, or delete your personal information</li>
                <li>Export your data in a portable format</li>
                <li>Opt out of marketing communications</li>
                <li>Request account deletion</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground">8. Data Retention</h2>
              <p>We retain your account data for as long as your account is active. Upon account deletion, personal data is removed within 30 days. Anonymized analytics data may be retained for service improvement purposes.</p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground">9. Changes to This Policy</h2>
              <p>We may update this Privacy Policy from time to time. We will notify you of significant changes via email or in-app notification. Continued use of LabFlow after changes constitutes acceptance.</p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground">10. Contact Us</h2>
              <p>For privacy-related inquiries, contact us at <a href="mailto:support@labflow.mywebz.in" className="text-primary hover:underline">support@labflow.mywebz.in</a> or call <a href="tel:+918888567870" className="text-primary hover:underline">+91 88885 67870</a>.</p>
            </section>
          </div>
        </div>
      </main>
      <FooterSection footerContent={null} />
      <BackToTop />
    </div>
  );
};

export default PrivacyPolicy;
