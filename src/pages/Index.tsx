import { lazy, Suspense, memo, useRef, useState, useEffect } from "react";
import { useVisitorTracking } from "@/hooks/useVisitorTracking";
import { ErrorBoundary } from "@/components/common/ErrorBoundary";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

// Retry wrapper for lazy imports — handles stale chunk errors after deploys
function lazyRetry<T extends React.ComponentType<any>>(
  factory: () => Promise<{ default: T }>,
  retries = 2
): React.LazyExoticComponent<T> {
  return lazy(async () => {
    for (let i = 0; i <= retries; i++) {
      try {
        return await factory();
      } catch (err) {
        if (i < retries) {
          await new Promise(r => setTimeout(r, 500 * (i + 1)));
        } else {
          window.location.reload();
          throw err;
        }
      }
    }
    throw new Error('lazyRetry exhausted');
  });
}

// Critical above-fold: load eagerly
import Header from "@/components/Header";
import VersionBar from "@/components/VersionBar";
import Hero from "@/components/Hero";

// Deferred: LandingWrapper is lightweight but not paint-critical
const LandingWrapper = lazyRetry(() => import("@/components/LandingWrapper"));

// NewsTicker is visually secondary — defer it
const NewsTicker = lazyRetry(() => import("@/components/NewsTicker"));

// Lazy load all below-fold sections
const Stats = lazyRetry(() => import("@/components/Stats"));
const FeaturesList = lazyRetry(() => import("@/components/FeaturesList"));
const Features = lazyRetry(() => import("@/components/Features"));
const Services = lazyRetry(() => import("@/components/Services"));
const CTA = lazyRetry(() => import("@/components/CTA"));
const Footer = lazyRetry(() => import("@/components/Footer"));
const DocumentVerification = lazyRetry(() => import("@/components/DocumentVerification"));
const HomepageAds = lazyRetry(() => import("@/components/ads/HomepageAds"));
const FeaturedConsultants = lazyRetry(() => import("@/components/landing/FeaturedConsultants"));
const OmalunaSection = lazyRetry(() => import("@/components/landing/OmalunaSection"));
const TestimonialsSection = lazyRetry(() => import("@/components/landing/TestimonialsSection"));
const NationalInitiativeSection = lazyRetry(() => import("@/components/landing/NationalInitiativeSection"));
const DocumentAIShowcase = lazyRetry(() => import("@/components/landing/DocumentAIShowcase"));
const SmartAgentShowcase = lazyRetry(() => import("@/components/landing/SmartAgentShowcase"));
const WhatsAppShowcase = lazyRetry(() => import("@/components/landing/WhatsAppShowcase"));
const TrustedPartnersSection = lazyRetry(() => import("@/components/landing/TrustedPartnersSection"));
const HomepageCustomBlockRenderer = lazyRetry(() => import("@/components/landing/HomepageCustomBlockRenderer"));
const PlatformShowcase = lazyRetry(() => import("@/components/landing/PlatformShowcase"));
const SaaSTechSection = lazyRetry(() => import("@/components/landing/SaaSTechSection"));
const VisitorCounter = lazyRetry(() => import("@/components/landing/VisitorCounter"));
const C2BSubmissionForm = lazyRetry(() => import("@/components/c2b/C2BSubmissionForm"));
const PlatformPostsSection = lazyRetry(() => import("@/components/landing/PlatformPostsSection"));
const FloatingScrollButtons = lazyRetry(() => import("@/components/FloatingScrollButtons"));

// v5.1 — New showcase sections
const DriverEcosystemShowcase = lazyRetry(() => import("@/components/landing/DriverEcosystemShowcase"));
const MarketplacePreview = lazyRetry(() => import("@/components/landing/MarketplacePreview"));
const WalletFinanceShowcase = lazyRetry(() => import("@/components/landing/WalletFinanceShowcase"));
const RatingTrustSection = lazyRetry(() => import("@/components/landing/RatingTrustSection"));
const RegulatorShowcase = lazyRetry(() => import("@/components/landing/RegulatorShowcase"));

/** Renders children when the container scrolls into view — with proper placeholder height */
const LazySection = memo(({ children, minH = 200 }: { children: React.ReactNode; minH?: number }) => {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    // Use requestIdleCallback to observe after paint
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setVisible(true); observer.disconnect(); } },
      { rootMargin: '300px' }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={ref} style={{ minHeight: visible ? undefined : `${minH}px` }}>
      {visible ? (
        <Suspense fallback={<div style={{ minHeight: `${minH}px` }} />}>
          {children}
        </Suspense>
      ) : null}
    </div>
  );
});
LazySection.displayName = 'LazySection';

