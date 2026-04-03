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

// Critical above-fold: Header + Hero load together for fast first paint
const Header = lazyRetry(() => import("@/components/Header"));
const Hero = lazyRetry(() => import("@/components/Hero"));
import EnableNotificationsButton from "@/components/EnableNotificationsButton";
import NativePushTestButton from "@/components/pwa/NativePushTestButton";

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
const HealthShowcase = lazyRetry(() => import("@/components/landing/HealthShowcase"));
const RegulatorShowcase = lazyRetry(() => import("@/components/landing/RegulatorShowcase"));
const PlatformChangelog = lazyRetry(() => import("@/components/landing/PlatformChangelog"));
const LivePlatformStats = lazyRetry(() => import("@/components/landing/LivePlatformStats"));

// v5.2 — New landing sections
const HowItWorksSection = lazyRetry(() => import("@/components/landing/HowItWorksSection"));
const SavingsCalculator = lazyRetry(() => import("@/components/landing/SavingsCalculator"));
const BeforeAfterSection = lazyRetry(() => import("@/components/landing/BeforeAfterSection"));
const FAQSection = lazyRetry(() => import("@/components/landing/FAQSection"));
const BlogPreviewSection = lazyRetry(() => import("@/components/landing/BlogPreviewSection"));

/** Renders children when the container scrolls into view — with proper placeholder height */
const LazySection = memo(({ children, minH = 200, priority = false }: { children: React.ReactNode; minH?: number; priority?: boolean }) => {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(priority); // priority sections render immediately

  useEffect(() => {
    if (priority) return;
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setVisible(true); observer.disconnect(); } },
      { rootMargin: '400px' } // Increased from 300px for smoother scroll
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [priority]);

  return (
    <div ref={ref} style={{ minHeight: visible ? undefined : `${minH}px` }}>
      {visible ? (
        <Suspense fallback={<div style={{ minHeight: `${minH}px` }} className="animate-pulse bg-muted/20 rounded-xl" />}>
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

// Fast redirect for authenticated users — check both storages
const AUTH_TOKEN_KEY = 'sb-dgununqfxohodimmgxuk-auth-token';
const hasExistingSession = () => {
  try {
    if (sessionStorage.getItem(AUTH_TOKEN_KEY) || sessionStorage.getItem('__tab_active_org_id')) return true;
    const lsVal = localStorage.getItem(AUTH_TOKEN_KEY);
    return !!(lsVal && lsVal.includes('access_token'));
  } catch { return false; }
};

const Index = () => {
  // Early exit for authenticated users (PWA users opening app)
  if (hasExistingSession()) {
    window.location.replace('/dashboard');
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="w-8 h-8 border-3 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return <HomepageContent />;
};

const HomepageContent = () => {
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

  const showNativePushTest =
    typeof window !== 'undefined' &&
    new URLSearchParams(window.location.search).has('native-push-test');

  return (
    <Suspense fallback={null}>
      <LandingWrapper>
        <div className="min-h-screen-safe bg-background smooth-scroll selection:bg-primary/15 selection:text-foreground">
          <EnableNotificationsButton />
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

          {/* صندوق اختبار الإشعارات الأصلية — مؤقت للتجربة */}
          <div className="max-w-md mx-auto px-4 py-4">
            <NativePushTestButton />
          </div>

          <div id="how-it-works">
            <LazySection minH={350} priority>
              <HowItWorksSection />
            </LazySection>
          </div>

          {/* Live Platform Stats (social proof — priority load) */}
          <div id="live-stats">
            <LazySection minH={300} priority>
              <LivePlatformStats />
            </LazySection>
          </div>

          {/* SaaS Tech Section */}
          <div id="saas-tech">
            <LazySection minH={500}>
              <SaaSTechSection />
            </LazySection>
          </div>

          {/* Platform Showcase */}
          <div id="platform-showcase">
            <LazySection minH={600}>
              <PlatformShowcase />
            </LazySection>
          </div>

          {/* v5.2 — Savings Calculator (conversion driver) */}
          <div id="savings-calculator">
            <LazySection minH={400}>
              <SavingsCalculator />
            </LazySection>
          </div>

          {/* v5.1 — Driver Ecosystem */}
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

          {/* iRecycle Health */}
          <div id="health-showcase">
            <LazySection minH={400}>
              <HealthShowcase />
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

          {/* v5.2 — Before & After */}
          <div id="before-after">
            <LazySection minH={400}>
              <BeforeAfterSection />
            </LazySection>
          </div>
          <div id="changelog">
            <LazySection minH={400}>
              <PlatformChangelog />
            </LazySection>
          </div>

          {/* v5.2 — Blog Preview */}
          <div id="blog-preview">
            <LazySection minH={300}>
              <BlogPreviewSection />
            </LazySection>
          </div>

          {/* Platform Posts Section */}
          <LazySection minH={400}>
            <PlatformPostsSection />
          </LazySection>

          {/* v5.2 — FAQ Section */}
          <div id="faq">
            <LazySection minH={400}>
              <FAQSection />
            </LazySection>
          </div>

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
