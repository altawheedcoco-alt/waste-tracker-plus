import { useEffect, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

/**
 * يضمن إعادة اتصال Realtime عند استعادة التطبيق من الخلفية (PWA/Mobile)
 * ويُبطل كافة الكاش لضمان تحديث البيانات فوراً
 */
export const usePWARealtimeSync = () => {
  const queryClient = useQueryClient();
  const lastVisibleAt = useRef(Date.now());

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        const elapsed = Date.now() - lastVisibleAt.current;

        // إذا مر أكثر من 30 ثانية → أعد الاتصال وحدث البيانات
        if (elapsed > 30_000) {
          console.log('[PWA Sync] App resumed after', Math.round(elapsed / 1000), 's — reconnecting...');
          
          // إعادة اتصال Realtime
          supabase.realtime.setAuth(null as any); // force reconnect
          supabase.auth.getSession().then(({ data }) => {
            if (data.session?.access_token) {
              supabase.realtime.setAuth(data.session.access_token);
            }
          });

          // إبطال كافة الكاش لضمان بيانات جديدة
          queryClient.invalidateQueries();
        }

        lastVisibleAt.current = Date.now();
      } else {
        lastVisibleAt.current = Date.now();
      }
    };

    // عند استعادة الاتصال بالشبكة
    const handleOnline = () => {
      console.log('[PWA Sync] Network restored — invalidating cache');
      queryClient.invalidateQueries();
      
      supabase.auth.getSession().then(({ data }) => {
        if (data.session?.access_token) {
          supabase.realtime.setAuth(data.session.access_token);
        }
      });
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('online', handleOnline);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('online', handleOnline);
    };
  }, [queryClient]);
};
