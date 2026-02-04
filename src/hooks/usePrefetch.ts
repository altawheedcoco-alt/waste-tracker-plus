import { useCallback, useRef, useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useLocation } from 'react-router-dom';

interface PrefetchOptions {
  staleTime?: number;
  cacheTime?: number;
}

interface PrefetchableRoute {
  path: string;
  queryKey: string[];
  queryFn: () => Promise<unknown>;
  priority?: 'high' | 'medium' | 'low';
}

// تخزين الصفحات المحملة مسبقًا
const prefetchedRoutes = new Set<string>();
const prefetchedQueries = new Set<string>();

/**
 * Hook للتحميل المسبق للبيانات والصفحات
 */
export function usePrefetch() {
  const queryClient = useQueryClient();
  const location = useLocation();
  const observerRef = useRef<IntersectionObserver | null>(null);
  const prefetchTimeouts = useRef<Map<string, NodeJS.Timeout>>(new Map());

  // تحميل مسبق لـ query
  const prefetchQuery = useCallback(
    async <T>(
      queryKey: string[],
      queryFn: () => Promise<T>,
      options: PrefetchOptions = {}
    ) => {
      const keyString = queryKey.join('-');
      
      // تجنب التحميل المكرر
      if (prefetchedQueries.has(keyString)) return;
      
      try {
        await queryClient.prefetchQuery({
          queryKey,
          queryFn,
          staleTime: options.staleTime ?? 5 * 60 * 1000, // 5 دقائق
          gcTime: options.cacheTime ?? 10 * 60 * 1000, // 10 دقائق
        });
        prefetchedQueries.add(keyString);
      } catch (error) {
        console.warn('Prefetch failed for:', keyString, error);
      }
    },
    [queryClient]
  );

  // تحميل مسبق لصفحة (lazy component)
  const prefetchRoute = useCallback((importFn: () => Promise<unknown>, routePath: string) => {
    if (prefetchedRoutes.has(routePath)) return;

    // تأخير بسيط لتجنب التأثير على الأداء
    const timeout = setTimeout(() => {
      importFn()
        .then(() => {
          prefetchedRoutes.add(routePath);
        })
        .catch((err) => {
          console.warn('Route prefetch failed:', routePath, err);
        });
    }, 100);

    prefetchTimeouts.current.set(routePath, timeout);
  }, []);

  // تحميل مسبق عند hover
  const prefetchOnHover = useCallback(
    (routePath: string, importFn: () => Promise<unknown>, queryConfig?: {
      queryKey: string[];
      queryFn: () => Promise<unknown>;
    }) => {
      return {
        onMouseEnter: () => {
          prefetchRoute(importFn, routePath);
          if (queryConfig) {
            prefetchQuery(queryConfig.queryKey, queryConfig.queryFn);
          }
        },
        onFocus: () => {
          prefetchRoute(importFn, routePath);
          if (queryConfig) {
            prefetchQuery(queryConfig.queryKey, queryConfig.queryFn);
          }
        },
      };
    },
    [prefetchRoute, prefetchQuery]
  );

  // تحميل مسبق عند ظهور العنصر في viewport
  const prefetchOnVisible = useCallback(
    (
      element: HTMLElement | null,
      importFn: () => Promise<unknown>,
      routePath: string
    ) => {
      if (!element || prefetchedRoutes.has(routePath)) return;

      if (!observerRef.current) {
        observerRef.current = new IntersectionObserver(
          (entries) => {
            entries.forEach((entry) => {
              if (entry.isIntersecting) {
                const path = entry.target.getAttribute('data-prefetch-path');
                if (path && !prefetchedRoutes.has(path)) {
                  importFn();
                  prefetchedRoutes.add(path);
                  observerRef.current?.unobserve(entry.target);
                }
              }
            });
          },
          { rootMargin: '100px' }
        );
      }

      element.setAttribute('data-prefetch-path', routePath);
      observerRef.current.observe(element);
    },
    []
  );

  // تنظيف عند الخروج
  useEffect(() => {
    return () => {
      prefetchTimeouts.current.forEach((timeout) => clearTimeout(timeout));
      observerRef.current?.disconnect();
    };
  }, []);

  // إعادة تعيين الـ prefetched عند تغيير المسار
  useEffect(() => {
    // مسح القيم القديمة بعد 10 دقائق
    const cleanup = setTimeout(() => {
      prefetchedQueries.clear();
    }, 10 * 60 * 1000);

    return () => clearTimeout(cleanup);
  }, [location.pathname]);

  return {
    prefetchQuery,
    prefetchRoute,
    prefetchOnHover,
    prefetchOnVisible,
    isPrefetched: (routePath: string) => prefetchedRoutes.has(routePath),
  };
}

/**
 * Hook للتنبؤ بالصفحات التالية وتحميلها مسبقًا
 */
export function usePredictivePrefetch(routes: PrefetchableRoute[]) {
  const { prefetchQuery, prefetchRoute } = usePrefetch();
  const location = useLocation();
  const navigationHistory = useRef<string[]>([]);

  // تتبع سجل التنقل
  useEffect(() => {
    navigationHistory.current.push(location.pathname);
    // الاحتفاظ بآخر 10 صفحات فقط
    if (navigationHistory.current.length > 10) {
      navigationHistory.current.shift();
    }
  }, [location.pathname]);

  // تحميل الصفحات ذات الأولوية العالية
  useEffect(() => {
    const highPriorityRoutes = routes.filter(r => r.priority === 'high');
    
    // تأخير للتأكد من تحميل الصفحة الحالية أولاً
    const timeout = setTimeout(() => {
      highPriorityRoutes.forEach(route => {
        if (route.path !== location.pathname) {
          prefetchQuery(route.queryKey, route.queryFn);
        }
      });
    }, 2000);

    return () => clearTimeout(timeout);
  }, [location.pathname, routes, prefetchQuery]);

  // تحميل عند idle
  useEffect(() => {
    if ('requestIdleCallback' in window) {
      const mediumPriorityRoutes = routes.filter(r => r.priority === 'medium');
      
      const idleCallback = requestIdleCallback(
        () => {
          mediumPriorityRoutes.forEach(route => {
            if (route.path !== location.pathname) {
              prefetchQuery(route.queryKey, route.queryFn);
            }
          });
        },
        { timeout: 5000 }
      );

      return () => cancelIdleCallback(idleCallback);
    }
  }, [location.pathname, routes, prefetchQuery]);

  return {
    navigationHistory: navigationHistory.current,
  };
}

export default usePrefetch;
