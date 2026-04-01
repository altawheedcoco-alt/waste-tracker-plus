import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface TransporterFinancials {
  totalRevenue: number;
  pendingPayments: number;
  totalDeposits: number;
  currency: string;
}

export interface TransporterKPIs {
  onTimeRate: number;
  completionRate: number;
  avgDeliveryDays: number;
  overdueShipments: number;
}

export interface DriverSummary {
  id: string;
  name: string;
  vehiclePlate: string | null;
  isAvailable: boolean;
  lastLat: number | null;
  lastLng: number | null;
  lastUpdated: string | null;
  activeShipments: number;
}

async function fetchFinancials(organizationId: string): Promise<TransporterFinancials> {
  const { data: ledger, error: ledgerError } = await supabase
    .from('accounting_ledger')
    .select('amount, entry_type, entry_category')
    .eq('organization_id', organizationId);

  if (ledgerError) throw ledgerError;
  const entries = ledger || [];

  const totalRevenue = entries
    .filter(e => e.entry_type === 'credit' || e.entry_category === 'shipment_income')
    .reduce((sum, e) => sum + Math.abs(e.amount), 0);

  const { data: deposits } = await supabase
    .from('deposits')
    .select('amount')
    .eq('organization_id', organizationId);

  const totalDeposits = (deposits || []).reduce((sum, d) => sum + (d.amount || 0), 0);

  // Pending = debit entries not verified
  const pendingPayments = entries
    .filter(e => e.entry_type === 'debit')
    .reduce((sum, e) => sum + Math.abs(e.amount), 0);

  return {
    totalRevenue,
    pendingPayments,
    totalDeposits,
    currency: 'ج.م',
  };
}

async function fetchKPIs(organizationId: string): Promise<TransporterKPIs> {
  const { data: shipments, error: shipError } = await supabase
    .from('shipments')
    .select('status, created_at, delivered_at, expected_delivery_date')
    .eq('transporter_id', organizationId);

  if (shipError) throw shipError;
  const all = shipments || [];
  const total = all.length;
  if (total === 0) return { onTimeRate: 0, completionRate: 0, avgDeliveryDays: 0, overdueShipments: 0 };

  const completed = all.filter(s => s.status === 'confirmed' || s.status === 'delivered');
  const completionRate = total > 0 ? Math.round((completed.length / total) * 100) : 0;

  // On-time calculation
  let onTimeCount = 0;
  let deliveredWithDate = 0;
  completed.forEach(s => {
    if (s.delivered_at && s.expected_delivery_date) {
      deliveredWithDate++;
      if (new Date(s.delivered_at) <= new Date(s.expected_delivery_date)) {
        onTimeCount++;
      }
    }
  });
  const onTimeRate = deliveredWithDate > 0 ? Math.round((onTimeCount / deliveredWithDate) * 100) : 100;

  // Avg delivery days
  let totalDays = 0;
  let countWithDates = 0;
  completed.forEach(s => {
    if (s.delivered_at && s.created_at) {
      const days = (new Date(s.delivered_at).getTime() - new Date(s.created_at).getTime()) / (1000 * 60 * 60 * 24);
      totalDays += days;
      countWithDates++;
    }
  });
  const avgDeliveryDays = countWithDates > 0 ? Math.round((totalDays / countWithDates) * 10) / 10 : 0;

  // Overdue
  const now = new Date();
  const completedStatuses = ['confirmed', 'delivered', 'cancelled'];
  const overdueShipments = all.filter(s => {
    if (completedStatuses.includes(s.status)) return false;
    if (s.expected_delivery_date && new Date(s.expected_delivery_date) < now) return true;
    return false;
  }).length;

  return { onTimeRate, completionRate, avgDeliveryDays, overdueShipments };
}

async function fetchDriversSummary(organizationId: string): Promise<DriverSummary[]> {
  const { data: drivers } = await supabase
    .from('drivers')
    .select('id, is_available, vehicle_plate, profile:profiles(full_name, phone)')
    .eq('organization_id', organizationId);

  if (!drivers?.length) return [];

  const driverIds = drivers.map(d => d.id);

  const [locationsResult, shipmentsResult] = await Promise.all([
    supabase
      .from('driver_location_logs')
      .select('driver_id, latitude, longitude, recorded_at')
      .in('driver_id', driverIds)
      .order('recorded_at', { ascending: false }),
    supabase
      .from('shipments')
      .select('driver_id, status')
      .in('driver_id', driverIds)
      .in('status', ['approved', 'in_transit'] as any),
  ]);

  // Build latest location per driver
  const locationMap: Record<string, any> = {};
  (locationsResult.data || []).forEach(loc => {
    if (!locationMap[loc.driver_id]) {
      locationMap[loc.driver_id] = loc;
    }
  });

  // Count active shipments per driver
  const activeCountMap: Record<string, number> = {};
  (shipmentsResult.data || []).forEach((s: any) => {
    if (s.driver_id) {
      activeCountMap[s.driver_id] = (activeCountMap[s.driver_id] || 0) + 1;
    }
  });

  return drivers.map(d => {
    const profile = Array.isArray(d.profile) ? d.profile[0] : d.profile;
    const loc = locationMap[d.id];
    return {
      id: d.id,
      name: profile?.full_name || 'بدون اسم',
      vehiclePlate: d.vehicle_plate,
      isAvailable: d.is_available,
      lastLat: loc?.latitude || null,
      lastLng: loc?.longitude || null,
      lastUpdated: loc?.recorded_at || null,
      activeShipments: activeCountMap[d.id] || 0,
    };
  });
}

export const useTransporterFinancials = () => {
  const { organization } = useAuth();
  const orgId = organization?.id;

  return useQuery({
    queryKey: ['transporter-financials', orgId],
    queryFn: () => fetchFinancials(orgId!),
    enabled: !!orgId,
    staleTime: 60_000,
  });
};

export const useTransporterKPIs = () => {
  const { organization } = useAuth();
  const orgId = organization?.id;

  return useQuery({
    queryKey: ['transporter-kpis', orgId],
    queryFn: () => fetchKPIs(orgId!),
    enabled: !!orgId,
    staleTime: 60_000,
  });
};

export const useDriversSummary = () => {
  const { organization } = useAuth();
  const orgId = organization?.id;

  return useQuery({
    queryKey: ['transporter-drivers-summary', orgId],
    queryFn: () => fetchDriversSummary(orgId!),
    enabled: !!orgId,
    staleTime: 30_000,
    refetchInterval: 60_000,
  });
};
