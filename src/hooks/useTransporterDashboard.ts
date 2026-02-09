import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export interface TransporterShipment {
  id: string;
  shipment_number: string;
  waste_type: string;
  quantity: number;
  unit: string;
  status: string;
  created_at: string;
  pickup_address: string;
  delivery_address: string;
  pickup_date: string | null;
  expected_delivery_date: string | null;
  notes: string | null;
  generator_notes: string | null;
  recycler_notes: string | null;
  waste_description: string | null;
  hazard_level: string | null;
  packaging_method: string | null;
  disposal_method: string | null;
  approved_at: string | null;
  collection_started_at: string | null;
  in_transit_at: string | null;
  delivered_at: string | null;
  confirmed_at: string | null;
  manual_driver_name: string | null;
  manual_vehicle_plate: string | null;
  generator: { name: string; email: string; phone: string; address: string; city: string; representative_name: string | null } | null;
  recycler: { name: string; email: string; phone: string; address: string; city: string; representative_name: string | null } | null;
  transporter: { name: string; email: string; phone: string; address: string; city: string; representative_name: string | null } | null;
  driver: { license_number: string; vehicle_type: string | null; vehicle_plate: string | null; profile: { full_name: string; phone: string | null } } | null;
  has_report: boolean;
  has_receipt: boolean;
}

export interface TransporterStats {
  total: number;
  active: number;
  drivers: number;
  partnerCompanies: number;
}

export interface TransporterNotification {
  id: string;
  shipment_number: string;
  message: string;
  created_at: string;
  type: string;
}

const ACTIVE_STATUSES = ['new', 'approved', 'in_transit'];

