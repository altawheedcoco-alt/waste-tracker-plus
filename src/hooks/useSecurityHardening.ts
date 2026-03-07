/**
 * useSecurityHardening — Combined security hooks
 * 
 * يجمع كل طبقات الحماية في هوك واحد
 */
import { useSessionTimeout } from './useSessionTimeout';
import { useCSPHeaders } from './useCSPHeaders';
import { useSecurityMonitor } from './useSecurityMonitor';
import { useEffect } from 'react';

export function useSecurityHardening() {
  // Session timeout — auto-logout after 30 min idle
  useSessionTimeout();

  // CSP headers — block XSS
  useCSPHeaders();

  // Real-time security monitoring
  useSecurityMonitor();

  // Additional browser-level protections
  useEffect(() => {
    // Disable right-click on sensitive elements (optional)
    // Prevent clickjacking via X-Frame-Options equivalent
    const existingFrameGuard = document.querySelector('meta[http-equiv="X-Frame-Options"]');
    if (!existingFrameGuard) {
      const meta = document.createElement('meta');
      meta.httpEquiv = 'X-Frame-Options';
      meta.content = 'SAMEORIGIN';
      document.head.appendChild(meta);
    }

    // Prevent MIME sniffing
    const existingNoSniff = document.querySelector('meta[http-equiv="X-Content-Type-Options"]');
    if (!existingNoSniff) {
      const meta = document.createElement('meta');
      meta.httpEquiv = 'X-Content-Type-Options';
      meta.content = 'nosniff';
      document.head.appendChild(meta);
    }

    // Referrer policy
    const existingReferrer = document.querySelector('meta[name="referrer"]');
    if (!existingReferrer) {
      const meta = document.createElement('meta');
      meta.name = 'referrer';
      meta.content = 'strict-origin-when-cross-origin';
      document.head.appendChild(meta);
    }
  }, []);
}
