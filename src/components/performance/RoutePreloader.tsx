import { memo, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';

interface RouteConfig {
  path: string;
  component: () => Promise<unknown>;
  relatedPaths?: string[];
}

interface RoutePreloaderProps {
  routes: RouteConfig[];
  preloadDelay?: number;
  preloadOnIdle?: boolean;
  maxConcurrent?: number;
}

// تتبع المسارات المحملة
const loadedRoutes = new Set<string>();

/**
 * مكون لتحميل الصفحات المسبق بناءً على المسار الحالي
 */
const RoutePreloader = memo(({
  routes,
  preloadDelay = 1000,
  preloadOnIdle = true,
  maxConcurrent = 2,
}: RoutePreloaderProps) => {
  const location = useLocation();
  const preloadQueueRef = useRef<(() => Promise<unknown>)[]>([]);
  const isPreloadingRef = useRef(false);

  // تحميل المسارات من الطابور
  const processQueue = async () => {
    if (isPreloadingRef.current || preloadQueueRef.current.length === 0) return;

    isPreloadingRef.current = true;

    const batch = preloadQueueRef.current.splice(0, maxConcurrent);
    
    try {
      await Promise.all(batch.map(fn => fn().catch(() => {})));
    } catch {
      // تجاهل الأخطاء
    }

    isPreloadingRef.current = false;

    // متابعة المعالجة إذا كان هناك المزيد
    if (preloadQueueRef.current.length > 0) {
      setTimeout(processQueue, 500);
    }
  };

  // تحديد المسارات للتحميل المسبق
  useEffect(() => {
    const currentRoute = routes.find(r => r.path === location.pathname);
    
    if (!currentRoute) return;

    // إضافة المسار الحالي للمحملة
    loadedRoutes.add(location.pathname);

    // تحديد المسارات المرتبطة
    const relatedPaths = currentRoute.relatedPaths || [];
    const pathsToPreload = relatedPaths.filter(path => !loadedRoutes.has(path));

    if (pathsToPreload.length === 0) return;

    // جدولة التحميل
    const timeoutId = setTimeout(() => {
      pathsToPreload.forEach(path => {
        const route = routes.find(r => r.path === path);
        if (route) {
          preloadQueueRef.current.push(async () => {
            await route.component();
            loadedRoutes.add(path);
          });
        }
      });

      if (preloadOnIdle && 'requestIdleCallback' in window) {
        requestIdleCallback(() => processQueue(), { timeout: 5000 });
      } else {
        processQueue();
      }
    }, preloadDelay);

    return () => clearTimeout(timeoutId);
  }, [location.pathname, routes, preloadDelay, preloadOnIdle]);

  // لا يعرض شيء - مكون وظيفي فقط
  return null;
});

RoutePreloader.displayName = 'RoutePreloader';

export default RoutePreloader;
