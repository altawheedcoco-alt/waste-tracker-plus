/**
 * Hook مشترك لبيانات القرب الجغرافي — Haversine + تصفية + Realtime
 */
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { calculateHaversineDistance } from '@/lib/mapUtils';
import { useEffect } from 'react';

export interface NearbyDriver {
  id: string;
  driverId: string;
  name: string;
  phone: string | null;
  vehiclePlate: string | null;
  vehicleType: string | null;
  rating: number;
  totalTrips: number;
  lat: number;
  lng: number;
  distanceKm: number;
  status: 'available' | 'arriving_soon';
  /** for arriving_soon — ETA minutes */
  etaMinutes?: number;
}

export interface NearbyShipment {
  id: string;
  shipmentNumber: string;
  wasteType: string | null;
  quantity: number;
  unit: string | null;
  pickupAddress: string | null;
  deliveryAddress: string | null;
  pickupLat: number;
  pickupLng: number;
  distanceKm: number;
  pricePerUnit: number | null;
}

interface ProximityCenter {
  lat: number;
  lng: number;
}

/**
 * بيانات السائقين القريبين — للناقل
 */
export function useNearbyDrivers(center: ProximityCenter | null, radiusKm = 50) {
  const qc = useQueryClient();

  const query = useQuery({
    queryKey: ['nearby-drivers', center?.lat, center?.lng, radiusKm],
    enabled: !!center,
    refetchInterval: 15_000,
    queryFn: async (): Promise<NearbyDriver[]> => {
      if (!center) return [];

      // 1) Available independent drivers with latest location
      const { data: drivers } = await supabase
        .from('drivers')
        .select(`
          id, vehicle_plate, vehicle_type, rating, total_trips,
          profile:profile_id(full_name, phone)
        `)
        .eq('driver_type', 'independent')
        .eq('is_available', true);

      if (!drivers?.length) return [];

      // Get latest locations for all these drivers
      const driverIds = drivers.map(d => d.id);
      const { data: locations } = await supabase
        .from('driver_location_logs')
        .select('driver_id, latitude, longitude, recorded_at')
        .in('driver_id', driverIds)
        .order('recorded_at', { ascending: false });

      // Deduplicate — only latest per driver
      const latestLocMap = new Map<string, { lat: number; lng: number }>();
      locations?.forEach(loc => {
        if (!latestLocMap.has(loc.driver_id)) {
          latestLocMap.set(loc.driver_id, { lat: loc.latitude, lng: loc.longitude });
        }
      });

      const available: NearbyDriver[] = [];
      drivers.forEach(d => {
        const loc = latestLocMap.get(d.id);
        if (!loc) return;
        const dist = calculateHaversineDistance(center.lat, center.lng, loc.lat, loc.lng);
        if (dist <= radiusKm) {
          const profile = d.profile as any;
          available.push({
            id: `avail-${d.id}`,
            driverId: d.id,
            name: profile?.full_name || 'سائق',
            phone: profile?.phone || null,
            vehiclePlate: d.vehicle_plate,
            vehicleType: d.vehicle_type,
            rating: d.rating || 0,
            totalTrips: d.total_trips || 0,
            lat: loc.lat,
            lng: loc.lng,
            distanceKm: Math.round(dist * 10) / 10,
            status: 'available',
          });
        }
      });

      // 2) Arriving soon — in_transit shipments with delivery near center
      const { data: inTransit } = await supabase
        .from('shipments')
        .select('id, driver_id, delivery_latitude, delivery_longitude, in_transit_at')
        .eq('status', 'in_transit')
        .not('driver_id', 'is', null)
        .not('delivery_latitude', 'is', null);

      if (inTransit?.length) {
        const arrivingDriverIds = inTransit
          .filter(s => {
            if (!s.delivery_latitude || !s.delivery_longitude) return false;
            const dist = calculateHaversineDistance(center.lat, center.lng, Number(s.delivery_latitude), Number(s.delivery_longitude));
            return dist <= radiusKm;
          })
          .map(s => s.driver_id!)
          .filter(id => !latestLocMap.has(id) || !available.some(a => a.driverId === id));

        if (arrivingDriverIds.length) {
          const { data: arrivingDrivers } = await supabase
            .from('drivers')
            .select('id, vehicle_plate, vehicle_type, rating, total_trips, profile:profile_id(full_name, phone)')
            .in('id', arrivingDriverIds);

          // Get their locations too
          const { data: arrivingLocs } = await supabase
            .from('driver_location_logs')
            .select('driver_id, latitude, longitude')
            .in('driver_id', arrivingDriverIds)
            .order('recorded_at', { ascending: false });

          const arrivingLocMap = new Map<string, { lat: number; lng: number }>();
          arrivingLocs?.forEach(l => {
            if (!arrivingLocMap.has(l.driver_id)) {
              arrivingLocMap.set(l.driver_id, { lat: l.latitude, lng: l.longitude });
            }
          });

          arrivingDrivers?.forEach(d => {
            const loc = arrivingLocMap.get(d.id);
            if (!loc) return;
            const dist = calculateHaversineDistance(center.lat, center.lng, loc.lat, loc.lng);
            const profile = d.profile as any;
            available.push({
              id: `arriving-${d.id}`,
              driverId: d.id,
              name: profile?.full_name || 'سائق',
              phone: profile?.phone || null,
              vehiclePlate: d.vehicle_plate,
              vehicleType: d.vehicle_type,
              rating: d.rating || 0,
              totalTrips: d.total_trips || 0,
              lat: loc.lat,
              lng: loc.lng,
              distanceKm: Math.round(dist * 10) / 10,
              status: 'arriving_soon',
              etaMinutes: Math.round((dist / 40) * 60), // rough ETA at 40 km/h
            });
          });
        }
      }

      // Sort: available first, then by distance
      return available.sort((a, b) => {
        if (a.status !== b.status) return a.status === 'available' ? -1 : 1;
        return a.distanceKm - b.distanceKm;
      });
    },
  });

  // Realtime on location logs
  useEffect(() => {
    if (!center) return;
    const channel = supabase
      .channel('proximity-driver-locations')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'driver_location_logs' }, () => {
        qc.invalidateQueries({ queryKey: ['nearby-drivers'] });
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [center, qc]);

  return query;
}

/**
 * بيانات الشحنات القريبة — للسائق المستقل
 */
export function useNearbyShipments(center: ProximityCenter | null, radiusKm = 30) {
  return useQuery({
    queryKey: ['nearby-shipments-demand', center?.lat, center?.lng, radiusKm],
    enabled: !!center,
    refetchInterval: 30_000,
    queryFn: async (): Promise<NearbyShipment[]> => {
      if (!center) return [];

      const { data, error } = await supabase
        .from('shipments')
        .select('id, shipment_number, waste_type, quantity, unit, pickup_address, delivery_address, pickup_lat, pickup_lng, price_per_unit')
        .is('driver_id', null)
        .in('status', ['approved', 'new'])
        .not('pickup_lat', 'is', null);

      if (error || !data) return [];

      const nearby: NearbyShipment[] = [];
      data.forEach(s => {
        if (!s.pickup_lat || !s.pickup_lng) return;
        const dist = calculateHaversineDistance(center.lat, center.lng, Number(s.pickup_lat), Number(s.pickup_lng));
        if (dist <= radiusKm) {
          nearby.push({
            id: s.id,
            shipmentNumber: s.shipment_number,
            wasteType: s.waste_type,
            quantity: s.quantity,
            unit: s.unit,
            pickupAddress: s.pickup_address,
            deliveryAddress: s.delivery_address,
            pickupLat: Number(s.pickup_lat),
            pickupLng: Number(s.pickup_lng),
            distanceKm: Math.round(dist * 10) / 10,
            pricePerUnit: s.price_per_unit,
          });
        }
      });

      return nearby.sort((a, b) => a.distanceKm - b.distanceKm);
    },
  });
}
