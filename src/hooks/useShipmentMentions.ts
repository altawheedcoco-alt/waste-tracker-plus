import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface ShipmentMention {
  id: string;
  shipment_number: string;
  status: string;
  waste_type: string;
  quantity: number;
  unit?: string;
}

export const useShipmentMentions = () => {
  const { organization } = useAuth();
  const [results, setResults] = useState<ShipmentMention[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  const searchShipments = useCallback(async (query: string) => {
    if (!organization?.id || query.length < 1) {
      setResults([]);
      return;
    }
    setIsSearching(true);
    try {
      const { data, error } = await supabase
        .from('shipments')
        .select('id, shipment_number, status, waste_type, quantity, unit')
        .or(`generator_id.eq.${organization.id},recycler_id.eq.${organization.id},transporter_id.eq.${organization.id}`)
        .ilike('shipment_number', `%${query}%`)
        .limit(8);

      if (!error && data) {
        setResults(data as ShipmentMention[]);
      }
    } catch {
      // silent
    } finally {
      setIsSearching(false);
    }
  }, [organization?.id]);

  return { results, searchShipments, isSearching };
};
