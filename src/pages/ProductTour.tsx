import React, { useState, useEffect, Suspense } from 'react';

// Lazy load components for performance
const NavHeader = React.lazy(() => import('@/components/landing/NavHeader'));
const TourHero = React.lazy(() => import('@/components/product-tour/TourHero'));
const StakeholderTabs = React.lazy(() => import('@/components/product-tour/StakeholderTabs'));
const FeatureDeepDive = React.lazy(() => import('@/components/product-tour/FeatureDeepDive'));
const SetupTimeline = React.lazy(() => import('@/components/product-tour/SetupTimeline'));
const ROICalculator = React.lazy(() => import('@/components/product-tour/ROICalculator'));
const ExpectationsGrid = React.lazy(() => import('@/components/product-tour/ExpectationsGrid'));
const TourCTA = React.lazy(() => import('@/components/product-tour/TourCTA'));
const TourFAQ = React.lazy(() => import('@/components/product-tour/TourFAQ'));
const ComparisonTable = React.lazy(() => import('@/components/product-tour/ComparisonTable'));
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

const ProductTour = () => {
  const [scrollY, setScrollY] = useState(0);

  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    document.title = 'Product Tour - See How Lab Master LIMS Works | Lab Master';
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
        <Suspense fallback={<SectionSkeleton />}>
          <TourHero />
        </Suspense>

        <div id="stakeholders">
          <Suspense fallback={<SectionSkeleton />}>
            <StakeholderTabs />
          </Suspense>
        </div>

        <Suspense fallback={<SectionSkeleton />}>
          <ComparisonTable />
        </Suspense>

        <Suspense fallback={<SectionSkeleton />}>
          <FeatureDeepDive />
        </Suspense>

        <Suspense fallback={<SectionSkeleton />}>
          <SetupTimeline />
        </Suspense>

        <Suspense fallback={<SectionSkeleton />}>
          <ExpectationsGrid />
        </Suspense>

        <Suspense fallback={<SectionSkeleton />}>
          <ROICalculator />
        </Suspense>

        <Suspense fallback={<SectionSkeleton />}>
          <TourFAQ />
        </Suspense>

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