/** Deferred ticker */
const DeferredTicker = memo(() => {
  const [show, setShow] = useState(false);
  useEffect(() => {
    const id = setTimeout(() => setShow(true), 300);
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

// Section component map
const SECTION_COMPONENTS: Record<string, React.ReactNode> = {
  ads: <HomepageAds />,
  partners: <TrustedPartnersSection />,
  stats: <Stats />,
  verify: <DocumentVerification />,
  consultants: <FeaturedConsultants />,
  initiative: <NationalInitiativeSection />,
  features: <Features />,
  'features-list': <FeaturesList />,
  'doc-ai': <DocumentAIShowcase />,
  'smart-agent': <SmartAgentShowcase />,
  services: <Services />,
  omaluna: <OmalunaSection />,
  'whatsapp-notifications': <WhatsAppShowcase />,
  testimonials: <TestimonialsSection />,
  cta: <CTA />,
};

const Index = () => {
  useVisitorTracking();
  // Fetch homepage section config from DB
  const { data: sections } = useQuery({
    queryKey: ['homepage-sections'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('homepage_sections')
        .select('id, is_visible, sort_order')
        .order('sort_order');
      if (error) return null;
      return data;
    },
    staleTime: 1000 * 60 * 10, // Cache 10 min
  });

  // Fetch custom blocks
  const { data: customBlocks } = useQuery({
    queryKey: ['homepage-custom-blocks-public'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('homepage_custom_blocks')
        .select('*')
        .eq('is_visible', true)
        .order('sort_order');
      if (error) return [];
      // Filter by date range
      const now = new Date().toISOString();
      return (data || []).filter(b =>
        (!b.starts_at || b.starts_at <= now) &&
        (!b.ends_at || b.ends_at >= now)
      );
    },
    staleTime: 1000 * 60 * 5,
  });

  const isVisible = (sectionId: string) => {
    if (!sections) return true; // Default visible if DB not loaded yet
    const section = sections.find(s => s.id === sectionId);
    return section ? section.is_visible : true;
  };

  // Sort content sections by DB order
  const sortedSectionIds = sections
    ? sections
        .filter(s => s.is_visible && SECTION_COMPONENTS[s.id])
        .sort((a, b) => a.sort_order - b.sort_order)
        .map(s => s.id)
    : Object.keys(SECTION_COMPONENTS); // Fallback to default order

  // Custom blocks by position
  const blocksAtPosition = (pos: string) =>
    (customBlocks || []).filter(b => b.position === pos);

  const blocksAfterSection = (sectionId: string) =>
    (customBlocks || []).filter(b => b.position === 'custom' && b.custom_position_after === sectionId);

  return (
    <Suspense fallback={null}>
      <LandingWrapper>
        <div className="min-h-screen-safe bg-background smooth-scroll selection:bg-primary/15 selection:text-foreground">
          {isVisible('header') && (
            <ErrorBoundary fallbackTitle="خطأ في تحميل الرأس">
              <VersionBar />
              <Header />
              {isVisible('ticker') && <DeferredTicker />}
            </ErrorBoundary>
          )}
          {isVisible('hero') && (
            <ErrorBoundary fallbackTitle="خطأ في تحميل القسم الرئيسي">
              <Hero />
            </ErrorBoundary>
          )}

          {/* SaaS Tech Section - technical identity */}
          <div id="saas-tech">
            <LazySection minH={500}>
              <SaaSTechSection />
            </LazySection>
          </div>

          {/* Platform Showcase - immediately after tech section */}
          <div id="platform-showcase">
            <LazySection minH={600}>
              <PlatformShowcase />
            </LazySection>
          </div>

          {/* v5.1 — Driver Ecosystem Showcase */}
          <div id="driver-ecosystem">
            <LazySection minH={500}>
              <DriverEcosystemShowcase />
            </LazySection>
          </div>

          {/* v5.1 — Marketplace & Auction */}
          <div id="marketplace">
            <LazySection minH={400}>
              <MarketplacePreview />
            </LazySection>
          </div>

          {/* v5.1 — Wallet & Finance */}
          <div id="wallet-finance">
            <LazySection minH={400}>
              <WalletFinanceShowcase />
            </LazySection>
          </div>

          {/* v5.1 — Rating & Trust */}
          <div id="rating-trust">
            <LazySection minH={400}>
              <RatingTrustSection />
            </LazySection>
          </div>

          {/* v5.1 — Regulator Showcase */}
          <div id="regulator-showcase">
            <LazySection minH={400}>
              <RegulatorShowcase />
            </LazySection>
          </div>

          {/* Custom blocks: top position */}
          {blocksAtPosition('top').map(block => (
            <LazySection key={block.id} minH={150}>
              <HomepageCustomBlockRenderer block={block} />
            </LazySection>
          ))}

          {/* Custom blocks: after_hero position */}
          {blocksAtPosition('after_hero').map(block => (
            <LazySection key={block.id} minH={150}>
              <HomepageCustomBlockRenderer block={block} />
            </LazySection>
          ))}

          <main>
            <ErrorBoundary fallbackTitle="خطأ في تحميل المحتوى">
              {sortedSectionIds.map(sectionId => (
                <div key={sectionId} id={sectionId}>
                  <LazySection minH={300}>{SECTION_COMPONENTS[sectionId]}</LazySection>
                  {blocksAfterSection(sectionId).map(block => (
                    <LazySection key={block.id} minH={150}>
                      <HomepageCustomBlockRenderer block={block} />
                    </LazySection>
                  ))}
                </div>
              ))}
            </ErrorBoundary>
          </main>

          {/* Custom blocks: before_footer position */}
          {blocksAtPosition('before_footer').map(block => (
            <LazySection key={block.id} minH={150}>
              <HomepageCustomBlockRenderer block={block} />
            </LazySection>
          ))}

          {/* Platform Posts Section */}
          <LazySection minH={400}>
            <PlatformPostsSection />
          </LazySection>

          {/* C2B Contact Form */}
          <LazySection minH={400}>
            <C2BSubmissionForm />
          </LazySection>

          {/* Visitor Counter - before footer */}
          <LazySection minH={100}>
            <div className="container px-4 py-6 sm:py-10">
              <div className="rounded-2xl bg-card border border-border/30 shadow-sm px-4 sm:px-6 py-4 sm:py-5">
                <VisitorCounter />
              </div>
            </div>
          </LazySection>

          {isVisible('footer') && <LazySection minH={300}><Footer /></LazySection>}
          <Suspense fallback={null}><FloatingScrollButtons /></Suspense>
        </div>
      </LandingWrapper>
    </Suspense>
  );
};

export default Index;
