import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import NavHeader from '@/components/landing/NavHeader';
import FooterSection from '@/components/landing/FooterSection';
import BackToTop from '@/components/landing/BackToTop';
import AuthorCard from '@/components/blog/AuthorCard';
import SocialShare from '@/components/blog/SocialShare';
import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';

interface BlogLayoutProps {
  children: React.ReactNode;
  title: string;
  description: string;
  canonicalSlug: string;
  jsonLd?: object;
  datePublished?: string;
  dateModified?: string;
  ogImage?: string;
  author?: string;
  readTime?: string;
}

const BlogLayout = ({ children, title, description, canonicalSlug, jsonLd, datePublished, dateModified, ogImage, author, readTime }: BlogLayoutProps) => {
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
    const imageUrl = ogImage || 'https://labflow.mywebz.in/images/labflow-logo.png';

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
    
    // Keywords meta (if jsonLd has keywords)
    if (jsonLd && (jsonLd as any).keywords) {
      const kw = (jsonLd as any).keywords;
      setMeta('name', 'keywords', Array.isArray(kw) ? kw.join(', ') : kw);
    }

    // Open Graph
    setMeta('property', 'og:title', `${title} | LabFlow Blog`);
    setMeta('property', 'og:description', description);
    setMeta('property', 'og:url', fullUrl);
    setMeta('property', 'og:type', 'article');
    setMeta('property', 'og:image', imageUrl);
    setMeta('property', 'og:site_name', 'LabFlow');

    // Article time meta tags
    if (datePublished) {
      setMeta('property', 'article:published_time', datePublished);
    }
    if (dateModified) {
      setMeta('property', 'article:modified_time', dateModified);
    }

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

    // Hreflang alternate links for multilingual SEO
    const hreflangLinks: HTMLLinkElement[] = [];
    const langs = [
      { code: 'en-IN', suffix: '' },
      { code: 'hi-IN', suffix: '?lang=hi' },
      { code: 'mr-IN', suffix: '?lang=mr' },
    ];
    langs.forEach(({ code, suffix }) => {
      const link = document.createElement('link');
      link.rel = 'alternate';
      link.hreflang = code;
      link.href = `${fullUrl}${suffix}`;
      document.head.appendChild(link);
      hreflangLinks.push(link);
    });
    const xDefault = document.createElement('link');
    xDefault.rel = 'alternate';
    xDefault.hreflang = 'x-default';
    xDefault.href = fullUrl;
    document.head.appendChild(xDefault);
    hreflangLinks.push(xDefault);

    // JSON-LD: article schema + breadcrumb schema
    const scripts: HTMLScriptElement[] = [];

    if (jsonLd) {
      const script = document.createElement('script');
      script.type = 'application/ld+json';
      script.id = 'blog-jsonld';
      script.textContent = JSON.stringify(jsonLd);
      document.head.appendChild(script);
      scripts.push(script);
    }

    // BreadcrumbList structured data
    if (canonicalSlug) {
      const breadcrumbLd = {
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://labflow.mywebz.in/' },
          { '@type': 'ListItem', position: 2, name: 'Blog', item: 'https://labflow.mywebz.in/blog' },
          { '@type': 'ListItem', position: 3, name: title, item: fullUrl },
        ],
      };
      const bcScript = document.createElement('script');
      bcScript.type = 'application/ld+json';
      bcScript.id = 'blog-breadcrumb-jsonld';
      bcScript.textContent = JSON.stringify(breadcrumbLd);
      document.head.appendChild(bcScript);
      scripts.push(bcScript);
    }

    return () => {
      scripts.forEach(s => s.remove());
      hreflangLinks.forEach(l => l.remove());
    };
  }, [title, description, canonicalSlug, jsonLd, datePublished, dateModified]);

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
        {/* Visible breadcrumb navigation */}
        {canonicalSlug && (
          <div className="max-w-6xl mx-auto px-4 mb-4">
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem>
                  <BreadcrumbLink asChild>
                    <Link to="/">Home</Link>
                  </BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbLink asChild>
                    <Link to="/blog">Blog</Link>
                  </BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbPage>{title}</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>
        )}

        {/* Author + Social Share bar */}
        {(author || readTime) && (
          <div className="max-w-6xl mx-auto px-4 mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            {author && datePublished && readTime && (
              <AuthorCard author={author} datePublished={datePublished} readTime={readTime} />
            )}
            <SocialShare
              url={`https://labflow.mywebz.in/blog/${canonicalSlug}`}
              title={title}
            />
          </div>
        )}

        {children}
      </main>
      <FooterSection footerContent={null} />
      <BackToTop />
    </div>
  );
};

export default BlogLayout;
