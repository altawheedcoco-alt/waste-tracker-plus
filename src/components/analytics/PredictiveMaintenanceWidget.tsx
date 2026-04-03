/**
 * PredictiveMaintenanceWidget — الصيانة التنبؤية
 * يتنبأ بحالة الأسطول بناءً على بيانات الشحنات
 */
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Wrench, AlertCircle, CheckCircle2, Clock, Truck } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export default function PredictiveMaintenanceWidget() {
  const { organization } = useAuth();
  const orgId = organization?.id;

  const { data, isLoading } = useQuery({
    queryKey: ['predictive-maintenance', orgId],
    queryFn: async () => {
      if (!orgId) return [];

      // Analyze driver activity as proxy for fleet health
      const threeMonthsAgo = new Date();
      threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);

      const { data: shipments } = await supabase
        .from('shipments')
        .select('driver_id, created_at, delivered_at, status, actual_weight')
        .eq('transporter_id', orgId)
        .gte('created_at', threeMonthsAgo.toISOString())
        .not('driver_id', 'is', null);

      const driverMap = new Map<string, { trips: number; lastTrip: Date; totalWeight: number }>();

      (shipments || []).forEach(s => {
        if (!s.driver_id) return;
        const existing = driverMap.get(s.driver_id) || { trips: 0, lastTrip: new Date(0), totalWeight: 0 };
        existing.trips++;
        const d = new Date(s.created_at!);
        if (d > existing.lastTrip) existing.lastTrip = d;
        existing.totalWeight += s.actual_weight || 0;
        driverMap.set(s.driver_id, existing);
      });

      const now = new Date();
      return Array.from(driverMap.entries()).map(([id, stats]) => {
        const daysSinceLastTrip = Math.floor((now.getTime() - stats.lastTrip.getTime()) / (1000 * 60 * 60 * 24));
        const loadStress = stats.totalWeight / Math.max(stats.trips, 1);

        // Health score based on activity and load
        const activityFactor = Math.min(daysSinceLastTrip / 30, 1);
        const loadFactor = Math.min(loadStress / 5000, 1); // 5000kg threshold
        const healthScore = Math.max(0, Math.round((1 - Math.max(activityFactor, loadFactor * 0.5)) * 100));

        let status: 'good' | 'attention' | 'critical' = 'good';
        if (healthScore < 30) status = 'critical';
        else if (healthScore < 60) status = 'attention';

        return {
          id,
          plate: `سائق-${id.slice(0, 6)}`,
          tripCount: stats.trips,
          lastTrip: stats.lastTrip.toLocaleDateString('ar-EG'),
          healthScore,
          status,
          daysInactive: daysSinceLastTrip,
        };
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
            صحة الأسطول التنبؤية
          </CardTitle>
          {data && data.length > 0 && (
            <Badge variant={data.some(v => v.status === 'critical') ? 'destructive' : 'default'} className="text-xs">
              {data.filter(v => v.status !== 'good').length} يحتاج انتباه
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
                    {v.tripCount} رحلة · آخر نشاط: {v.lastTrip}
                  </p>
                </div>
                <div className="text-left flex-shrink-0">
                  <div className="text-sm font-bold">{v.healthScore}%</div>
                  <p className="text-[9px] text-muted-foreground">
                    {v.daysInactive === 0 ? 'نشط' : `${v.daysInactive} يوم خمول`}
                  </p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="h-[200px] flex items-center justify-center text-sm text-muted-foreground">لا توجد بيانات أسطول</div>
        )}
      </CardContent>
    </Card>
  );
}
