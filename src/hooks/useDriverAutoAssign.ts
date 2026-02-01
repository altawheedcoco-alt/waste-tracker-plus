import { useEffect, useCallback, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

interface AvailableDriver {
  id: string;
  profile_id: string;
  full_name: string;
  vehicle_type: string | null;
  vehicle_plate: string | null;
  is_available: boolean;
  last_location?: {
    lat: number;
    lng: number;
    recorded_at: string;
  } | null;
  distance_km?: number;
}

interface ShipmentForAssign {
  id: string;
  transporter_id: string;
  pickup_address: string;
  driver_id: string | null;
}

/**
 * Hook to automatically assign or suggest drivers for shipments
 * based on availability and proximity
 */
export const useDriverAutoAssign = (transporterOrgId: string | null) => {
  const { profile } = useAuth();
  const [availableDrivers, setAvailableDrivers] = useState<AvailableDriver[]>([]);
  const [loading, setLoading] = useState(false);

  // Fetch available drivers with their last known locations
  const fetchAvailableDrivers = useCallback(async () => {
    if (!transporterOrgId) return;

    setLoading(true);
    try {
      // Get all available drivers for the transporter
      const { data: drivers, error: driversError } = await supabase
        .from('drivers')
        .select(`
          id,
          profile_id,
          vehicle_type,
          vehicle_plate,
          is_available,
          profile:profiles!drivers_profile_id_fkey(full_name)
        `)
        .eq('organization_id', transporterOrgId)
        .eq('is_available', true);

      if (driversError) throw driversError;

      if (!drivers || drivers.length === 0) {
        setAvailableDrivers([]);
        return;
      }

      // Get last location for each driver
      const driversWithLocations: AvailableDriver[] = await Promise.all(
        drivers.map(async (driver) => {
          const { data: locationData } = await supabase
            .from('driver_location_logs')
            .select('latitude, longitude, recorded_at')
            .eq('driver_id', driver.id)
            .order('recorded_at', { ascending: false })
            .limit(1)
            .maybeSingle();

          return {
            id: driver.id,
            profile_id: driver.profile_id,
            full_name: (driver.profile as any)?.full_name || 'سائق',
            vehicle_type: driver.vehicle_type,
            vehicle_plate: driver.vehicle_plate,
            is_available: driver.is_available || false,
            last_location: locationData ? {
              lat: Number(locationData.latitude),
              lng: Number(locationData.longitude),
              recorded_at: locationData.recorded_at,
            } : null,
          };
        })
      );

      setAvailableDrivers(driversWithLocations);
    } catch (error) {
      console.error('Error fetching available drivers:', error);
    } finally {
      setLoading(false);
    }
  }, [transporterOrgId]);

  // Calculate distance between two points
  const calculateDistance = (lat1: number, lng1: number, lat2: number, lng2: number): number => {
    const R = 6371; // km
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLng = ((lng2 - lng1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLng / 2) *
        Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  // Get nearest available driver to a pickup location
  const getNearestDriver = useCallback(async (
    pickupLat: number,
    pickupLng: number
  ): Promise<AvailableDriver | null> => {
    const driversWithDistance = availableDrivers
      .filter(d => d.last_location)
      .map(driver => ({
        ...driver,
        distance_km: calculateDistance(
          driver.last_location!.lat,
          driver.last_location!.lng,
          pickupLat,
          pickupLng
        ),
      }))
      .sort((a, b) => (a.distance_km || 999) - (b.distance_km || 999));

    return driversWithDistance.length > 0 ? driversWithDistance[0] : null;
  }, [availableDrivers]);

  // Auto-assign driver to shipment
  const autoAssignDriver = useCallback(async (
    shipment: ShipmentForAssign,
    pickupLocation?: { lat: number; lng: number }
  ): Promise<boolean> => {
    if (!profile?.id || shipment.driver_id) return false;

    try {
      let driverToAssign: AvailableDriver | null = null;

      if (pickupLocation) {
        // Get nearest driver
        driverToAssign = await getNearestDriver(pickupLocation.lat, pickupLocation.lng);
      } else if (availableDrivers.length > 0) {
        // Just pick first available driver
        driverToAssign = availableDrivers[0];
      }

      if (!driverToAssign) {
        toast.warning('لا يوجد سائقين متاحين حالياً');
        return false;
      }

      // Assign driver to shipment
      const { error } = await supabase
        .from('shipments')
        .update({ driver_id: driverToAssign.id })
        .eq('id', shipment.id);

      if (error) throw error;

      toast.success(`تم تعيين السائق ${driverToAssign.full_name} تلقائياً`, {
        description: driverToAssign.distance_km 
          ? `المسافة: ${driverToAssign.distance_km.toFixed(1)} كم`
          : undefined,
      });

      return true;
    } catch (error) {
      console.error('Error auto-assigning driver:', error);
      toast.error('فشل في تعيين السائق تلقائياً');
      return false;
    }
  }, [profile?.id, availableDrivers, getNearestDriver]);

  // Suggest drivers sorted by proximity
  const suggestDrivers = useCallback((
    pickupLat?: number,
    pickupLng?: number
  ): AvailableDriver[] => {
    if (!pickupLat || !pickupLng) return availableDrivers;

    return availableDrivers
      .map(driver => ({
        ...driver,
        distance_km: driver.last_location
          ? calculateDistance(
              driver.last_location.lat,
              driver.last_location.lng,
              pickupLat,
              pickupLng
            )
          : undefined,
      }))
      .sort((a, b) => (a.distance_km || 999) - (b.distance_km || 999));
  }, [availableDrivers]);

  // Refresh drivers on mount and when org changes
  useEffect(() => {
    fetchAvailableDrivers();
  }, [fetchAvailableDrivers]);

  // Subscribe to driver availability changes
  useEffect(() => {
    if (!transporterOrgId) return;

    const channel = supabase
      .channel('driver-availability')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'drivers',
          filter: `organization_id=eq.${transporterOrgId}`,
        },
        () => {
          fetchAvailableDrivers();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [transporterOrgId, fetchAvailableDrivers]);

  return {
    availableDrivers,
    loading,
    fetchAvailableDrivers,
    getNearestDriver,
    autoAssignDriver,
    suggestDrivers,
  };
};

export default useDriverAutoAssign;
