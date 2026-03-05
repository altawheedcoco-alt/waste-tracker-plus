/**
 * useCSPHeaders — Content Security Policy via meta tag
 * 
 * يضيف حماية ضد هجمات XSS وحقن السكريبتات
 */
import { useEffect } from 'react';

export function useCSPHeaders() {
  useEffect(() => {
    // Check if CSP meta tag already exists
    const existing = document.querySelector('meta[http-equiv="Content-Security-Policy"]');
    if (existing) return;

    const meta = document.createElement('meta');
    meta.httpEquiv = 'Content-Security-Policy';
    meta.content = [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://*.supabase.co",
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "font-src 'self' https://fonts.gstatic.com",
      "img-src 'self' data: blob: https://*.supabase.co https://*.unsplash.com https://*.googleapis.com",
      "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://*.lovable.app",
      "frame-src 'self'",
      "object-src 'none'",
      "base-uri 'self'",
      "form-action 'self'",
    ].join('; ');

    document.head.appendChild(meta);

    return () => {
      meta.remove();
    };
  }, []);
}
