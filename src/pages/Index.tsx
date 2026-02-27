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
const TrustedPartnersSection = lazy(() => import("@/components/landing/TrustedPartnersSection"));

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
    // Delay ticker to after FCP - don't block initial render
    const id = setTimeout(() => setShow(true), 3000);
    return () => clearTimeout(id);
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
              <div id="ads"><LazySection><HomepageAds /></LazySection></div>
              <div id="partners"><LazySection><TrustedPartnersSection /></LazySection></div>
              <div id="stats"><LazySection><Stats /></LazySection></div>
              <div id="verify"><LazySection><DocumentVerification /></LazySection></div>
              <div id="consultants"><LazySection><FeaturedConsultants /></LazySection></div>
              <div id="initiative"><LazySection><NationalInitiativeSection /></LazySection></div>
              <div id="features"><LazySection><Features /></LazySection></div>
              <div id="features-list"><LazySection><FeaturesList /></LazySection></div>
              <div id="doc-ai"><LazySection><DocumentAIShowcase /></LazySection></div>
              <div id="smart-agent"><LazySection><SmartAgentShowcase /></LazySection></div>
              <div id="services"><LazySection><Services /></LazySection></div>
              <div id="omaluna"><LazySection><OmalunaSection /></LazySection></div>
              <div id="testimonials"><LazySection><TestimonialsSection /></LazySection></div>
              <div id="cta"><LazySection><CTA /></LazySection></div>
            </ErrorBoundary>
          </main>
          <LazySection><Footer /></LazySection>
        </div>
      </LandingWrapper>
    </Suspense>
  );
};

export default Index;
