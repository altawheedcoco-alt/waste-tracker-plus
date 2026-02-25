import { lazy, Suspense, memo, useRef, useState, useEffect, ComponentType } from "react";
import Header from "@/components/Header";
import Hero from "@/components/Hero";
import LandingWrapper from "@/components/LandingWrapper";
import NewsTicker from "@/components/NewsTicker";
import { ErrorBoundary } from "@/components/common/ErrorBoundary";

// Lazy load below-fold sections
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
      { rootMargin: '200px' }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={ref} style={{ minHeight: visible ? undefined : '100px' }}>
      {visible ? (
        <Suspense fallback={<div className="h-32 flex items-center justify-center"><div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" /></div>}>
          {children}
        </Suspense>
      ) : null}
    </div>
  );
});
LazySection.displayName = 'LazySection';

const Index = () => {
  return (
    <LandingWrapper>
      <div className="min-h-screen-safe bg-[hsl(140,20%,98%)] smooth-scroll">
        <ErrorBoundary fallbackTitle="خطأ في تحميل الرأس">
          <Header />
          <NewsTicker />
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
  );
};

export default Index;
