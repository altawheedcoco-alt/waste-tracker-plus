/**
 * Google Analytics 4 — lightweight integration
 * 
 * GA4 Measurement ID is loaded from meta tag or env.
 * Script is injected lazily after first interaction to avoid blocking render.
 */

let initialized = false;

declare global {
  interface Window {
    gtag: (...args: any[]) => void;
    dataLayer: any[];
  }
}

/** Get measurement ID from env or meta */
function getMeasurementId(): string | null {
  // Check Vite env first
  const envId = import.meta.env.VITE_GA4_MEASUREMENT_ID;
  if (envId) return envId;

  // Fallback to meta tag
  const meta = document.querySelector('meta[name="ga-measurement-id"]');
  return meta?.getAttribute('content') || null;
}

/** Initialize GA4 — call once on app load */
export function initGA4() {
  if (initialized) return;

  const measurementId = getMeasurementId();
  if (!measurementId) {
    console.debug('[Analytics] No GA4 measurement ID configured — skipping');
    return;
  }

  // Don't track in development or preview
  if (
    window.location.hostname === 'localhost' ||
    window.location.hostname.includes('id-preview--')
  ) {
    console.debug('[Analytics] Skipping GA4 in dev/preview');
    return;
  }

  initialized = true;

  // Setup dataLayer
  window.dataLayer = window.dataLayer || [];
  window.gtag = function gtag() {
    window.dataLayer.push(arguments);
  };
  window.gtag('js', new Date());
  window.gtag('config', measurementId, {
    send_page_view: false, // We'll send manually for SPA
    cookie_flags: 'SameSite=None;Secure',
  });

  // Lazy-load gtag script
  const script = document.createElement('script');
  script.src = `https://www.googletagmanager.com/gtag/js?id=${measurementId}`;
  script.async = true;
  document.head.appendChild(script);

  console.debug('[Analytics] GA4 initialized:', measurementId);
}

/** Track page view — call on route change */
export function trackPageView(path: string, title?: string) {
  if (!initialized || !window.gtag) return;
  window.gtag('event', 'page_view', {
    page_path: path,
    page_title: title || document.title,
  });
}

/** Track custom event */
export function trackEvent(
  eventName: string,
  params?: Record<string, string | number | boolean>
) {
  if (!initialized || !window.gtag) return;
  window.gtag('event', eventName, params);
}

/** Track user engagement events */
export const analytics = {
  /** User signed up */
  signUp: (method: string) => trackEvent('sign_up', { method }),

  /** User logged in */
  login: (method: string) => trackEvent('login', { method }),

  /** Shipment created */
  shipmentCreated: (wasteType: string) =>
    trackEvent('shipment_created', { waste_type: wasteType }),

  /** Shipment status changed */
  shipmentStatusChanged: (status: string) =>
    trackEvent('shipment_status_change', { status }),

  /** Video watched */
  videoWatched: (season: number, episode: number) =>
    trackEvent('video_watch', { season: `${season}`, episode: `${episode}` }),

  /** Share link created */
  shareLinkCreated: (resourceType: string) =>
    trackEvent('share_link_created', { resource_type: resourceType }),

  /** Search performed */
  searchPerformed: (query: string) =>
    trackEvent('search', { search_term: query.substring(0, 100) }),

  /** Feature used */
  featureUsed: (featureName: string) =>
    trackEvent('feature_used', { feature: featureName }),
};
