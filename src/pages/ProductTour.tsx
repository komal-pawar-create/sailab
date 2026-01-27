import React, { useState, useEffect, Suspense } from 'react';

// Lazy load components for performance
const NavHeader = React.lazy(() => import('@/components/landing/NavHeader'));
const TourHero = React.lazy(() => import('@/components/product-tour/TourHero'));
const VideoGallery = React.lazy(() => import('@/components/product-tour/VideoGallery'));
const PlatformPreview = React.lazy(() => import('@/components/product-tour/PlatformPreview'));
const StakeholderTabs = React.lazy(() => import('@/components/product-tour/StakeholderTabs'));
const PatientJourneyFlow = React.lazy(() => import('@/components/product-tour/PatientJourneyFlow'));
const BeforeAfterSlider = React.lazy(() => import('@/components/product-tour/BeforeAfterSlider'));
const ComparisonTable = React.lazy(() => import('@/components/product-tour/ComparisonTable'));
const FeatureDeepDive = React.lazy(() => import('@/components/product-tour/FeatureDeepDive'));
const CustomerLogos = React.lazy(() => import('@/components/product-tour/CustomerLogos'));
const SetupTimeline = React.lazy(() => import('@/components/product-tour/SetupTimeline'));
const ExpectationsGrid = React.lazy(() => import('@/components/product-tour/ExpectationsGrid'));
const ROICalculator = React.lazy(() => import('@/components/product-tour/ROICalculator'));
const TourFAQ = React.lazy(() => import('@/components/product-tour/TourFAQ'));
const TourCTA = React.lazy(() => import('@/components/product-tour/TourCTA'));
const FooterSection = React.lazy(() => import('@/components/landing/FooterSection'));
const BackToTop = React.lazy(() => import('@/components/landing/BackToTop'));

// Loading skeleton
const SectionSkeleton = () => (
  <div className="py-20 px-4">
    <div className="max-w-6xl mx-auto">
      <div className="h-8 w-32 bg-muted rounded-full mx-auto mb-4 animate-pulse" />
      <div className="h-12 w-96 max-w-full bg-muted rounded-lg mx-auto mb-4 animate-pulse" />
      <div className="h-6 w-64 max-w-full bg-muted rounded-lg mx-auto animate-pulse" />
    </div>
  </div>
);

// Hero skeleton with 3D placeholder
const HeroSkeleton = () => (
  <div className="min-h-[90vh] flex items-center justify-center px-4 pt-24 pb-16">
    <div className="max-w-5xl mx-auto text-center">
      <div className="h-8 w-40 bg-muted rounded-full mx-auto mb-6 animate-pulse" />
      <div className="h-16 w-full max-w-2xl bg-muted rounded-lg mx-auto mb-4 animate-pulse" />
      <div className="h-12 w-80 max-w-full bg-muted rounded-lg mx-auto mb-8 animate-pulse" />
      <div className="h-6 w-96 max-w-full bg-muted rounded-lg mx-auto mb-10 animate-pulse" />
      <div className="flex gap-4 justify-center mb-12">
        <div className="h-14 w-40 bg-muted rounded-lg animate-pulse" />
        <div className="h-14 w-40 bg-muted rounded-lg animate-pulse" />
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-32 bg-muted rounded-2xl animate-pulse" />
        ))}
      </div>
    </div>
  </div>
);

