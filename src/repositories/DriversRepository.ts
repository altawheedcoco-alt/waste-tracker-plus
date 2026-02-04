import { createRepository, QueryOptions } from './BaseRepository';
import { supabase } from '@/integrations/supabase/client';

export interface Driver {
  id: string;
  profile_id: string;
  organization_id?: string;
  license_number: string;
  license_expiry?: string;
  vehicle_type?: string;
  vehicle_plate?: string;
  is_available: boolean;
  created_at: string;
  updated_at: string;
}

export interface DriverLocation {
  id: string;
  driver_id: string;
  latitude: number;
  longitude: number;
  accuracy?: number;
  speed?: number;
  heading?: number;
  recorded_at: string;
}

const baseRepo = createRepository<Driver>('drivers', '*');

export const DriversRepository = {
  ...baseRepo,

  async findByOrganization(organizationId: string, options?: QueryOptions): Promise<Driver[]> {
    return baseRepo.findAll({
      ...options,
      filters: { ...options?.filters, organization_id: organizationId },
    });
  },

  async findAvailable(organizationId?: string): Promise<Driver[]> {
    const filters: Record<string, any> = { is_available: true };
    if (organizationId) filters.organization_id = organizationId;
    
    return baseRepo.findAll({ filters, orderBy: { column: 'created_at', ascending: false } });
  },

  async findByProfile(profileId: string): Promise<Driver | null> {
    const { data, error } = await supabase
      .from('drivers')
      .select('*')
      .eq('profile_id', profileId)
      .maybeSingle();

    if (error) {
      console.error('Error fetching driver by profile:', error);
      throw error;
    }

    return data as Driver | null;
  },

  async setAvailability(driverId: string, isAvailable: boolean): Promise<Driver> {
    return baseRepo.update(driverId, { is_available: isAvailable } as Partial<Driver>);
  },

  async assignToOrganization(driverId: string, organizationId: string): Promise<Driver> {
    return baseRepo.update(driverId, { organization_id: organizationId } as Partial<Driver>);
  },

  async getLatestLocation(driverId: string): Promise<DriverLocation | null> {
    const { data, error } = await supabase
      .from('driver_location_logs')
      .select('*')
      .eq('driver_id', driverId)
      .order('recorded_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) {
      console.error('Error fetching driver location:', error);
      throw error;
    }

    return data as DriverLocation | null;
  },

  async updateLocation(driverId: string, location: Omit<DriverLocation, 'id' | 'driver_id' | 'recorded_at'>): Promise<DriverLocation> {
    const { data, error } = await supabase
      .from('driver_location_logs')
      .insert({
        driver_id: driverId,
        ...location,
        recorded_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      console.error('Error updating driver location:', error);
      throw error;
    }

    return data as DriverLocation;
  },

  async getLocationHistory(driverId: string, hoursBack = 24): Promise<DriverLocation[]> {
    const fromDate = new Date(Date.now() - hoursBack * 60 * 60 * 1000).toISOString();
    
    const { data, error } = await supabase
      .from('driver_location_logs')
      .select('*')
      .eq('driver_id', driverId)
      .gte('recorded_at', fromDate)
      .order('recorded_at', { ascending: true });

    if (error) {
      console.error('Error fetching driver location history:', error);
      throw error;
    }

    return (data || []) as DriverLocation[];
  },

  async getActiveDriversWithLocations(organizationId: string): Promise<(Driver & { location?: DriverLocation })[]> {
    const drivers = await this.findAvailable(organizationId);
    
    const driversWithLocations = await Promise.all(
      drivers.map(async (driver) => {
        const location = await this.getLatestLocation(driver.id);
        return { ...driver, location: location || undefined };
      })
    );

    return driversWithLocations;
  },

  async getStats(organizationId: string): Promise<{
    total: number;
    available: number;
    onDuty: number;
    licensesExpiringSoon: number;
  }> {
    const drivers = await this.findByOrganization(organizationId);
    const thirtyDaysFromNow = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
    
    return {
      total: drivers.length,
      available: drivers.filter(d => d.is_available).length,
      onDuty: drivers.filter(d => !d.is_available).length,
      licensesExpiringSoon: drivers.filter(d => 
        d.license_expiry && new Date(d.license_expiry) <= thirtyDaysFromNow
      ).length,
    };
  },

  async search(query: string, organizationId?: string): Promise<Driver[]> {
    let dbQuery = supabase
      .from('drivers')
      .select('*')
      .or(`license_number.ilike.%${query}%,vehicle_plate.ilike.%${query}%`);

    if (organizationId) {
      dbQuery = dbQuery.eq('organization_id', organizationId);
    }

    const { data, error } = await dbQuery.order('created_at', { ascending: false });

    if (error) {
      console.error('Error searching drivers:', error);
      throw error;
    }

    return (data || []) as Driver[];
  },
};
