import React, { useEffect, useState } from 'react';
import NavHeader from '@/components/landing/NavHeader';
import FooterSection from '@/components/landing/FooterSection';
import BackToTop from '@/components/landing/BackToTop';

interface BlogLayoutProps {
  children: React.ReactNode;
  title: string;
  description: string;
  canonicalSlug: string;
  jsonLd?: object;
}

const BlogLayout = ({ children, title, description, canonicalSlug, jsonLd }: BlogLayoutProps) => {
  const [scrollY, setScrollY] = useState(0);
  const [readProgress, setReadProgress] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      setScrollY(window.scrollY);
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      setReadProgress(docHeight > 0 ? Math.min((window.scrollY / docHeight) * 100, 100) : 0);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    document.title = `${title} | LabFlow Blog`;
    const fullUrl = `https://labflow.mywebz.in/blog/${canonicalSlug}`;
    const imageUrl = 'https://labflow.mywebz.in/images/labflow-logo.png';

    const setMeta = (attr: string, key: string, content: string) => {
      let el = document.querySelector(`meta[${attr}="${key}"]`) as HTMLMetaElement;
      if (!el) {
        el = document.createElement('meta');
        el.setAttribute(attr, key);
        document.head.appendChild(el);
      }
      el.setAttribute('content', content);
    };

    // Standard meta
    setMeta('name', 'description', description);

    // Open Graph
    setMeta('property', 'og:title', `${title} | LabFlow Blog`);
    setMeta('property', 'og:description', description);
    setMeta('property', 'og:url', fullUrl);
    setMeta('property', 'og:type', 'article');
    setMeta('property', 'og:image', imageUrl);
    setMeta('property', 'og:site_name', 'LabFlow');

    // Twitter Card
    setMeta('name', 'twitter:card', 'summary_large_image');
    setMeta('name', 'twitter:title', `${title} | LabFlow Blog`);
    setMeta('name', 'twitter:description', description);
    setMeta('name', 'twitter:image', imageUrl);

    // Canonical
    let canonical = document.querySelector('link[rel="canonical"]') as HTMLLinkElement;
    if (!canonical) {
      canonical = document.createElement('link');
      canonical.rel = 'canonical';
      document.head.appendChild(canonical);
    }
    canonical.href = fullUrl;

    // JSON-LD
    if (jsonLd) {
      const script = document.createElement('script');
      script.type = 'application/ld+json';
      script.id = 'blog-jsonld';
      script.textContent = JSON.stringify(jsonLd);
      document.head.appendChild(script);
      return () => {
        const el = document.getElementById('blog-jsonld');
        if (el) el.remove();
      };
    }
  }, [title, description, canonicalSlug, jsonLd]);

  return (
    <div className="min-h-screen bg-background">
      {/* Reading progress bar */}
      <div
        className="fixed top-0 left-0 h-[3px] bg-primary z-[60] transition-[width] duration-150"
        style={{ width: `${readProgress}%` }}
        role="progressbar"
        aria-valuenow={Math.round(readProgress)}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label="Reading progress"
      />
      <NavHeader scrollY={scrollY} />
      <main className="pt-24 pb-16">
        {children}
      </main>
      <FooterSection footerContent={null} />
      <BackToTop />
    </div>
  );
};

export default BlogLayout;
