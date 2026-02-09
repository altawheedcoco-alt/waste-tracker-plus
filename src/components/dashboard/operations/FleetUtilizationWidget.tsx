import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Truck, User, Activity, Gauge } from 'lucide-react';

interface FleetStats {
  totalDrivers: number;
  availableDrivers: number;
  busyDrivers: number;
  activeShipments: number;
  utilization: number;
}

const FleetUtilizationWidget = () => {
  const { organization } = useAuth();

  const { data: fleet, isLoading } = useQuery({
    queryKey: ['fleet-utilization', organization?.id],
    queryFn: async (): Promise<FleetStats> => {
      const [driversResult, shipmentsResult] = await Promise.all([
        supabase
          .from('drivers')
          .select('is_available')
          .eq('organization_id', organization!.id),
        supabase
          .from('shipments')
          .select('id')
          .eq('transporter_id', organization!.id)
          .in('status', ['collecting', 'in_transit', 'approved']),
      ]);

      const drivers = driversResult.data || [];
      const totalDrivers = drivers.length;
      const availableDrivers = drivers.filter(d => d.is_available).length;
      const busyDrivers = totalDrivers - availableDrivers;
      const activeShipments = shipmentsResult.data?.length || 0;
      const utilization = totalDrivers > 0 ? Math.round((busyDrivers / totalDrivers) * 100) : 0;

      return { totalDrivers, availableDrivers, busyDrivers, activeShipments, utilization };
    },
    enabled: !!organization?.id,
    refetchInterval: 30000,
  });

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="animate-pulse space-y-3">
            <div className="h-4 bg-muted rounded w-1/3" />
            <div className="h-8 bg-muted rounded" />
          </div>
        </CardContent>
      </Card>
    );
  }

  const utilizationColor = (fleet?.utilization || 0) > 85
    ? 'text-red-600'
    : (fleet?.utilization || 0) > 60
    ? 'text-amber-600'
    : 'text-emerald-600';

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Gauge className="w-5 h-5 text-primary" />
          استخدام الأسطول
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Utilization bar */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <Badge variant={fleet?.utilization! > 85 ? 'destructive' : 'secondary'}>
              {fleet?.utilization! > 85 ? 'حمل عالي' : fleet?.utilization! > 60 ? 'معتدل' : 'منخفض'}
            </Badge>
            <span className={`font-bold text-lg ${utilizationColor}`}>
              {fleet?.utilization}%
            </span>
          </div>
          <Progress value={fleet?.utilization || 0} className="h-3" />
        </div>

        {/* Fleet details */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="text-center p-3 rounded-lg border">
            <User className="w-5 h-5 mx-auto mb-1 text-muted-foreground" />
            <p className="text-xl font-bold">{fleet?.totalDrivers}</p>
            <p className="text-xs text-muted-foreground">إجمالي السائقين</p>
          </div>
          <div className="text-center p-3 rounded-lg border">
            <Activity className="w-5 h-5 mx-auto mb-1 text-emerald-600" />
            <p className="text-xl font-bold text-emerald-600">{fleet?.availableDrivers}</p>
            <p className="text-xs text-muted-foreground">متاح</p>
          </div>
          <div className="text-center p-3 rounded-lg border">
            <Truck className="w-5 h-5 mx-auto mb-1 text-amber-600" />
            <p className="text-xl font-bold text-amber-600">{fleet?.busyDrivers}</p>
            <p className="text-xs text-muted-foreground">مشغول</p>
          </div>
          <div className="text-center p-3 rounded-lg border">
            <Truck className="w-5 h-5 mx-auto mb-1 text-blue-600" />
            <p className="text-xl font-bold text-blue-600">{fleet?.activeShipments}</p>
            <p className="text-xs text-muted-foreground">شحنات نشطة</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default FleetUtilizationWidget;
