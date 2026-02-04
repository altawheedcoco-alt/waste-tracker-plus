import { memo, useEffect, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useLocation } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface PreloadConfig {
  queryKey: string[];
  queryFn: () => Promise<unknown>;
  conditions?: {
    paths?: string[];
    roles?: string[];
    authenticated?: boolean;
  };
  staleTime?: number;
  priority?: 'critical' | 'high' | 'low';
}

interface DataPreloaderProps {
  configs: PreloadConfig[];
  preloadDelay?: number;
}

/**
 * مكون لتحميل البيانات المسبق بناءً على السياق
 */
const DataPreloader = memo(({
  configs,
  preloadDelay = 500,
}: DataPreloaderProps) => {
  const queryClient = useQueryClient();
  const location = useLocation();
  const { user, profile } = useAuth();

  // التحقق من الشروط
  const shouldPreload = useCallback((config: PreloadConfig): boolean => {
    const { conditions } = config;
    
    if (!conditions) return true;

    // التحقق من المسار
    if (conditions.paths && !conditions.paths.includes(location.pathname)) {
      return false;
    }

    // التحقق من المصادقة
    if (conditions.authenticated !== undefined) {
      if (conditions.authenticated && !user) return false;
      if (!conditions.authenticated && user) return false;
    }

    // التحقق من نوع المستخدم
    if (conditions.roles && profile?.user_type) {
      if (!conditions.roles.includes(profile.user_type)) return false;
    }

    return true;
  }, [location.pathname, user, profile?.user_type]);

  // تنفيذ التحميل المسبق
  const executePreload = useCallback(async (config: PreloadConfig) => {
    try {
      await queryClient.prefetchQuery({
        queryKey: config.queryKey,
        queryFn: config.queryFn,
        staleTime: config.staleTime ?? 5 * 60 * 1000,
      });
    } catch (error) {
      console.warn('Data preload failed:', config.queryKey, error);
    }
  }, [queryClient]);

  // تحميل البيانات الحرجة فورًا
  useEffect(() => {
    const criticalConfigs = configs.filter(
      c => c.priority === 'critical' && shouldPreload(c)
    );

    criticalConfigs.forEach(config => {
      executePreload(config);
    });
  }, [configs, shouldPreload, executePreload]);

  // تحميل البيانات ذات الأولوية العالية بعد تأخير
  useEffect(() => {
    const highPriorityConfigs = configs.filter(
      c => c.priority === 'high' && shouldPreload(c)
    );

    const timeoutId = setTimeout(() => {
      highPriorityConfigs.forEach(config => {
        executePreload(config);
      });
    }, preloadDelay);

    return () => clearTimeout(timeoutId);
  }, [configs, shouldPreload, executePreload, preloadDelay]);

  // تحميل البيانات منخفضة الأولوية عند idle
  useEffect(() => {
    const lowPriorityConfigs = configs.filter(
      c => c.priority === 'low' && shouldPreload(c)
    );

    if (lowPriorityConfigs.length === 0) return;

    if ('requestIdleCallback' in window) {
      const idleId = requestIdleCallback(
        () => {
          lowPriorityConfigs.forEach(config => {
            executePreload(config);
          });
        },
        { timeout: 10000 }
      );

      return () => cancelIdleCallback(idleId);
    } else {
      const timeoutId = setTimeout(() => {
        lowPriorityConfigs.forEach(config => {
          executePreload(config);
        });
      }, 3000);

      return () => clearTimeout(timeoutId);
    }
  }, [configs, shouldPreload, executePreload]);

  return null;
});

DataPreloader.displayName = 'DataPreloader';

// تكوينات التحميل المسبق الافتراضية
export const defaultPreloadConfigs: PreloadConfig[] = [
  // الإشعارات
  {
    queryKey: ['notifications', 'unread'],
    queryFn: async () => {
      const { data } = await supabase
        .from('notifications')
        .select('id, title, type, created_at')
        .eq('is_read', false)
        .order('created_at', { ascending: false })
        .limit(10);
      return data;
    },
    conditions: {
      authenticated: true,
    },
    priority: 'critical',
    staleTime: 1 * 60 * 1000,
  },
];

export default DataPreloader;
