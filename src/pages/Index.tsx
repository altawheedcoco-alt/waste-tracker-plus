import { lazy, Suspense } from "react";
import Header from "@/components/Header";
import Hero from "@/components/Hero";
import LandingWrapper from "@/components/LandingWrapper";
import NewsTicker from "@/components/NewsTicker";

// Lazy load below-fold sections
const Stats = lazy(() => import("@/components/Stats"));
const FeaturesList = lazy(() => import("@/components/FeaturesList"));
const Features = lazy(() => import("@/components/Features"));
const Services = lazy(() => import("@/components/Services"));
const CTA = lazy(() => import("@/components/CTA"));
const Footer = lazy(() => import("@/components/Footer"));
const DocumentVerification = lazy(() => import("@/components/DocumentVerification"));
const HomepageAds = lazy(() => import("@/components/ads/HomepageAds"));

const SectionFallback = () => (
  <div className="h-32 flex items-center justify-center">
    <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
  </div>
);

const Index = () => {
  return (
    <LandingWrapper>
      <div className="min-h-screen bg-[hsl(140,20%,98%)]">
        <Header />
        <NewsTicker />
        <Hero />
        <main>
          <Suspense fallback={<SectionFallback />}>
            <HomepageAds />
            <DocumentVerification />
            <Stats />
            <FeaturesList />
            <Features />
            <Services />
            <CTA />
          </Suspense>
        </main>
        <Suspense fallback={null}>
          <Footer />
        </Suspense>
      </div>
    </LandingWrapper>
  );
};

export default Index;
