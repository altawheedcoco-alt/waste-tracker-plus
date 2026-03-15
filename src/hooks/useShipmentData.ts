import { supabase } from '@/integrations/supabase/client';

export interface ShipmentOrganization {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  representative_name?: string;
  commercial_register?: string;
  environmental_license?: string;
  stamp_url?: string;
  signature_url?: string;
  logo_url?: string;
}

export interface ShipmentDriver {
  id: string;
  license_number?: string;
  vehicle_type?: string;
  vehicle_plate?: string;
  profile?: {
    full_name?: string;
    phone?: string;
  };
}

export interface EnrichedShipment {
  id: string;
  shipment_number: string;
  status: string;
  waste_type: string;
  waste_description?: string;
  quantity: number;
  unit: string;
  pickup_address?: string;
  delivery_address?: string;
  created_at: string;
  generator_id?: string;
  transporter_id?: string;
  recycler_id?: string;
  driver_id?: string;
  generator?: ShipmentOrganization | null;
  transporter?: ShipmentOrganization | null;
  recycler?: ShipmentOrganization | null;
  driver?: ShipmentDriver | null;
  // Approval fields
  generator_approval_status?: string | null;
  generator_approval_at?: string | null;
  generator_rejection_reason?: string | null;
  generator_auto_approve_deadline?: string | null;
  recycler_approval_status?: string | null;
  recycler_approval_at?: string | null;
  recycler_rejection_reason?: string | null;
  recycler_auto_approve_deadline?: string | null;
  [key: string]: any;
}

/**
 * Fetch shipments with enriched organization and driver data
 * Uses separate queries to avoid FK constraint issues
 */
export async function fetchShipmentsWithRelations(
  filters?: {
    organizationId?: string;
    status?: string | string[];
    limit?: number;
    select?: string;
  }
): Promise<EnrichedShipment[]> {
  const selectCols = filters?.select || 'id,shipment_number,status,waste_type,waste_description,quantity,unit,pickup_address,delivery_address,created_at,generator_id,transporter_id,recycler_id,driver_id,generator_approval_status,generator_approval_at,generator_rejection_reason,generator_auto_approve_deadline,recycler_approval_status,recycler_approval_at,recycler_rejection_reason,recycler_auto_approve_deadline';
  let query = supabase.from('shipments').select(selectCols);

  if (filters?.organizationId) {
    query = query.or(
      `generator_id.eq.${filters.organizationId},transporter_id.eq.${filters.organizationId},recycler_id.eq.${filters.organizationId}`
    );
  }

  if (filters?.status) {
    if (Array.isArray(filters.status)) {
      query = query.in('status', filters.status as any);
    } else {
      query = query.eq('status', filters.status as any);
    }
  }

  query = query.order('created_at', { ascending: false });

  if (filters?.limit) {
    query = query.limit(filters.limit);
  }

  const { data: shipmentsData, error } = await query;

  if (error) throw error;
  if (!shipmentsData?.length) return [];

  // Collect unique IDs
  const orgIds = new Set<string>();
  const driverIds = new Set<string>();

  shipmentsData.forEach((s) => {
    if (s.generator_id) orgIds.add(s.generator_id);
    if (s.transporter_id) orgIds.add(s.transporter_id);
    if (s.recycler_id) orgIds.add(s.recycler_id);
    if (s.driver_id) driverIds.add(s.driver_id);
  });

  // Fetch organizations AND drivers in parallel
  const [orgsMap, driversMap] = await Promise.all([
    (async () => {
      const map = new Map<string, ShipmentOrganization>();
      if (orgIds.size === 0) return map;
      const { data } = await supabase
        .from('organizations')
        .select('id,name,email,phone,address,city,representative_name,commercial_register,environmental_license,stamp_url,signature_url,logo_url')
        .in('id', Array.from(orgIds));
      data?.forEach((org) => map.set(org.id, org));
      return map;
    })(),
    (async () => {
      const map = new Map<string, ShipmentDriver>();
      if (driverIds.size === 0) return map;
      const { data } = await supabase
        .from('drivers')
        .select('id,license_number,vehicle_type,vehicle_plate,profile:profiles(full_name,phone)')
        .in('id', Array.from(driverIds));
      data?.forEach((driver) => {
        map.set(driver.id, {
          ...driver,
          profile: Array.isArray(driver.profile) ? driver.profile[0] : driver.profile,
        });
      });
      return map;
    })(),
  ]);

  // Enrich shipments
  return shipmentsData.map((shipment) => ({
    ...shipment,
    generator: shipment.generator_id ? orgsMap.get(shipment.generator_id) || null : null,
    transporter: shipment.transporter_id ? orgsMap.get(shipment.transporter_id) || null : null,
    recycler: shipment.recycler_id ? orgsMap.get(shipment.recycler_id) || null : null,
    driver: shipment.driver_id ? driversMap.get(shipment.driver_id) || null : null,
  }));
}

/**
 * Fetch a single shipment by ID or number with full relations
 */
export async function fetchShipmentByIdOrNumber(
  idOrNumber: string
): Promise<EnrichedShipment | null> {
  const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(idOrNumber);
  
  let query = supabase.from('shipments').select('*');
  
  if (isUUID) {
    query = query.eq('id', idOrNumber);
  } else {
    query = query.eq('shipment_number', idOrNumber);
  }

  const { data, error } = await query.maybeSingle();

  if (error) throw error;
  if (!data) return null;

  // Fetch related data
  const orgIds = [data.generator_id, data.transporter_id, data.recycler_id].filter(Boolean) as string[];
  
  const orgsMap = new Map<string, ShipmentOrganization>();
  if (orgIds.length > 0) {
    const { data: orgsData } = await supabase
      .from('organizations')
      .select('id, name, email, phone, address, city, representative_name, commercial_register, environmental_license, stamp_url, signature_url, logo_url')
      .in('id', orgIds);

    orgsData?.forEach((org) => orgsMap.set(org.id, org));
  }

  let driver: ShipmentDriver | null = null;
  if (data.driver_id) {
    const { data: driverData } = await supabase
      .from('drivers')
      .select('id, license_number, vehicle_type, vehicle_plate, profile:profiles(full_name, phone)')
      .eq('id', data.driver_id)
      .maybeSingle();

    if (driverData) {
      driver = {
        ...driverData,
        profile: Array.isArray(driverData.profile) ? driverData.profile[0] : driverData.profile,
      };
    }
  }

  return {
    ...data,
    generator: data.generator_id ? orgsMap.get(data.generator_id) || null : null,
    transporter: data.transporter_id ? orgsMap.get(data.transporter_id) || null : null,
    recycler: data.recycler_id ? orgsMap.get(data.recycler_id) || null : null,
    driver,
  };
}
