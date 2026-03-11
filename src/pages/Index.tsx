import { lazy, Suspense, memo, useRef, useState, useEffect } from "react";
import { useVisitorTracking } from "@/hooks/useVisitorTracking";
import { ErrorBoundary } from "@/components/common/ErrorBoundary";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

// Critical above-fold: load eagerly
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
const WhatsAppShowcase = lazy(() => import("@/components/landing/WhatsAppShowcase"));
const TrustedPartnersSection = lazy(() => import("@/components/landing/TrustedPartnersSection"));
const HomepageCustomBlockRenderer = lazy(() => import("@/components/landing/HomepageCustomBlockRenderer"));
const PlatformShowcase = lazy(() => import("@/components/landing/PlatformShowcase"));
const SaaSTechSection = lazy(() => import("@/components/landing/SaaSTechSection"));
const VisitorCounter = lazy(() => import("@/components/landing/VisitorCounter"));

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
      { rootMargin: '800px' }
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
    const id = setTimeout(() => setShow(true), 800);
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
          <LazySection>
            <SaaSTechSection />
          </LazySection>

          {/* Platform Showcase - immediately after tech section */}
          <LazySection>
            <PlatformShowcase />
          </LazySection>

          {/* Custom blocks: top position */}
          {blocksAtPosition('top').map(block => (
            <LazySection key={block.id}>
              <HomepageCustomBlockRenderer block={block} />
            </LazySection>
          ))}

          {/* Custom blocks: after_hero position */}
          {blocksAtPosition('after_hero').map(block => (
            <LazySection key={block.id}>
              <HomepageCustomBlockRenderer block={block} />
            </LazySection>
          ))}

          <main>
            <ErrorBoundary fallbackTitle="خطأ في تحميل المحتوى">
              {sortedSectionIds.map(sectionId => (
                <div key={sectionId} id={sectionId}>
                  <LazySection>{SECTION_COMPONENTS[sectionId]}</LazySection>
                  {/* Custom blocks after this section */}
                  {blocksAfterSection(sectionId).map(block => (
                    <LazySection key={block.id}>
                      <HomepageCustomBlockRenderer block={block} />
                    </LazySection>
                  ))}
                </div>
              ))}
            </ErrorBoundary>
          </main>

          {/* Custom blocks: before_footer position */}
          {blocksAtPosition('before_footer').map(block => (
            <LazySection key={block.id}>
              <HomepageCustomBlockRenderer block={block} />
            </LazySection>
          ))}

          {/* Visitor Counter - before footer */}
          <LazySection>
            <div className="container px-4 py-8 sm:py-10">
              <div className="rounded-2xl bg-card border border-border/30 shadow-sm px-6 py-5">
                <VisitorCounter />
              </div>
            </div>
          </LazySection>

          {isVisible('footer') && <LazySection><Footer /></LazySection>}
        </div>
      </LandingWrapper>
    </Suspense>
  );
};

export default Index;
