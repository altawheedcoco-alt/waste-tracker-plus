import { useEffect } from 'react';
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

export const useVisitorTracking = () => {
  useEffect(() => {
    // Don't track if already tracked this session for this page
    const pageKey = '_vt_' + window.location.pathname;
    if (sessionStorage.getItem(pageKey)) return;
    sessionStorage.setItem(pageKey, '1');

    const ua = navigator.userAgent;

    const trackVisit = async () => {
      try {
        // Check if user is logged in
        const { data: { session } } = await supabase.auth.getSession();

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
            metadata: {
              timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
              connection: (navigator as any).connection?.effectiveType || null,
              cookiesEnabled: navigator.cookieEnabled,
              doNotTrack: navigator.doNotTrack,
            },
          },
        });
      } catch {
        // Silent fail - don't affect UX
      }
    };

    // Delay tracking to not affect page load
    const timer = setTimeout(trackVisit, 2000);
    return () => clearTimeout(timer);
  }, []);
};