const ProductTour = () => {
  const [scrollY, setScrollY] = useState(0);

  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const pageTitle = 'Product Tour - See How LabFlow LIMS Works | LabFlow';
    const pageDescription = 'Interactive product tour of LabFlow LIMS. See how our platform transforms lab operations with patient management, billing, reports, and analytics. Trusted by 500+ labs across India.';
    const pageUrl = 'https://labflow.mywebz.in/product-tour';
    const pageImage = 'https://labflow.mywebz.in/images/labflow-logo.png';
    
    document.title = pageTitle;
    
    // Helper to set or create meta tags
    const setMetaTag = (selector: string, attribute: string, content: string) => {
      let meta = document.querySelector(selector);
      if (!meta) {
        meta = document.createElement('meta');
        if (selector.includes('property=')) {
          meta.setAttribute('property', selector.match(/property="([^"]+)"/)?.[1] || '');
        } else if (selector.includes('name=')) {
          meta.setAttribute('name', selector.match(/name="([^"]+)"/)?.[1] || '');
        }
        document.head.appendChild(meta);
      }
      meta.setAttribute(attribute, content);
    };

    // Basic meta description
    setMetaTag('meta[name="description"]', 'content', pageDescription);
    
    // Open Graph meta tags
    setMetaTag('meta[property="og:type"]', 'content', 'website');
    setMetaTag('meta[property="og:url"]', 'content', pageUrl);
    setMetaTag('meta[property="og:title"]', 'content', pageTitle);
    setMetaTag('meta[property="og:description"]', 'content', pageDescription);
    setMetaTag('meta[property="og:image"]', 'content', pageImage);
    setMetaTag('meta[property="og:site_name"]', 'content', 'LabFlow');
    setMetaTag('meta[property="og:locale"]', 'content', 'en_IN');
    
    // Twitter Card meta tags
    setMetaTag('meta[name="twitter:card"]', 'content', 'summary_large_image');
    setMetaTag('meta[name="twitter:url"]', 'content', pageUrl);
    setMetaTag('meta[name="twitter:title"]', 'content', pageTitle);
    setMetaTag('meta[name="twitter:description"]', 'content', pageDescription);
    setMetaTag('meta[name="twitter:image"]', 'content', pageImage);
    
    // Canonical URL
    let canonical = document.querySelector('link[rel="canonical"]');
    if (!canonical) {
      canonical = document.createElement('link');
      canonical.setAttribute('rel', 'canonical');
      document.head.appendChild(canonical);
    }
    canonical.setAttribute('href', pageUrl);

    // JSON-LD Structured Data for Product Tour page
    const jsonLdScript = document.createElement('script');
    jsonLdScript.type = 'application/ld+json';
    jsonLdScript.id = 'product-tour-jsonld';
    jsonLdScript.textContent = JSON.stringify({
      "@context": "https://schema.org",
      "@type": "WebPage",
      "name": "LabFlow Product Tour",
      "description": pageDescription,
      "url": pageUrl,
      "mainEntity": {
        "@type": "SoftwareApplication",
        "name": "LabFlow LIMS",
        "applicationCategory": "HealthApplication",
        "operatingSystem": "Web",
        "description": "Complete laboratory management system with patient management, test reporting, billing, and analytics",
        "offers": {
          "@type": "Offer",
          "price": "5000",
          "priceCurrency": "INR"
        },
        "featureList": [
          "Patient Management",
          "Test Report Generation",
          "Billing & Invoicing",
          "Multi-Branch Support",
          "Role-Based Access Control",
          "Analytics Dashboard",
          "WhatsApp Integration",
          "Multi-Language Support"
        ]
      },
      "breadcrumb": {
        "@type": "BreadcrumbList",
        "itemListElement": [
          {
            "@type": "ListItem",
            "position": 1,
            "name": "Home",
            "item": "https://labflow.mywebz.in/"
          },
          {
            "@type": "ListItem",
            "position": 2,
            "name": "Product Tour",
            "item": pageUrl
          }
        ]
      },
      "publisher": {
        "@type": "Organization",
        "name": "LabFlow",
        "url": "https://labflow.mywebz.in",
        "logo": pageImage
      }
    });
    
    // Remove existing JSON-LD if any, then add new one
    const existingJsonLd = document.getElementById('product-tour-jsonld');
    if (existingJsonLd) {
      existingJsonLd.remove();
    }
    document.head.appendChild(jsonLdScript);

    // Cleanup on unmount
    return () => {
      const scriptToRemove = document.getElementById('product-tour-jsonld');
      if (scriptToRemove) {
        scriptToRemove.remove();
      }
    };
  }, []);

  return (
    <div className="min-h-screen bg-background overflow-x-hidden">
      {/* Skip to content link */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-[100] focus:px-4 focus:py-2 focus:bg-primary focus:text-primary-foreground focus:rounded-md"
      >
        Skip to main content
      </a>

      <Suspense fallback={<div className="h-16" />}>
        <NavHeader scrollY={scrollY} />
      </Suspense>

      <main id="main-content" role="main">
        {/* Hero Section with 3D Elements */}
        <Suspense fallback={<HeroSkeleton />}>
          <TourHero />
        </Suspense>

        {/* Video Gallery Section */}
        <Suspense fallback={<SectionSkeleton />}>
          <VideoGallery />
        </Suspense>

        {/* Interactive Platform Preview */}
        <Suspense fallback={<SectionSkeleton />}>
          <PlatformPreview />
        </Suspense>

        {/* Stakeholder-based Journey */}
        <div id="stakeholders">
          <Suspense fallback={<SectionSkeleton />}>
            <StakeholderTabs />
          </Suspense>
        </div>

        {/* Patient Journey Flow Infographic */}
        <Suspense fallback={<SectionSkeleton />}>
          <PatientJourneyFlow />
        </Suspense>

        {/* Before/After Comparison Slider */}
        <Suspense fallback={<SectionSkeleton />}>
          <BeforeAfterSlider />
        </Suspense>

        {/* Feature Comparison Table */}
        <Suspense fallback={<SectionSkeleton />}>
          <ComparisonTable />
        </Suspense>

        {/* Feature Deep Dive Accordion */}
        <Suspense fallback={<SectionSkeleton />}>
          <FeatureDeepDive />
        </Suspense>

        {/* Customer Logos & Testimonials */}
        <Suspense fallback={<SectionSkeleton />}>
          <CustomerLogos />
        </Suspense>

        {/* Setup Timeline */}
        <Suspense fallback={<SectionSkeleton />}>
          <SetupTimeline />
        </Suspense>

        {/* Expectations Grid */}
        <Suspense fallback={<SectionSkeleton />}>
          <ExpectationsGrid />
        </Suspense>

        {/* ROI Calculator */}
        <Suspense fallback={<SectionSkeleton />}>
          <ROICalculator />
        </Suspense>

        {/* FAQ Section */}
        <Suspense fallback={<SectionSkeleton />}>
          <TourFAQ />
        </Suspense>

        {/* Final CTA */}
        <Suspense fallback={<SectionSkeleton />}>
          <TourCTA />
        </Suspense>
      </main>

      <Suspense fallback={<div className="h-64 bg-muted" />}>
        <FooterSection footerContent={null} />
      </Suspense>

      <Suspense fallback={null}>
        <BackToTop />
      </Suspense>
    </div>
  );
};

export default ProductTour;
