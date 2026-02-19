import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export function useDeliveryDeclaration(shipmentId: string | undefined) {
  return useQuery({
    queryKey: ['delivery-declaration', shipmentId],
    queryFn: async () => {
      if (!shipmentId) return null;
      const { data, error } = await supabase
        .from('delivery_declarations')
        .select('*')
        .eq('shipment_id', shipmentId)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) {
        if (error.message?.includes('AbortError') || error.name === 'AbortError') return null;
        console.error('Error fetching delivery declaration:', error);
        return null;
      }
      return data;
    },
    enabled: !!shipmentId,
    staleTime: 1000 * 60 * 5,
  });
}

export function useShipmentDeclarations(shipmentId: string | undefined) {
  return useQuery({
    queryKey: ['shipment-declarations', shipmentId],
    queryFn: async () => {
      if (!shipmentId) return [];
      const { data, error } = await supabase
        .from('delivery_declarations')
        .select('*')
        .eq('shipment_id', shipmentId)
        .order('created_at', { ascending: true });

      if (error) {
        if (error.message?.includes('AbortError') || error.name === 'AbortError') return [];
        console.error('Error fetching shipment declarations:', error);
        return [];
      }
      return data || [];
    },
    enabled: !!shipmentId,
    staleTime: 1000 * 60 * 5,
  });
}
