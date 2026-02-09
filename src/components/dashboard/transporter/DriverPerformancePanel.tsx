import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import { Users, Star, Truck, Clock, Route } from 'lucide-react';

interface DriverPerformance {
  driverId: string;
  name: string;
  totalTrips: number;
  deliveredOnTime: number;
  onTimeRate: number;
  avgRating: number;
  totalDistance: number;
  isAvailable: boolean;
}

const DriverPerformancePanel = () => {
  const { organization } = useAuth();

  const { data: drivers = [], isLoading } = useQuery({
    queryKey: ['driver-performance', organization?.id],
    queryFn: async (): Promise<DriverPerformance[]> => {
      // Fetch drivers with profiles
      const { data: driversData } = await supabase
        .from('drivers')
        .select('id, is_available, profile:profiles(full_name)')
        .eq('organization_id', organization!.id);

      if (!driversData?.length) return [];

      const driverIds = driversData.map(d => d.id);

      // Fetch shipments for these drivers
      const { data: shipments } = await supabase
        .from('shipments')
        .select('driver_id, status, delivered_at, expected_delivery_date')
        .in('driver_id', driverIds);

      // Fetch ratings
      const { data: ratings } = await supabase
        .from('partner_ratings')
        .select('rated_organization_id, overall_rating')
        .eq('rated_organization_id', organization!.id);

      const avgOrgRating = ratings?.length
        ? ratings.reduce((sum, r) => sum + r.overall_rating, 0) / ratings.length
        : 0;

      // Fetch trip costs for distance
      const { data: tripCosts } = await supabase
        .from('trip_costs')
        .select('driver_id, distance_km')
        .eq('organization_id', organization!.id)
        .in('driver_id', driverIds);

      return driversData.map(driver => {
        const profile = Array.isArray(driver.profile) ? driver.profile[0] : driver.profile;
        const driverShipments = shipments?.filter(s => s.driver_id === driver.id) || [];
        const delivered = driverShipments.filter(s => s.status === 'delivered' || s.status === 'confirmed');
        const onTime = delivered.filter(s => {
          if (!s.delivered_at || !s.expected_delivery_date) return true;
          return new Date(s.delivered_at) <= new Date(s.expected_delivery_date);
        });
        const driverTrips = tripCosts?.filter(t => t.driver_id === driver.id) || [];
        const totalDist = driverTrips.reduce((sum, t) => sum + (Number(t.distance_km) || 0), 0);

        return {
          driverId: driver.id,
          name: profile?.full_name || 'سائق غير معرّف',
          totalTrips: driverShipments.length,
          deliveredOnTime: onTime.length,
          onTimeRate: delivered.length > 0 ? Math.round((onTime.length / delivered.length) * 100) : 100,
          avgRating: avgOrgRating,
          totalDistance: totalDist,
          isAvailable: driver.is_available,
        };
      }).sort((a, b) => b.totalTrips - a.totalTrips);
    },
    enabled: !!organization?.id,
    refetchInterval: 60000,
  });

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-5 bg-muted rounded w-1/3" />
            {[1, 2, 3].map(i => <div key={i} className="h-20 bg-muted rounded" />)}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Users className="w-5 h-5 text-primary" />
          تقرير أداء السائقين
          <Badge variant="secondary" className="mr-auto">{drivers.length} سائق</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {drivers.length === 0 ? (
          <p className="text-muted-foreground text-center py-6 text-sm">لا يوجد سائقون مسجلون</p>
        ) : (
          <div className="space-y-3 max-h-[400px] overflow-y-auto">
            {drivers.map((driver) => (
              <div key={driver.driverId} className="flex items-center gap-3 p-3 rounded-lg border bg-card">
                <Avatar className="h-10 w-10 shrink-0">
                  <AvatarFallback className="bg-primary/10 text-primary text-sm font-bold">
                    {driver.name.charAt(0)}
                  </AvatarFallback>
                </Avatar>

                <div className="flex-1 min-w-0 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <Badge variant={driver.isAvailable ? 'default' : 'secondary'} className="text-[10px]">
                      {driver.isAvailable ? 'متاح' : 'مشغول'}
                    </Badge>
                    <p className="font-medium text-sm truncate">{driver.name}</p>
                  </div>
                  
                  <div className="grid grid-cols-4 gap-2 text-center">
                    <div>
                      <div className="flex items-center justify-center gap-1 text-xs text-muted-foreground">
                        <Truck className="w-3 h-3" />
                        <span>رحلات</span>
                      </div>
                      <p className="text-sm font-bold">{driver.totalTrips}</p>
                    </div>
                    <div>
                      <div className="flex items-center justify-center gap-1 text-xs text-muted-foreground">
                        <Clock className="w-3 h-3" />
                        <span>في الوقت</span>
                      </div>
                      <p className="text-sm font-bold">{driver.onTimeRate}%</p>
                    </div>
                    <div>
                      <div className="flex items-center justify-center gap-1 text-xs text-muted-foreground">
                        <Star className="w-3 h-3" />
                        <span>التقييم</span>
                      </div>
                      <p className="text-sm font-bold">{driver.avgRating.toFixed(1)}</p>
                    </div>
                    <div>
                      <div className="flex items-center justify-center gap-1 text-xs text-muted-foreground">
                        <Route className="w-3 h-3" />
                        <span>كم</span>
                      </div>
                      <p className="text-sm font-bold">{driver.totalDistance.toLocaleString()}</p>
                    </div>
                  </div>

                  <Progress value={driver.onTimeRate} className="h-1.5" />
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default DriverPerformancePanel;
