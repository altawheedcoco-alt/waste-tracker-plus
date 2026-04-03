/**
 * لوحة توافر السائقين — خاص بالناقلين
 * يعرض حالة السائقين اللحظية وجاهزيتهم
 */
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Users, Circle, Truck, Coffee, Ban } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

type DriverStatus = 'available' | 'on_trip' | 'break' | 'offline';

interface DriverAvailability {
  id: string;
  name: string;
  avatar?: string;
  status: DriverStatus;
  currentTask?: string;
  tripsToday: number;
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
        .select('id, full_name, avatar_url, status, is_active')
        .eq('organization_id', organization.id)
        .eq('is_active', true)
        .order('full_name')
        .limit(10);

      if (!data) return [];

      return data.map(d => ({
        id: d.id,
        name: d.full_name || 'سائق',
        avatar: d.avatar_url || undefined,
        status: (d.status === 'on_trip' ? 'on_trip' : d.status === 'available' ? 'available' : 'offline') as DriverStatus,
        tripsToday: 0,
      }));
    },
    enabled: !!organization?.id,
    staleTime: 1000 * 60 * 2,
  });

  const availableCount = drivers.filter(d => d.status === 'available').length;
  const onTripCount = drivers.filter(d => d.status === 'on_trip').length;

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
            <Badge className="text-[9px] bg-blue-500/10 text-blue-700 dark:text-blue-300 border-0">
              {onTripCount} في رحلة
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
                    <AvatarImage src={driver.avatar} />
                    <AvatarFallback className="text-[10px] bg-primary/10 text-primary">
                      {driver.name.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium truncate">{driver.name}</p>
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
