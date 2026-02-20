import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

export interface DriverOffer {
  id: string;
  shipment_id: string;
  driver_id: string;
  offered_by: string | null;
  organization_id: string | null;
  system_price: number;
  offered_price: number;
  counter_price: number | null;
  final_price: number | null;
  status: string;
  expires_at: string;
  responded_at: string | null;
  auto_accepted: boolean;
  driver_notes: string | null;
  rejection_reason: string | null;
  created_at: string;
  updated_at: string;
  // joined
  shipment?: {
    shipment_number: string;
    waste_type: string;
    quantity: number;
    unit: string;
    pickup_address: string;
    delivery_address: string;
  };
}

export const useDriverOffers = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [offers, setOffers] = useState<DriverOffer[]>([]);
  const [pendingOffer, setPendingOffer] = useState<DriverOffer | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchOffers = useCallback(async () => {
    if (!user?.id) return;
    try {
      const { data, error } = await supabase
        .from('driver_shipment_offers')
        .select('*, shipments(shipment_number, waste_type, quantity, unit, pickup_address, delivery_address)')
        .eq('driver_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const mapped = (data || []).map((d: any) => ({
        ...d,
        shipment: d.shipments,
      }));

      setOffers(mapped);

      // Find the first pending offer that hasn't expired
      const now = new Date();
      const activePending = mapped.find(
        (o: DriverOffer) => o.status === 'pending' && new Date(o.expires_at) > now
      );
      setPendingOffer(activePending || null);
    } catch (err) {
      console.error('Error fetching driver offers:', err);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  // Real-time subscription
  useEffect(() => {
    if (!user?.id) return;
    fetchOffers();

    const channel = supabase
      .channel('driver-offers-realtime')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'driver_shipment_offers',
          filter: `driver_id=eq.${user.id}`,
        },
        () => {
          fetchOffers();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id, fetchOffers]);

  const acceptOffer = async (offerId: string) => {
    const { error } = await supabase
      .from('driver_shipment_offers')
      .update({
        status: 'accepted',
        final_price: offers.find(o => o.id === offerId)?.offered_price || 0,
        responded_at: new Date().toISOString(),
      })
      .eq('id', offerId);

    if (error) {
      toast({ title: 'خطأ', description: 'فشل قبول العرض', variant: 'destructive' });
      return false;
    }
    toast({ title: '✅ تم القبول', description: 'تم قبول طلب الشحنة بنجاح' });
    setPendingOffer(null);
    fetchOffers();
    return true;
  };

  const rejectOffer = async (offerId: string, reason?: string) => {
    const { error } = await supabase
      .from('driver_shipment_offers')
      .update({
        status: 'rejected',
        rejection_reason: reason || 'رفض السائق',
        responded_at: new Date().toISOString(),
      })
      .eq('id', offerId);

    if (error) {
      toast({ title: 'خطأ', description: 'فشل رفض العرض', variant: 'destructive' });
      return false;
    }
    toast({ title: 'تم الرفض', description: 'تم رفض طلب الشحنة' });
    setPendingOffer(null);
    fetchOffers();
    return true;
  };

  const counterOffer = async (offerId: string, price: number, notes?: string) => {
    const { error } = await supabase
      .from('driver_shipment_offers')
      .update({
        status: 'counter_offered',
        counter_price: price,
        driver_notes: notes || null,
        responded_at: new Date().toISOString(),
      })
      .eq('id', offerId);

    if (error) {
      toast({ title: 'خطأ', description: 'فشل تقديم العرض المقابل', variant: 'destructive' });
      return false;
    }
    toast({ title: '💰 تم الإرسال', description: `تم إرسال عرضك بقيمة ${price} ج.م` });
    setPendingOffer(null);
    fetchOffers();
    return true;
  };

  // Auto-accept expired offers
  useEffect(() => {
    if (!pendingOffer) return;

    const expiresAt = new Date(pendingOffer.expires_at).getTime();
    const now = Date.now();
    const remaining = expiresAt - now;

    if (remaining <= 0) {
      // Already expired, auto-accept
      supabase
        .from('driver_shipment_offers')
        .update({
          status: 'auto_accepted',
          auto_accepted: true,
          final_price: pendingOffer.offered_price,
          responded_at: new Date().toISOString(),
        })
        .eq('id', pendingOffer.id)
        .then(() => {
          setPendingOffer(null);
          fetchOffers();
          toast({ title: '⏰ قبول تلقائي', description: 'تم قبول الطلب تلقائياً لانتهاء المهلة' });
        });
      return;
    }

    const timer = setTimeout(() => {
      supabase
        .from('driver_shipment_offers')
        .update({
          status: 'auto_accepted',
          auto_accepted: true,
          final_price: pendingOffer.offered_price,
          responded_at: new Date().toISOString(),
        })
        .eq('id', pendingOffer.id)
        .then(() => {
          setPendingOffer(null);
          fetchOffers();
          toast({ title: '⏰ قبول تلقائي', description: 'تم قبول الطلب تلقائياً لانتهاء المهلة' });
        });
    }, remaining);

    return () => clearTimeout(timer);
  }, [pendingOffer, fetchOffers, toast]);

  return {
    offers,
    pendingOffer,
    loading,
    acceptOffer,
    rejectOffer,
    counterOffer,
    refetch: fetchOffers,
  };
};
