import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useRealtimeTable } from '@/hooks/useRealtimeSync';

/** Columns needed for shipment list views — avoid fetching unnecessary data */
const SHIPMENT_LIST_COLUMNS = `
  id, shipment_number, waste_type, quantity, unit, status,
  created_at, pickup_address, delivery_address,
  generator_id, recycler_id, transporter_id, driver_id,
  pickup_date, expected_delivery_date, notes,
  approved_at, in_transit_at, delivered_at, confirmed_at,
  hazard_level, disposal_method, manual_driver_name, manual_vehicle_plate
`;

export interface ShipmentListItem {
  id: string;
  shipment_number: string;
  waste_type: string;
  quantity: number;
  unit: string;
  status: string;
  created_at: string;
  pickup_address: string;
  delivery_address: string;
  generator_id: string | null;
  recycler_id: string | null;
  transporter_id: string | null;
  driver_id: string | null;
  pickup_date: string | null;
  expected_delivery_date: string | null;
  notes: string | null;
  approved_at: string | null;
  in_transit_at: string | null;
  delivered_at: string | null;
  confirmed_at: string | null;
  hazard_level: string | null;
  disposal_method: string | null;
  manual_driver_name: string | null;
  manual_vehicle_plate: string | null;
  // Enriched fields
  generator?: { id: string; name: string } | null;
  recycler?: { id: string; name: string } | null;
  transporter?: { id: string; name: string } | null;
  driver?: { id: string; profile?: { full_name: string } | null; vehicle_plate?: string | null } | null;
}

interface UseShipmentListOptions {
  /** Filter by role: which org field to match */
  role: 'generator' | 'transporter' | 'recycler' | 'all';
  /** Enable realtime subscription */
  realtime?: boolean;
}

/**
 * Shared hook for fetching shipment lists with smart caching.
 * Replaces useEffect+useState pattern with react-query.
 */
export function useShipmentList({ role, realtime = true }: UseShipmentListOptions) {
  const { organization } = useAuth();
  const orgId = organization?.id;
  const queryKey = ['shipments-list', role, orgId];

  const { data: shipments = [], isLoading, error, refetch } = useQuery({
    queryKey,
    queryFn: async (): Promise<ShipmentListItem[]> => {
      if (!orgId && role !== 'all') return [];

      let query = supabase
        .from('shipments')
        .select(SHIPMENT_LIST_COLUMNS)
        .order('created_at', { ascending: false });

      // Filter by role
      if (role !== 'all' && orgId) {
        if (role === 'transporter') {
          query = query.eq('transporter_id', orgId);
        } else if (role === 'generator') {
          query = query.or(`organization_id.eq.${orgId},generator_id.eq.${orgId}`);
        } else if (role === 'recycler') {
          query = query.eq('recycler_id', orgId);
        }
      }

      const { data, error } = await query;
      if (error) throw error;

      // Collect unique org/driver IDs for batch enrichment
      const orgIds = new Set<string>();
      const driverIds = new Set<string>();
      
      for (const s of (data || [])) {
        if (s.generator_id) orgIds.add(s.generator_id);
        if (s.recycler_id) orgIds.add(s.recycler_id);
        if (s.transporter_id) orgIds.add(s.transporter_id);
        if (s.driver_id) driverIds.add(s.driver_id);
      }

      // Batch fetch orgs and drivers
      const [orgsResult, driversResult] = await Promise.all([
        orgIds.size > 0
          ? supabase.from('organizations').select('id, name').in('id', [...orgIds])
          : { data: [] },
        driverIds.size > 0
          ? supabase.from('drivers').select('id, vehicle_plate, profile:profiles(full_name)').in('id', [...driverIds])
          : { data: [] },
      ]);

      const orgsMap = new Map((orgsResult.data || []).map(o => [o.id, o]));
      const driversMap = new Map((driversResult.data || []).map(d => [d.id, {
        ...d,
        profile: Array.isArray(d.profile) ? d.profile[0] : d.profile,
      }]));

      return (data || []).map(s => ({
        ...s,
        generator: s.generator_id ? orgsMap.get(s.generator_id) || null : null,
        recycler: s.recycler_id ? orgsMap.get(s.recycler_id) || null : null,
        transporter: s.transporter_id ? orgsMap.get(s.transporter_id) || null : null,
        driver: s.driver_id ? driversMap.get(s.driver_id) || null : null,
      })) as ShipmentListItem[];
    },
    enabled: role === 'all' || !!orgId,
    staleTime: 1000 * 60 * 2, // 2 minutes
    refetchOnWindowFocus: true,
  });

  // Realtime sync
  useRealtimeTable('shipments', queryKey, {
    enabled: realtime && (role === 'all' || !!orgId),
  });

  return { shipments, isLoading, error, refetch };
}
