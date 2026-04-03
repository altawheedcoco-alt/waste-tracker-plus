/**
 * لوحة توافر السائقين — خاص بالناقلين
 * يعرض حالة السائقين اللحظية وجاهزيتهم
 */
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Users, Circle, Truck, Coffee, Ban } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

type DriverStatus = 'available' | 'on_trip' | 'break' | 'offline';

interface DriverAvailability {
  id: string;
  name: string;
  status: DriverStatus;
  vehiclePlate?: string;
}

const statusConfig: Record<DriverStatus, { label: string; color: string; icon: typeof Circle }> = {
  available: { label: 'متاح', color: 'text-green-500', icon: Circle },
  on_trip: { label: 'في رحلة', color: 'text-blue-500', icon: Truck },
  break: { label: 'استراحة', color: 'text-amber-500', icon: Coffee },
  offline: { label: 'غير متصل', color: 'text-muted-foreground', icon: Ban },
};

const DriverAvailabilityBoard = () => {
  const { organization } = useAuth();

  const { data: drivers = [] } = useQuery({
    queryKey: ['driver-availability', organization?.id],
    queryFn: async (): Promise<DriverAvailability[]> => {
      if (!organization?.id) return [];
      const { data } = await supabase
        .from('drivers')
        .select('id, license_number, vehicle_plate, is_available, profile_id')
        .eq('organization_id', organization.id)
        .limit(10);

      if (!data) return [];

      // جلب أسماء السائقين من profiles
      const profileIds = data.map(d => d.profile_id).filter(Boolean);
      let profileNames: Record<string, string> = {};
      if (profileIds.length > 0) {
        const { data: profiles } = await supabase
          .from('profiles')
          .select('id, full_name')
          .in('id', profileIds);
        profiles?.forEach(p => { profileNames[p.id] = p.full_name || ''; });
      }

      return data.map(d => ({
        id: d.id,
        name: profileNames[d.profile_id] || `سائق ${d.license_number?.slice(-4) || ''}`,
        status: (d.is_available ? 'available' : 'offline') as DriverStatus,
        vehiclePlate: d.vehicle_plate || undefined,
      }));
    },
    enabled: !!organization?.id,
    staleTime: 1000 * 60 * 2,
  });

  const availableCount = drivers.filter(d => d.status === 'available').length;
  const offlineCount = drivers.filter(d => d.status === 'offline').length;

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm flex items-center gap-2">
          <Users className="h-4 w-4 text-primary" />
          حالة السائقين
          <div className="flex gap-1 mr-auto">
            <Badge className="text-[9px] bg-green-500/10 text-green-700 dark:text-green-300 border-0">
              {availableCount} متاح
            </Badge>
            <Badge className="text-[9px] bg-muted text-muted-foreground border-0">
              {offlineCount} غير متصل
            </Badge>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {drivers.length === 0 ? (
          <div className="text-center py-4">
            <Users className="h-8 w-8 text-muted-foreground/40 mx-auto mb-2" />
            <p className="text-xs text-muted-foreground">لا يوجد سائقين مسجلين</p>
          </div>
        ) : (
          <div className="space-y-1.5">
            {drivers.map(driver => {
              const config = statusConfig[driver.status];
              const StatusIcon = config.icon;
              return (
                <div
                  key={driver.id}
                  className="flex items-center gap-2.5 p-2 rounded-lg hover:bg-muted/30 transition-colors"
                >
                  <Avatar className="h-7 w-7">
                    <AvatarFallback className="text-[10px] bg-primary/10 text-primary">
                      {driver.name.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium truncate">{driver.name}</p>
                    {driver.vehiclePlate && (
                      <p className="text-[10px] text-muted-foreground">{driver.vehiclePlate}</p>
                    )}
                  </div>
                  <div className={`flex items-center gap-1 ${config.color}`}>
                    <StatusIcon className="h-3 w-3 fill-current" />
                    <span className="text-[10px] font-medium">{config.label}</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default DriverAvailabilityBoard;
