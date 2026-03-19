import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface SharedShipment {
  id: string;
  shipment_number: string;
  waste_type: string | null;
  status: string | null;
  pickup_date: string | null;
  quantity: number | null;
  unit: string | null;
  generator_id: string | null;
  transporter_id: string;
  recycler_id: string | null;
}

export function useSharedShipments(partnerOrgId: string | undefined) {
  const { organization } = useAuth();
  const [shipments, setShipments] = useState<SharedShipment[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchSharedShipments = useCallback(async () => {
    if (!organization?.id || !partnerOrgId) return;
    setLoading(true);
    try {
      const myId = organization.id;
      const { data } = await supabase
        .from('shipments')
        .select('id, shipment_number, waste_type, status, pickup_date, quantity, unit, generator_id, transporter_id, recycler_id')
        .or(
          `and(generator_id.eq.${myId},transporter_id.eq.${partnerOrgId}),and(generator_id.eq.${myId},recycler_id.eq.${partnerOrgId}),and(transporter_id.eq.${myId},generator_id.eq.${partnerOrgId}),and(transporter_id.eq.${myId},recycler_id.eq.${partnerOrgId}),and(recycler_id.eq.${myId},generator_id.eq.${partnerOrgId}),and(recycler_id.eq.${myId},transporter_id.eq.${partnerOrgId})`
        )
        .order('pickup_date', { ascending: false })
        .limit(200);

      setShipments((data || []) as unknown as SharedShipment[]);
    } catch (e) {
      console.error('Error fetching shared shipments:', e);
    } finally {
      setLoading(false);
    }
  }, [organization?.id, partnerOrgId]);

  useEffect(() => {
    fetchSharedShipments();
  }, [fetchSharedShipments]);

  return { shipments, loading, refetch: fetchSharedShipments };
}
