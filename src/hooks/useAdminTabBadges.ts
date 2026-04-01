/**
 * Hook لجلب شارات العدد للتبويبات الرئيسية في لوحة الأدمن
 */
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export const useAdminTabBadges = () => {
  return useQuery({
    queryKey: ['admin-tab-badges'],
    queryFn: async () => {
      const [pendingOrgs, pendingDrivers, activeShipments] = await Promise.all([
        // كيانات بانتظار الموافقة
        (supabase
          .from('organizations')
          .select('id', { count: 'exact', head: true }) as any)
          .eq('status', 'pending'),
        // سائقون بانتظار الاعتماد
        supabase
          .from('drivers')
          .select('id', { count: 'exact', head: true })
          .eq('is_verified', false),
        // شحنات نشطة
        supabase
          .from('shipments')
          .select('id', { count: 'exact', head: true })
          .in('status', ['approved', 'in_transit', 'collecting']),
      ]);

      return {
        'command-center': activeShipments.count ?? 0,
        'entities': pendingOrgs.count ?? 0,
        'users-fleet': pendingDrivers.count ?? 0,
      } as Record<string, number>;
    },
    refetchInterval: 30_000,
    staleTime: 15_000,
  });
};
