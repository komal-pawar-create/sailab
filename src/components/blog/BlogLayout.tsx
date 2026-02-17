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

  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    document.title = `${title} | LabFlow Blog`;
    
    const metaDesc = document.querySelector('meta[name="description"]');
    if (metaDesc) metaDesc.setAttribute('content', description);
    else {
      const meta = document.createElement('meta');
      meta.name = 'description';
      meta.content = description;
      document.head.appendChild(meta);
    }

    // Canonical
    let canonical = document.querySelector('link[rel="canonical"]') as HTMLLinkElement;
    if (!canonical) {
      canonical = document.createElement('link');
      canonical.rel = 'canonical';
      document.head.appendChild(canonical);
    }
    canonical.href = `https://labflow.mywebz.in/blog/${canonicalSlug}`;

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
