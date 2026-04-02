/**
 * Hook مركزي لبيانات لوحة تحكم السائق
 * يستبدل useState+useEffect بـ useQuery للتخزين المؤقت والتحديث الذكي
 */
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import type { DriverType } from '@/types/driver-types';

export interface DriverInfo {
  id: string;
  organization_id: string;
  license_number: string;
  vehicle_type: string | null;
  vehicle_plate: string | null;
  is_available: boolean;
  driver_type: DriverType;
  rating: number;
  total_trips: number;
  acceptance_rate: number;
  is_verified: boolean;
  organization: {
    name: string;
    phone: string;
  } | null;
}

export interface DriverShipment {
  id: string;
  shipment_number: string;
  waste_type: string;
  quantity: number;
  unit: string;
  status: string;
  created_at: string;
  pickup_address: string;
  delivery_address: string;
  driver_id: string | null;
  expected_delivery_date: string | null;
  approved_at: string | null;
  collection_started_at: string | null;
  in_transit_at: string | null;
  delivered_at: string | null;
  confirmed_at: string | null;
  recycler_notes: string | null;
  generator: { name: string } | null;
  recycler: { name: string } | null;
  transporter: { name: string } | null;
}

export function useDriverDashboardData() {
  const { profile } = useAuth();
  const queryClient = useQueryClient();

  const {
    data: driverInfo,
    isLoading: driverLoading,
  } = useQuery({
    queryKey: ['driver-dashboard-info', profile?.id],
    enabled: !!profile?.id,
    staleTime: 1000 * 60 * 5,
    queryFn: async (): Promise<DriverInfo | null> => {
      const { data, error } = await supabase
        .from('drivers')
        .select('id, organization_id, license_number, vehicle_type, vehicle_plate, is_available, driver_type, rating, total_trips, acceptance_rate, is_verified, organization:organizations(name, phone)')
        .eq('profile_id', profile!.id)
        .maybeSingle();
      if (error) throw error;
      return data as unknown as DriverInfo | null;
    },
  });

  const {
    data: shipments = [],
    isLoading: shipmentsLoading,
  } = useQuery({
    queryKey: ['driver-dashboard-shipments', driverInfo?.id],
    enabled: !!driverInfo?.id,
    staleTime: 1000 * 60 * 2,
    queryFn: async (): Promise<DriverShipment[]> => {
      const { data: shipmentsData, error } = await supabase
        .from('shipments')
        .select('id, shipment_number, waste_type, quantity, unit, status, created_at, pickup_address, delivery_address, driver_id, expected_delivery_date, approved_at, collection_started_at, in_transit_at, delivered_at, confirmed_at, recycler_notes, generator_id, recycler_id, transporter_id')
        .eq('driver_id', driverInfo!.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      if (!shipmentsData) return [];

      // Enrich with org names
      const orgIds: string[] = [];
      shipmentsData.forEach((s: any) => {
        if (s.generator_id) orgIds.push(s.generator_id);
        if (s.recycler_id) orgIds.push(s.recycler_id);
        if (s.transporter_id) orgIds.push(s.transporter_id);
      });
      const uniqueOrgIds = [...new Set(orgIds)];
      const orgsMap: Record<string, { name: string }> = {};
      if (uniqueOrgIds.length > 0) {
        const { data: orgsData } = await supabase
          .from('organizations')
          .select('id, name')
          .in('id', uniqueOrgIds);
        orgsData?.forEach(o => { orgsMap[o.id] = { name: o.name }; });
      }
      return shipmentsData.map((s: any) => ({
        ...s,
        generator: s.generator_id ? orgsMap[s.generator_id] || null : null,
        recycler: s.recycler_id ? orgsMap[s.recycler_id] || null : null,
        transporter: s.transporter_id ? orgsMap[s.transporter_id] || null : null,
      })) as DriverShipment[];
    },
  });

  const refreshData = () => {
    queryClient.invalidateQueries({ queryKey: ['driver-dashboard-info'] });
    queryClient.invalidateQueries({ queryKey: ['driver-dashboard-shipments'] });
  };

  const updateDriverAvailability = (isAvailable: boolean) => {
    queryClient.setQueryData(
      ['driver-dashboard-info', profile?.id],
      (old: DriverInfo | null | undefined) =>
        old ? { ...old, is_available: isAvailable } : old
    );
  };

  const loading = driverLoading || shipmentsLoading;
  const activeShipments = shipments.filter(s => ['new', 'approved', 'in_transit'].includes(s.status));
  const completedShipments = shipments.filter(s => ['delivered', 'confirmed'].includes(s.status));

  return {
    driverInfo,
    shipments,
    activeShipments,
    completedShipments,
    loading,
    refreshData,
    updateDriverAvailability,
  };
}
