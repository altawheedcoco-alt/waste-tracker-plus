/**
 * Hook مركزي لتحديد نوع السائق ومعلوماته
 */
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import type { DriverProfile, DriverType } from '@/types/driver-types';

export function useDriverType() {
  const { user } = useAuth();

  const { data: driverProfile, isLoading, error } = useQuery({
    queryKey: ['driver-profile-type', user?.id],
    enabled: !!user?.id,
    queryFn: async (): Promise<DriverProfile | null> => {
      const { data, error } = await supabase
        .from('drivers')
        .select(`
          id, profile_id, license_number, license_expiry,
          vehicle_type, vehicle_plate, is_available, organization_id,
          created_at, updated_at,
          driver_type, service_area_km, rating, total_trips,
          acceptance_rate, rejection_count, is_verified,
          preferred_waste_types, bio, hourly_rate, per_trip_rate,
          profile:profiles(full_name, phone, avatar_url)
        `)
        .eq('profile_id', user!.id)
        .maybeSingle();

      if (error) throw error;
      if (!data) return null;

      return data as unknown as DriverProfile;
    },
  });

  const driverType: DriverType | null = driverProfile?.driver_type ?? null;
  const isCompanyDriver = driverType === 'company';
  const isHiredDriver = driverType === 'hired';
  const isIndependentDriver = driverType === 'independent';
  const isFreelance = isHiredDriver || isIndependentDriver;

  return {
    driverProfile,
    driverType,
    isCompanyDriver,
    isHiredDriver,
    isIndependentDriver,
    isFreelance,
    isLoading,
    error,
    isDriver: !!driverProfile,
  };
}
