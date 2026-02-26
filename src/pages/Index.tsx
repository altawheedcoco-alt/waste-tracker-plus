import { lazy, Suspense, memo, useRef, useState, useEffect } from "react";
import { ErrorBoundary } from "@/components/common/ErrorBoundary";

// Critical above-fold: load eagerly but keep lightweight
import Header from "@/components/Header";
import Hero from "@/components/Hero";

// Deferred: LandingWrapper is lightweight but not paint-critical
const LandingWrapper = lazy(() => import("@/components/LandingWrapper"));

// NewsTicker is visually secondary — defer it
const NewsTicker = lazy(() => import("@/components/NewsTicker"));

// Lazy load all below-fold sections
const Stats = lazy(() => import("@/components/Stats"));
const FeaturesList = lazy(() => import("@/components/FeaturesList"));
const Features = lazy(() => import("@/components/Features"));
const Services = lazy(() => import("@/components/Services"));
const CTA = lazy(() => import("@/components/CTA"));
const Footer = lazy(() => import("@/components/Footer"));
const DocumentVerification = lazy(() => import("@/components/DocumentVerification"));
const HomepageAds = lazy(() => import("@/components/ads/HomepageAds"));
const FeaturedConsultants = lazy(() => import("@/components/landing/FeaturedConsultants"));
const OmalunaSection = lazy(() => import("@/components/landing/OmalunaSection"));
const TestimonialsSection = lazy(() => import("@/components/landing/TestimonialsSection"));
const NationalInitiativeSection = lazy(() => import("@/components/landing/NationalInitiativeSection"));
const DocumentAIShowcase = lazy(() => import("@/components/landing/DocumentAIShowcase"));
const SmartAgentShowcase = lazy(() => import("@/components/landing/SmartAgentShowcase"));

/** Only renders children when the container scrolls into view */
const LazySection = memo(({ children }: { children: React.ReactNode }) => {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setVisible(true); observer.disconnect(); } },
      { rootMargin: '300px' }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={ref} style={{ minHeight: visible ? undefined : '80px' }}>
      {visible ? (
        <Suspense fallback={null}>
          {children}
        </Suspense>
      ) : null}
    </div>
  );
});
LazySection.displayName = 'LazySection';

/** Deferred ticker — renders after a short delay to not block FCP */
const DeferredTicker = memo(() => {
  const [show, setShow] = useState(false);
  useEffect(() => {
    const id = requestIdleCallback ? requestIdleCallback(() => setShow(true)) : setTimeout(() => setShow(true), 1500);
    return () => { if (typeof cancelIdleCallback !== 'undefined') cancelIdleCallback(id as number); else clearTimeout(id as any); };
  }, []);
  if (!show) return <div className="h-[42px] sm:h-[36px]" />;
  return (
    <Suspense fallback={<div className="h-[42px] sm:h-[36px]" />}>
      <NewsTicker />
    </Suspense>
  );
});
DeferredTicker.displayName = 'DeferredTicker';

const Index = () => {
  return (
    <Suspense fallback={null}>
      <LandingWrapper>
        <div className="min-h-screen-safe bg-[hsl(140,20%,98%)] smooth-scroll">
          <ErrorBoundary fallbackTitle="خطأ في تحميل الرأس">
            <Header />
            <DeferredTicker />
          </ErrorBoundary>
          <ErrorBoundary fallbackTitle="خطأ في تحميل القسم الرئيسي">
            <Hero />
          </ErrorBoundary>
          <main>
            <ErrorBoundary fallbackTitle="خطأ في تحميل المحتوى">
              <LazySection><HomepageAds /></LazySection>
              <LazySection><DocumentVerification /></LazySection>
              <LazySection><FeaturedConsultants /></LazySection>
              <LazySection><OmalunaSection /></LazySection>
              <LazySection><NationalInitiativeSection /></LazySection>
              <LazySection><Stats /></LazySection>
              <LazySection><FeaturesList /></LazySection>
              <LazySection><Features /></LazySection>
              <LazySection><DocumentAIShowcase /></LazySection>
              <LazySection><SmartAgentShowcase /></LazySection>
              <LazySection><TestimonialsSection /></LazySection>
              <LazySection><Services /></LazySection>
              <LazySection><CTA /></LazySection>
            </ErrorBoundary>
          </main>
          <LazySection><Footer /></LazySection>
        </div>
      </LandingWrapper>
    </Suspense>
  );
};

export default Index;
