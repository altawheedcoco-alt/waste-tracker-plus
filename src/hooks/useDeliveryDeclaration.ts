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

/**
 * Fetches all declarations for a shipment, filtering out driver declarations
 * that are not visible to the generator (based on visible_to_generator flag).
 */
export function useShipmentDeclarations(shipmentId: string | undefined, userOrgId?: string) {
  return useQuery({
    queryKey: ['shipment-declarations', shipmentId, userOrgId],
    queryFn: async () => {
      if (!shipmentId) return [];

      // Fetch declarations
      const { data, error } = await (supabase
        .from('delivery_declarations') as any)
        .select('*')
        .eq('shipment_id', shipmentId)
        .order('created_at', { ascending: true });

      if (error) {
        if (error.message?.includes('AbortError') || error.name === 'AbortError') return [];
        console.error('Error fetching shipment declarations:', error);
        return [];
      }

      const declarations = data || [];

      // If no user org, return all
      if (!userOrgId) return declarations;

      // Check if user is from generator org
      const { data: shipment } = await supabase
        .from('shipments')
        .select('generator_id, transporter_id, recycler_id')
        .eq('id', shipmentId)
        .maybeSingle();

      if (!shipment) return declarations;

      const isGenerator = userOrgId === shipment.generator_id;
      const isRecycler = userOrgId === shipment.recycler_id;

      // Filter: if user's org is specified, hide documents where visible_to marks them as hidden
      return declarations.filter((dec: any) => {
        if (!dec.visible_to || typeof dec.visible_to !== 'object') return true;
        
        // Determine the user's role relative to this shipment
        if (isGenerator && dec.visible_to.generator === false) return false;
        if (userOrgId === shipment.recycler_id && dec.visible_to.recycler === false) return false;
        // Transporter always sees everything
        return true;
      });
    },
    enabled: !!shipmentId,
    staleTime: 1000 * 60 * 5,
  });
}
