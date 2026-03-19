import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface SharedShipment {
  id: string;
  receipt_number: string;
  waste_type: string | null;
  status: string;
  pickup_date: string;
  declared_weight: number | null;
  unit: string | null;
  generator_signature: string | null;
  transporter_signature_url: string | null;
  driver_signature: string | null;
}

type SignatureFilter = 'all' | 'signed_by_me' | 'signed_by_partner' | 'signed_both';

export function useSharedShipments(partnerOrgId: string | undefined) {
  const { organization } = useAuth();
  const [shipments, setShipments] = useState<SharedShipment[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchSharedShipments = useCallback(async () => {
    if (!organization?.id || !partnerOrgId) return;
    setLoading(true);
    try {
      const myId = organization.id;
      // Fetch shipments where both orgs are involved
      const { data } = await supabase
        .from('shipments')
        .select('id, receipt_number, waste_type, status, pickup_date, declared_weight, unit, generator_signature, transporter_signature_url, driver_signature, generator_id, transporter_id, recycler_id')
        .or(
          `and(generator_id.eq.${myId},transporter_id.eq.${partnerOrgId}),and(generator_id.eq.${myId},recycler_id.eq.${partnerOrgId}),and(transporter_id.eq.${myId},generator_id.eq.${partnerOrgId}),and(transporter_id.eq.${myId},recycler_id.eq.${partnerOrgId}),and(recycler_id.eq.${myId},generator_id.eq.${partnerOrgId}),and(recycler_id.eq.${myId},transporter_id.eq.${partnerOrgId})`
        )
        .order('pickup_date', { ascending: false })
        .limit(200);

      setShipments((data || []) as SharedShipment[]);
    } catch (e) {
      console.error('Error fetching shared shipments:', e);
    } finally {
      setLoading(false);
    }
  }, [organization?.id, partnerOrgId]);

  useEffect(() => {
    fetchSharedShipments();
  }, [fetchSharedShipments]);

  const filterBySignature = useCallback((filter: SignatureFilter): SharedShipment[] => {
    if (filter === 'all') return shipments;
    return shipments.filter(s => {
      const hasMySig = !!s.generator_signature || !!s.transporter_signature_url;
      const hasPartnerSig = !!s.generator_signature || !!s.transporter_signature_url;
      if (filter === 'signed_both') return hasMySig && hasPartnerSig;
      if (filter === 'signed_by_me') return hasMySig;
      if (filter === 'signed_by_partner') return hasPartnerSig;
      return true;
    });
  }, [shipments]);

  return { shipments, loading, filterBySignature, refetch: fetchSharedShipments };
}
