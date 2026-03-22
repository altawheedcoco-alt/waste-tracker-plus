/**
 * Hook لإدارة عروض المهام للسائقين الأحرار (Smart Dispatch)
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { useEffect } from 'react';

export function useDriverMissionOffers(driverId?: string) {
  const { user } = useAuth();
  const qc = useQueryClient();

  // Fetch pending offers for this driver
  const { data: offers = [], isLoading } = useQuery({
    queryKey: ['driver-mission-offers', driverId],
    enabled: !!driverId,
    refetchInterval: 30000, // refresh every 30s
    queryFn: async () => {
      const { data, error } = await supabase
        .from('driver_mission_offers')
        .select(`
          *,
          shipment:shipment_id(pickup_address, delivery_address, waste_type, estimated_weight),
          offered_by_org:offered_by_org_id(name)
        `)
        .eq('driver_id', driverId!)
        .in('status', ['pending'])
        .gt('expires_at', new Date().toISOString())
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    },
  });

  // Realtime subscription for new offers
  useEffect(() => {
    if (!driverId) return;

    const channel = supabase
      .channel(`driver-offers-${driverId}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'driver_mission_offers',
        filter: `driver_id=eq.${driverId}`,
      }, () => {
        qc.invalidateQueries({ queryKey: ['driver-mission-offers', driverId] });
        toast.info('🚛 عرض شحنة جديد!', { description: 'لديك عرض شحنة جديد، تحقق منه الآن' });
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [driverId, qc]);

  // Accept offer
  const acceptOffer = useMutation({
    mutationFn: async (offerId: string) => {
      const { error } = await supabase
        .from('driver_mission_offers')
        .update({ status: 'accepted', response_at: new Date().toISOString() })
        .eq('id', offerId);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('تم قبول العرض بنجاح');
      qc.invalidateQueries({ queryKey: ['driver-mission-offers'] });
    },
    onError: () => toast.error('فشل في قبول العرض'),
  });

  // Reject offer
  const rejectOffer = useMutation({
    mutationFn: async ({ offerId, reason }: { offerId: string; reason?: string }) => {
      const { error } = await supabase
        .from('driver_mission_offers')
        .update({
          status: 'rejected',
          response_at: new Date().toISOString(),
          rejection_reason: reason || null,
        })
        .eq('id', offerId);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.info('تم رفض العرض');
      qc.invalidateQueries({ queryKey: ['driver-mission-offers'] });
    },
    onError: () => toast.error('فشل في رفض العرض'),
  });

  return {
    offers,
    isLoading,
    acceptOffer,
    rejectOffer,
    pendingCount: offers.length,
  };
}
