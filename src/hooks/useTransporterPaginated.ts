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

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

interface FetchParams {
  orgId: string;
  page: number;
  pageSize: number;
  status?: string;
  search?: string;
}

const PAGE_SIZE = 20;

async function fetchPaginatedShipments({ orgId, page, pageSize, status, search }: FetchParams): Promise<PaginatedResult<TransporterShipment>> {
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  let query = supabase
    .from('shipments')
    .select('id, shipment_number, waste_type, quantity, unit, status, created_at, pickup_address, delivery_address, pickup_date, expected_delivery_date, notes, generator_notes, recycler_notes, waste_description, hazard_level, packaging_method, disposal_method, approved_at, collection_started_at, in_transit_at, delivered_at, confirmed_at, manual_driver_name, manual_vehicle_plate, generator_id, recycler_id, transporter_id, driver_id', { count: 'exact' })
    .eq('transporter_id', orgId)
    .order('created_at', { ascending: false })
    .range(from, to);

  if (status && status !== 'all') {
    query = query.eq('status', status as any);
  }

  if (search?.trim()) {
    query = query.or(`shipment_number.ilike.%${search}%,waste_type.ilike.%${search}%,pickup_address.ilike.%${search}%,delivery_address.ilike.%${search}%`);
  }

  const { data: shipmentsRaw, error, count } = await query;
  if (error) throw error;
  if (!shipmentsRaw?.length) return { data: [], total: count || 0, page, pageSize, totalPages: Math.ceil((count || 0) / pageSize) };

  // Batch fetch related data
  const orgIds = [...new Set([
    ...shipmentsRaw.map((s: any) => s.generator_id).filter(Boolean),
    ...shipmentsRaw.map((s: any) => s.recycler_id).filter(Boolean),
    ...shipmentsRaw.map((s: any) => s.transporter_id).filter(Boolean),
  ])] as string[];

  const driverIds = [...new Set(shipmentsRaw.map((s: any) => s.driver_id).filter(Boolean))] as string[];
  const shipmentIds = shipmentsRaw.map((s: any) => s.id);

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

  const orgsMap: Record<string, any> = {};
  (orgsResult.data || []).forEach((o: any) => { orgsMap[o.id] = o; });

  const driversMap: Record<string, any> = {};
  (driversResult.data || []).forEach((d: any) => {
    driversMap[d.id] = { ...d, profile: Array.isArray(d.profile) ? d.profile[0] : d.profile };
  });

  const reportedIds = new Set((reportsResult.data || []).map((r: any) => r.shipment_id));
  const receiptIds = new Set((receiptsResult.data || []).map((r: any) => r.shipment_id));

  const total = count || 0;

  const data = shipmentsRaw.map((s: any) => ({
    ...s,
    generator: s.generator_id ? orgsMap[s.generator_id] || null : null,
    recycler: s.recycler_id ? orgsMap[s.recycler_id] || null : null,
    transporter: s.transporter_id ? orgsMap[s.transporter_id] || null : null,
    driver: s.driver_id ? driversMap[s.driver_id] || null : null,
    has_report: reportedIds.has(s.id),
    has_receipt: receiptIds.has(s.id),
  })) as TransporterShipment[];

  return {
    data,
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize),
  };
}

export const useTransporterShipmentsPaginated = (page = 1, status?: string, search?: string) => {
  const { organization } = useAuth();
  const orgId = organization?.id;

  return useQuery({
    queryKey: ['transporter-shipments-paginated', orgId, page, status, search],
    queryFn: () => fetchPaginatedShipments({ orgId: orgId!, page, pageSize: PAGE_SIZE, status, search }),
    enabled: !!orgId,
    staleTime: 30_000,
    refetchInterval: 60_000,
    placeholderData: (prev) => prev, // keepPreviousData equivalent
  });
};

// Use DB function for stats instead of client-side calculation
export const useTransporterStatsDB = () => {
  const { organization } = useAuth();
  const orgId = organization?.id;

  return useQuery({
    queryKey: ['transporter-stats-db', orgId],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_transporter_stats', { p_org_id: orgId! });
      if (error) throw error;

      const stats = data as any;

      // Also fetch driver count
      const { count: driverCount } = await supabase
        .from('drivers')
        .select('id', { count: 'exact', head: true })
        .eq('organization_id', orgId!);

      // Fetch real partner companies count from verified_partnerships
      const { data: partnerships } = await supabase
        .from('verified_partnerships')
        .select('requester_org_id, partner_org_id')
        .or(`requester_org_id.eq.${orgId},partner_org_id.eq.${orgId}`)
        .eq('status', 'active');

      const partnerIds = new Set(
        (partnerships || []).map(p =>
          p.requester_org_id === orgId ? p.partner_org_id : p.requester_org_id
        )
      );

      return {
        total: stats?.total || 0,
        active: stats?.active || 0,
        drivers: driverCount || 0,
        partnerCompanies: partnerIds.size,
      };
    },
    enabled: !!orgId,
    staleTime: 30_000,
  });
};

// Use DB function for KPIs
export const useTransporterKPIsDB = () => {
  const { organization } = useAuth();
  const orgId = organization?.id;

  return useQuery({
    queryKey: ['transporter-kpis-db', orgId],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_transporter_kpis', { p_org_id: orgId! });
      if (error) throw error;
      const kpis = data as any;
      return {
        onTimeRate: kpis?.onTimeRate || 0,
        completionRate: kpis?.completionRate || 0,
        avgDeliveryDays: kpis?.avgDeliveryDays || 0,
        overdueShipments: kpis?.overdueShipments || 0,
      };
    },
    enabled: !!orgId,
    staleTime: 60_000,
  });
};

// Optimistic status change
export const useShipmentStatusOptimistic = () => {
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

      // Optimistic update
      queryClient.setQueriesData({ queryKey: ['transporter-shipments-paginated'] }, (old: any) => {
        if (!old) return old;
        return {
          ...old,
          data: old.data.map((s: any) =>
            s.id === shipmentId ? { ...s, status: newStatus, ...updateData } : s
          ),
        };
      });

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

      // Invalidate stats
      queryClient.invalidateQueries({ queryKey: ['transporter-stats-db'] });
      queryClient.invalidateQueries({ queryKey: ['transporter-kpis-db'] });

      const statusLabels: Record<string, string> = {
        approved: 'معتمدة', in_transit: 'قيد النقل',
        delivered: 'تم التسليم', confirmed: 'مؤكدة',
      };
      toast.success(`تم تحديث الحالة إلى "${statusLabels[newStatus] || newStatus}"`);
    } catch (error) {
      // Revert on error
      queryClient.invalidateQueries({ queryKey: ['transporter-shipments-paginated'] });
      console.error('Error updating shipment status:', error);
      toast.error('حدث خطأ أثناء تحديث الحالة');
    }
  };

  return { changeStatus };
};
