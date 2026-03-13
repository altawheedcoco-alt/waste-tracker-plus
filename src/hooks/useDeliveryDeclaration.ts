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
        .select('generator_id, transporter_id')
        .eq('id', shipmentId)
        .maybeSingle();

      if (!shipment) return declarations;

      const isGenerator = userOrgId === shipment.generator_id;
      const isTransporter = userOrgId === shipment.transporter_id;

      // Filter: if user is generator, hide driver declarations where visible_to_generator = false
      // If user is transporter, always show all (it's their driver)
      return declarations.filter((dec: any) => {
        if (dec.declaration_type === 'driver_confirmation' && isGenerator && dec.visible_to_generator === false) {
          return false;
        }
        return true;
      });
    },
    enabled: !!shipmentId,
    staleTime: 1000 * 60 * 5,
  });
}