async function fetchTransporterShipments(organizationId: string): Promise<TransporterShipment[]> {
  const { data: shipmentsRaw, error } = await supabase
    .from('shipments')
    .select('id, shipment_number, waste_type, quantity, unit, status, created_at, pickup_address, delivery_address, pickup_date, expected_delivery_date, notes, generator_notes, recycler_notes, waste_description, hazard_level, packaging_method, disposal_method, approved_at, collection_started_at, in_transit_at, delivered_at, confirmed_at, manual_driver_name, manual_vehicle_plate, generator_id, recycler_id, transporter_id, driver_id')
    .eq('transporter_id', organizationId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  if (!shipmentsRaw?.length) return [];

  // Collect IDs for batch fetching
  const orgIds = [...new Set([
    ...shipmentsRaw.map(s => s.generator_id).filter(Boolean),
    ...shipmentsRaw.map(s => s.recycler_id).filter(Boolean),
    ...shipmentsRaw.map(s => s.transporter_id).filter(Boolean),
  ])] as string[];

  const driverIds = [...new Set(shipmentsRaw.map(s => s.driver_id).filter(Boolean))] as string[];
  const shipmentIds = shipmentsRaw.map(s => s.id);

  // Parallel batch fetches
  const [orgsResult, driversResult, reportsResult, receiptsResult] = await Promise.all([
    orgIds.length > 0
      ? supabase.from('organizations').select('id, name, email, phone, address, city, representative_name').in('id', orgIds)
      : { data: [] },
    driverIds.length > 0
      ? supabase.from('drivers').select('id, license_number, vehicle_type, vehicle_plate, profile:profiles(full_name, phone)').in('id', driverIds)
      : { data: [] },
    supabase.from('recycling_reports').select('shipment_id').in('shipment_id', shipmentIds),
    supabase.from('shipment_receipts').select('shipment_id').in('shipment_id', shipmentIds),
  ]);

  // Build lookup maps
  const orgsMap: Record<string, any> = {};
  (orgsResult.data || []).forEach(o => { orgsMap[o.id] = o; });

  const driversMap: Record<string, any> = {};
  (driversResult.data || []).forEach(d => {
    driversMap[d.id] = { ...d, profile: Array.isArray(d.profile) ? d.profile[0] : d.profile };
  });

  const reportedIds = new Set((reportsResult.data || []).map(r => r.shipment_id));
  const receiptIds = new Set((receiptsResult.data || []).map(r => r.shipment_id));

  return shipmentsRaw.map(s => ({
    ...s,
    generator: s.generator_id ? orgsMap[s.generator_id] || null : null,
    recycler: s.recycler_id ? orgsMap[s.recycler_id] || null : null,
    transporter: s.transporter_id ? orgsMap[s.transporter_id] || null : null,
    driver: s.driver_id ? driversMap[s.driver_id] || null : null,
    has_report: reportedIds.has(s.id),
    has_receipt: receiptIds.has(s.id),
  })) as TransporterShipment[];
}

async function fetchTransporterStats(organizationId: string, shipments: TransporterShipment[]): Promise<TransporterStats> {
  const { data: driversData } = await supabase
    .from('drivers')
    .select('id')
    .eq('organization_id', organizationId);

  const partnerNames = new Set<string>();
  shipments.forEach(s => {
    if (s.generator?.name) partnerNames.add(s.generator.name);
    if (s.recycler?.name) partnerNames.add(s.recycler.name);
  });

  return {
    total: shipments.length,
    active: shipments.filter(s => ACTIVE_STATUSES.includes(s.status)).length,
    drivers: driversData?.length || 0,
    partnerCompanies: partnerNames.size,
  };
}

async function fetchNotifications(profileId: string): Promise<TransporterNotification[]> {
  const { data } = await supabase
    .from('notifications')
    .select('*')
    .eq('user_id', profileId)
    .order('created_at', { ascending: false })
    .limit(5);

  return (data || []).map(n => ({
    id: n.id,
    shipment_number: n.title,
    message: n.message,
    created_at: n.created_at || '',
    type: n.type || 'info',
  }));
}

export const useTransporterShipments = () => {
  const { organization } = useAuth();
  const orgId = organization?.id;

  return useQuery({
    queryKey: ['transporter-shipments', orgId],
    queryFn: () => fetchTransporterShipments(orgId!),
    enabled: !!orgId,
    staleTime: 30_000,
    refetchInterval: 60_000,
  });
};

export const useTransporterStats = (shipments: TransporterShipment[]) => {
  const { organization } = useAuth();
  const orgId = organization?.id;

  return useQuery({
    queryKey: ['transporter-stats', orgId, shipments.length],
    queryFn: () => fetchTransporterStats(orgId!, shipments),
    enabled: !!orgId && shipments.length >= 0,
    staleTime: 30_000,
  });
};

export const useTransporterNotifications = () => {
  const { profile } = useAuth();
  const profileId = profile?.id;

  return useQuery({
    queryKey: ['transporter-notifications', profileId],
    queryFn: () => fetchNotifications(profileId!),
    enabled: !!profileId,
    staleTime: 30_000,
    refetchInterval: 60_000,
  });
};

export const useShipmentStatusChange = () => {
  const queryClient = useQueryClient();

  const changeStatus = async (shipmentId: string, newStatus: string) => {
    try {
      const updateData: Record<string, any> = { status: newStatus };
      const now = new Date().toISOString();

      const timestampMap: Record<string, string> = {
        approved: 'approved_at',
        in_transit: 'in_transit_at',
        delivered: 'delivered_at',
        confirmed: 'confirmed_at',
      };

      if (timestampMap[newStatus]) {
        updateData[timestampMap[newStatus]] = now;
      }

      const { error } = await supabase
        .from('shipments')
        .update(updateData)
        .eq('id', shipmentId);

      if (error) throw error;

      // Log change
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: profileData } = await supabase
          .from('profiles')
          .select('id')
          .eq('user_id', user.id)
          .maybeSingle();

        if (profileData) {
          await supabase.from('shipment_logs').insert({
            shipment_id: shipmentId,
            status: newStatus as any,
            notes: 'تم التحديث من لوحة التحكم',
            changed_by: profileData.id,
          });
        }
      }

      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: ['transporter-shipments'] });
      queryClient.invalidateQueries({ queryKey: ['transporter-stats'] });

      const statusLabels: Record<string, string> = {
        approved: 'معتمدة',
        in_transit: 'قيد النقل',
        delivered: 'تم التسليم',
        confirmed: 'مؤكدة',
      };

      toast.success(`تم تحديث الحالة إلى "${statusLabels[newStatus] || newStatus}"`);
    } catch (error) {
      console.error('Error updating shipment status:', error);
      toast.error('حدث خطأ أثناء تحديث الحالة');
    }
  };

  return { changeStatus };
};
