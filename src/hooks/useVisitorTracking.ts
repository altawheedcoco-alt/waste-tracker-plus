import { useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';

// Simple fingerprint based on browser characteristics
const generateFingerprint = (): string => {
  const components = [
    navigator.userAgent,
    navigator.language,
    screen.width + 'x' + screen.height,
    screen.colorDepth,
    new Date().getTimezoneOffset(),
    navigator.hardwareConcurrency,
    navigator.maxTouchPoints,
  ];
  let hash = 0;
  const str = components.join('|');
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash |= 0;
  }
  return 'vf_' + Math.abs(hash).toString(36);
};

const getSessionId = (): string => {
  let sid = sessionStorage.getItem('_vsid');
  if (!sid) {
    sid = 'vs_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
    sessionStorage.setItem('_vsid', sid);
  }
  return sid;
};

const getBrowser = (ua: string): string => {
  if (ua.includes('Firefox')) return 'Firefox';
  if (ua.includes('Edg')) return 'Edge';
  if (ua.includes('Chrome')) return 'Chrome';
  if (ua.includes('Safari')) return 'Safari';
  if (ua.includes('Opera') || ua.includes('OPR')) return 'Opera';
  return 'Other';
};

const getOS = (ua: string): string => {
  if (ua.includes('Windows')) return 'Windows';
  if (ua.includes('Mac')) return 'macOS';
  if (ua.includes('Linux')) return 'Linux';
  if (ua.includes('Android')) return 'Android';
  if (ua.includes('iPhone') || ua.includes('iPad')) return 'iOS';
  return 'Other';
};

const getDeviceType = (): string => {
  const w = window.innerWidth;
  if (w < 768) return 'mobile';
  if (w < 1024) return 'tablet';
  return 'desktop';
};

const getUTMParams = () => {
  const params = new URLSearchParams(window.location.search);
  return {
    utm_source: params.get('utm_source') || null,
    utm_medium: params.get('utm_medium') || null,
    utm_campaign: params.get('utm_campaign') || null,
    utm_term: params.get('utm_term') || null,
    utm_content: params.get('utm_content') || null,
  };
};

// Track navigation path in session
const addToNavPath = (url: string) => {
  try {
    const existing = JSON.parse(sessionStorage.getItem('_vnav') || '[]');
    const path = new URL(url).pathname;
    if (existing[existing.length - 1] !== path) {
      existing.push(path);
      sessionStorage.setItem('_vnav', JSON.stringify(existing.slice(-20)));
    }
    return existing;
  } catch {
    return [window.location.pathname];
  }
};

export const useVisitorTracking = () => {
  const startTimeRef = useRef(Date.now());
  const maxScrollRef = useRef(0);
  const sentRef = useRef(false);

  useEffect(() => {
    // Don't track if already tracked this session for this page
    const pageKey = '_vt_' + window.location.pathname;
    if (sessionStorage.getItem(pageKey)) return;
    sessionStorage.setItem(pageKey, '1');

    const ua = navigator.userAgent;
    const pagesVisited = addToNavPath(window.location.href);

    // Scroll depth tracking
    const handleScroll = () => {
      const scrollTop = window.scrollY || document.documentElement.scrollTop;
      const docHeight = document.documentElement.scrollHeight - document.documentElement.clientHeight;
      if (docHeight > 0) {
        const depth = Math.round((scrollTop / docHeight) * 100);
        if (depth > maxScrollRef.current) maxScrollRef.current = depth;
      }
    };
    window.addEventListener('scroll', handleScroll, { passive: true });

    const trackVisit = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        const utmParams = getUTMParams();

        await supabase.functions.invoke('track-visitor', {
          body: {
            visitor_fingerprint: generateFingerprint(),
            user_agent: ua,
            browser: getBrowser(ua),
            os: getOS(ua),
            device_type: getDeviceType(),
            screen_resolution: `${screen.width}x${screen.height}`,
            language: navigator.language,
            referrer: document.referrer || null,
            page_url: window.location.href,
            session_id: getSessionId(),
            user_id: session?.user?.id || null,
            viewport_width: window.innerWidth,
            viewport_height: window.innerHeight,
            pages_visited: pagesVisited.map((p: string) => typeof p === 'string' ? p : String(p)),
            ...utmParams,
            metadata: {
              timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
              connection: (navigator as any).connection?.effectiveType || null,
              cookiesEnabled: navigator.cookieEnabled,
              doNotTrack: navigator.doNotTrack,
            },
          },
        });
      } catch {
        // Silent fail
      }
    };

    // Send session end data (duration + scroll depth)
    const sendSessionEnd = async () => {
      if (sentRef.current) return;
      sentRef.current = true;
      const durationSec = Math.round((Date.now() - startTimeRef.current) / 1000);
      try {
        await supabase.functions.invoke('track-visitor', {
          body: {
            _update_session: true,
            session_id: getSessionId(),
            visitor_fingerprint: generateFingerprint(),
            session_duration_seconds: durationSec,
            max_scroll_depth: maxScrollRef.current,
            exit_page: window.location.pathname,
            pages_visited: JSON.parse(sessionStorage.getItem('_vnav') || '[]'),
            bounce: (JSON.parse(sessionStorage.getItem('_vnav') || '[]')).length <= 1,
          },
        });
      } catch {
        // Silent
      }
    };

    // Track on page unload
    const handleBeforeUnload = () => sendSessionEnd();
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') sendSessionEnd();
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    const timer = setTimeout(trackVisit, 2000);

    return () => {
      clearTimeout(timer);
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('beforeunload', handleBeforeUnload);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);
};
