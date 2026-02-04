import { memo, useEffect, ReactNode } from 'react';
import { useNetworkStatus } from '@/hooks/useNetworkStatus';

interface PerformanceOptimizerProps {
  children: ReactNode;
}

/**
 * مكون لتحسين الأداء تلقائياً
 * يقوم بتعديل سلوك التطبيق بناءً على حالة الشبكة والجهاز
 */
const PerformanceOptimizer = memo(({ children }: PerformanceOptimizerProps) => {
  const { isSlowConnection, isOnline } = useNetworkStatus();

  useEffect(() => {
    // تقليل الحركات على الاتصالات البطيئة
    if (isSlowConnection) {
      document.documentElement.style.setProperty('--animation-duration', '0.1s');
      document.documentElement.classList.add('reduce-motion');
    } else {
      document.documentElement.style.removeProperty('--animation-duration');
      document.documentElement.classList.remove('reduce-motion');
    }

    // تفعيل وضع توفير البيانات
    if (!isOnline || isSlowConnection) {
      document.documentElement.classList.add('data-saver');
    } else {
      document.documentElement.classList.remove('data-saver');
    }

    return () => {
      document.documentElement.style.removeProperty('--animation-duration');
      document.documentElement.classList.remove('reduce-motion', 'data-saver');
    };
  }, [isSlowConnection, isOnline]);

  // Prefetch critical routes on good connection
  useEffect(() => {
    if (isOnline && !isSlowConnection) {
      // Prefetch dashboard components
      const prefetchRoutes = [
        () => import('@/pages/Dashboard'),
        () => import('@/pages/dashboard/ShipmentManagement'),
      ];

      // تأخير قليل للسماح بتحميل الصفحة الحالية أولاً
      const timer = setTimeout(() => {
        prefetchRoutes.forEach(route => {
          route().catch(() => {
            // تجاهل أخطاء التحميل المسبق
          });
        });
      }, 2000);

      return () => clearTimeout(timer);
    }
  }, [isOnline, isSlowConnection]);

  return <>{children}</>;
});

PerformanceOptimizer.displayName = 'PerformanceOptimizer';

export default PerformanceOptimizer;
