import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface TransportOfficeStats {
  // Fleet
  totalVehicles: number;
  availableVehicles: number;
  rentedVehicles: number;
  maintenanceVehicles: number;
  // Drivers
  totalDrivers: number;
  availableDrivers: number;
  // Bookings
  pendingBookings: number;
  activeBookings: number;
  completedBookings: number;
  cancelledBookings: number;
  // Financial
  totalRevenue: number;
  avgTripRate: number;
  maintenanceCosts: number;
  // Compliance
  expiringLicenses: number;
  expiringInsurance: number;
  // Maintenance
  upcomingMaintenance: number;
  overdueMaintenance: number;
}

export const useTransportOfficeData = () => {
  const { organization } = useAuth();
  const orgId = organization?.id;

  return useQuery({
    queryKey: ['transport-office-data', orgId],
    queryFn: async (): Promise<{
      stats: TransportOfficeStats;
      vehicles: any[];
      bookings: any[];
      drivers: any[];
      maintenanceRecords: any[];
      contract: any;
      expiringVehicles: any[];
    }> => {
      if (!orgId) throw new Error('No org');

      const now = new Date();
      const thirtyDaysLater = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
      const thirtyDaysStr = thirtyDaysLater.toISOString().split('T')[0];

      const [vRes, bRes, cRes, dRes, mRes] = await Promise.all([
        supabase.from('fleet_vehicles').select('*').eq('organization_id', orgId).order('created_at', { ascending: false }),
        supabase.from('vehicle_bookings').select('*, fleet_vehicles(plate_number, vehicle_type), requester:organizations!vehicle_bookings_requester_org_id_fkey(name)').eq('fleet_owner_org_id', orgId).order('created_at', { ascending: false }),
        supabase.from('transport_office_contracts').select('*').eq('organization_id', orgId).eq('status', 'active').maybeSingle(),
        supabase.from('drivers').select('*, profile:profiles(full_name, avatar_url)').eq('organization_id', orgId),
        supabase.from('vehicle_maintenance').select('*').eq('organization_id', orgId).order('performed_at', { ascending: false }),
      ]);

      const vehicles = vRes.data || [];
      const bookings = bRes.data || [];
      const drivers = dRes.data || [];
      const maintenanceRecords = mRes.data || [];

      const completedBookings = bookings.filter(b => b.status === 'completed');
      const totalRevenue = completedBookings.reduce((sum, b) => sum + (b.agreed_price || 0), 0);
      const maintenanceCosts = maintenanceRecords.reduce((sum, m) => sum + (Number(m.cost) || 0), 0);

      // Expiring vehicles
      const expiringVehicles = vehicles.filter(v => {
        const licExpiry = v.license_expiry ? new Date(v.license_expiry) : null;
        const insExpiry = v.insurance_expiry ? new Date(v.insurance_expiry) : null;
        return (licExpiry && licExpiry <= thirtyDaysLater) || (insExpiry && insExpiry <= thirtyDaysLater);
      });

      // Upcoming/overdue maintenance
      const todayStr = now.toISOString().split('T')[0];
      const upcomingMaintenance = maintenanceRecords.filter(m => m.next_maintenance_date && m.next_maintenance_date <= thirtyDaysStr && m.next_maintenance_date >= todayStr).length;
      const overdueMaintenance = maintenanceRecords.filter(m => m.next_maintenance_date && m.next_maintenance_date < todayStr).length;

      return {
        stats: {
          totalVehicles: vehicles.length,
          availableVehicles: vehicles.filter(v => v.is_available && v.status === 'active').length,
          rentedVehicles: vehicles.filter(v => v.status === 'rented').length,
          maintenanceVehicles: vehicles.filter(v => v.status === 'maintenance').length,
          totalDrivers: drivers.length,
          availableDrivers: drivers.filter(d => d.is_available).length,
          pendingBookings: bookings.filter(b => b.status === 'pending').length,
          activeBookings: bookings.filter(b => b.status === 'approved').length,
          completedBookings: completedBookings.length,
          cancelledBookings: bookings.filter(b => b.status === 'cancelled').length,
          totalRevenue,
          avgTripRate: completedBookings.length > 0 ? Math.round(totalRevenue / completedBookings.length) : 0,
          maintenanceCosts,
          expiringLicenses: expiringVehicles.filter(v => v.license_expiry && new Date(v.license_expiry) <= thirtyDaysLater).length,
          expiringInsurance: expiringVehicles.filter(v => v.insurance_expiry && new Date(v.insurance_expiry) <= thirtyDaysLater).length,
          upcomingMaintenance,
          overdueMaintenance,
        },
        vehicles,
        bookings,
        drivers,
        maintenanceRecords,
        contract: cRes.data,
        expiringVehicles,
      };
    },
    enabled: !!orgId,
    staleTime: 1000 * 60 * 5,
  });
};
