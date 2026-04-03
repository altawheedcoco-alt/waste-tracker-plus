/**
 * PredictiveMaintenanceWidget — الصيانة التنبؤية
 * يتنبأ بأوقات الصيانة المطلوبة للأسطول
 */
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Wrench, AlertCircle, CheckCircle2, Clock, Truck } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface VehicleHealth {
  id: string;
  plate: string;
  tripCount: number;
  lastTrip: string;
  healthScore: number;
  status: 'good' | 'attention' | 'critical';
  nextMaintenance: string;
  daysUntilMaintenance: number;
}

export default function PredictiveMaintenanceWidget() {
  const { organization } = useAuth();
  const orgId = organization?.id;

  const { data, isLoading } = useQuery({
    queryKey: ['predictive-maintenance', orgId],
    queryFn: async () => {
      if (!orgId) return [];

      const { data: vehicles } = await supabase
        .from('vehicles')
        .select('id, plate_number, vehicle_type, last_maintenance_date, total_trips, created_at')
        .eq('organization_id', orgId)
        .eq('is_active', true);

      const now = new Date();

      return (vehicles || []).map(v => {
        const lastMaint = v.last_maintenance_date ? new Date(v.last_maintenance_date) : new Date(v.created_at);
        const daysSinceMaint = Math.floor((now.getTime() - lastMaint.getTime()) / (1000 * 60 * 60 * 24));
        const trips = v.total_trips || 0;

        // Predict next maintenance based on trips and time
        const maintenanceIntervalDays = 90; // every 3 months
        const tripThreshold = 100;
        
        const daysFactor = Math.min(daysSinceMaint / maintenanceIntervalDays, 1);
        const tripFactor = Math.min(trips / tripThreshold, 1);
        const healthScore = Math.max(0, Math.round((1 - Math.max(daysFactor, tripFactor)) * 100));

        const daysUntilMaintenance = Math.max(0, maintenanceIntervalDays - daysSinceMaint);
        const nextMaintDate = new Date(lastMaint.getTime() + maintenanceIntervalDays * 24 * 60 * 60 * 1000);

        let status: 'good' | 'attention' | 'critical' = 'good';
        if (healthScore < 30) status = 'critical';
        else if (healthScore < 60) status = 'attention';

        return {
          id: v.id,
          plate: v.plate_number || 'غير محدد',
          tripCount: trips,
          lastTrip: lastMaint.toLocaleDateString('ar-EG'),
          healthScore,
          status,
          nextMaintenance: nextMaintDate.toLocaleDateString('ar-EG'),
          daysUntilMaintenance,
        } as VehicleHealth;
      }).sort((a, b) => a.healthScore - b.healthScore).slice(0, 6);
    },
    enabled: !!orgId,
    staleTime: 30 * 60 * 1000,
  });

  const StatusIcon = ({ status }: { status: string }) => {
    if (status === 'critical') return <AlertCircle className="h-4 w-4 text-destructive" />;
    if (status === 'attention') return <Clock className="h-4 w-4 text-yellow-500" />;
    return <CheckCircle2 className="h-4 w-4 text-green-500" />;
  };

  return (
    <Card className="border-border">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <CardTitle className="flex items-center gap-2 text-base">
            <Wrench className="h-5 w-5 text-primary" />
            الصيانة التنبؤية
          </CardTitle>
          {data && data.length > 0 && (
            <Badge variant={data.some(v => v.status === 'critical') ? 'destructive' : 'default'} className="text-xs">
              {data.filter(v => v.status === 'critical').length} تحتاج صيانة
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="h-[200px] bg-muted/20 rounded animate-pulse" />
        ) : data?.length ? (
          <div className="space-y-2">
            {data.map(v => (
              <div key={v.id} className={`flex items-center gap-3 p-2.5 rounded-lg border ${
                v.status === 'critical' ? 'border-destructive/30 bg-destructive/5' :
                v.status === 'attention' ? 'border-yellow-500/30 bg-yellow-500/5' :
                'border-border bg-muted/20'
              }`}>
                <StatusIcon status={v.status} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <Truck className="h-3 w-3 text-muted-foreground" />
                    <span className="text-sm font-medium truncate">{v.plate}</span>
                  </div>
                  <p className="text-[10px] text-muted-foreground">
                    {v.tripCount} رحلة · آخر صيانة: {v.lastTrip}
                  </p>
                </div>
                <div className="text-left flex-shrink-0">
                  <div className="text-sm font-bold">{v.healthScore}%</div>
                  <p className="text-[9px] text-muted-foreground">
                    {v.daysUntilMaintenance > 0 ? `${v.daysUntilMaintenance} يوم` : 'الآن!'}
                  </p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="h-[200px] flex items-center justify-center text-sm text-muted-foreground">
            لا توجد مركبات مسجلة
          </div>
        )}
      </CardContent>
    </Card>
  );
}
