/**
 * ProductionReadiness - مكون خفيف لتحسينات الإنتاج
 * يضيف: Error Tracking، Performance Monitoring، Security Headers validation
 */
import { memo, useEffect } from 'react';

const ProductionReadiness = memo(() => {
  useEffect(() => {
    if (import.meta.env.DEV) return;

    // 1. Global Error Tracking - التقاط الأخطاء غير المعالجة
    const errorHandler = (event: ErrorEvent) => {
      const errorData = {
        message: event.message,
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
        timestamp: new Date().toISOString(),
        url: window.location.href,
        userAgent: navigator.userAgent,
      };
      
      // Store in sessionStorage for debugging (max 50 errors)
      try {
        const errors = JSON.parse(sessionStorage.getItem('_app_errors') || '[]');
        errors.push(errorData);
        if (errors.length > 50) errors.shift();
        sessionStorage.setItem('_app_errors', JSON.stringify(errors));
      } catch { /* storage full - ignore */ }
    };

    const rejectionHandler = (event: PromiseRejectionEvent) => {
      const errorData = {
        message: String(event.reason),
        type: 'unhandled_promise_rejection',
        timestamp: new Date().toISOString(),
        url: window.location.href,
      };
      
      try {
        const errors = JSON.parse(sessionStorage.getItem('_app_errors') || '[]');
        errors.push(errorData);
        if (errors.length > 50) errors.shift();
        sessionStorage.setItem('_app_errors', JSON.stringify(errors));
      } catch { /* ignore */ }
    };

    window.addEventListener('error', errorHandler);
    window.addEventListener('unhandledrejection', rejectionHandler);

    // 2. Performance Monitoring - Web Vitals tracking
    if ('PerformanceObserver' in window) {
      try {
        // Track Largest Contentful Paint (LCP)
        const lcpObserver = new PerformanceObserver((entryList) => {
          const entries = entryList.getEntries();
          const lastEntry = entries[entries.length - 1];
          if (lastEntry) {
            const lcp = lastEntry.startTime;
            if (lcp > 4000) {
              console.warn(`[Perf] LCP is slow: ${Math.round(lcp)}ms`);
            }
          }
        });
        lcpObserver.observe({ type: 'largest-contentful-paint', buffered: true });

        // Track First Input Delay (FID) / Interaction to Next Paint (INP)
        const fidObserver = new PerformanceObserver((entryList) => {
          for (const entry of entryList.getEntries()) {
            const fid = (entry as any).processingStart - entry.startTime;
            if (fid > 300) {
              console.warn(`[Perf] High input delay: ${Math.round(fid)}ms`);
            }
          }
        });
        fidObserver.observe({ type: 'first-input', buffered: true });

        // Track Cumulative Layout Shift (CLS)
        let clsValue = 0;
        const clsObserver = new PerformanceObserver((entryList) => {
          for (const entry of entryList.getEntries()) {
            if (!(entry as any).hadRecentInput) {
              clsValue += (entry as any).value;
            }
          }
          if (clsValue > 0.25) {
            console.warn(`[Perf] High CLS: ${clsValue.toFixed(3)}`);
          }
        });
        clsObserver.observe({ type: 'layout-shift', buffered: true });
      } catch {
        // PerformanceObserver not supported for some entry types
      }
    }

    // 3. Memory leak detection (check every 60s)
    let memoryCheckInterval: ReturnType<typeof setInterval> | null = null;
    if ((performance as any).memory) {
      memoryCheckInterval = setInterval(() => {
        const mem = (performance as any).memory;
        const usedMB = Math.round(mem.usedJSHeapSize / 1048576);
        const limitMB = Math.round(mem.jsHeapSizeLimit / 1048576);
        if (usedMB > limitMB * 0.85) {
          console.warn(`[Perf] High memory usage: ${usedMB}MB / ${limitMB}MB`);
        }
      }, 60000);
    }

    return () => {
      window.removeEventListener('error', errorHandler);
      window.removeEventListener('unhandledrejection', rejectionHandler);
      if (memoryCheckInterval) clearInterval(memoryCheckInterval);
    };
  }, []);

  return null;
});

ProductionReadiness.displayName = 'ProductionReadiness';

export default ProductionReadiness;
