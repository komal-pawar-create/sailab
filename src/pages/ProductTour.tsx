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
    document.title = 'Product Tour - See How LabFlow LIMS Works | LabFlow';
    
    // Add meta description for SEO
    const metaDescription = document.querySelector('meta[name="description"]');
    if (metaDescription) {
      metaDescription.setAttribute('content', 'Interactive product tour of LabFlow LIMS. See how our platform transforms lab operations with patient management, billing, reports, and analytics.');
    }
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
