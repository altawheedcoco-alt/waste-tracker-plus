/**
 * SLAComplianceWidget — الالتزام بمستوى الخدمة SLA
 */
import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ShieldCheck, Clock, AlertTriangle } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Skeleton } from '@/components/ui/skeleton';

const SLA_TARGET_HOURS = 48; // target delivery in 48 hours

export default function SLAComplianceWidget() {
  const { organization } = useAuth();
  const orgId = organization?.id;

  const { data: shipments, isLoading } = useQuery({
    queryKey: ['sla-compliance', orgId],
    enabled: !!orgId,
    queryFn: async () => {
      const { data } = await supabase
        .from('shipments')
        .select('created_at, delivered_at, status')
        .or(`generator_id.eq.${orgId},recycler_id.eq.${orgId},transporter_id.eq.${orgId}`)
        .in('status', ['delivered']);
      return data || [];
    },
  });

  const metrics = useMemo(() => {
    if (!shipments || shipments.length === 0) return null;
    let onTime = 0;
    let late = 0;
    let totalHours = 0;

    shipments.forEach(s => {
      if (!s.delivered_at) return;
      const hours = (new Date(s.delivered_at).getTime() - new Date(s.created_at).getTime()) / (1000 * 60 * 60);
      totalHours += hours;
      if (hours <= SLA_TARGET_HOURS) onTime++;
      else late++;
    });

    const total = onTime + late;
    const complianceRate = total > 0 ? Math.round((onTime / total) * 100) : 0;
    const avgHours = total > 0 ? Math.round(totalHours / total) : 0;

    return { onTime, late, total, complianceRate, avgHours };
  }, [shipments]);

  if (isLoading) return <Skeleton className="h-[220px] w-full rounded-xl" />;

  return (
    <Card className="border-border">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-base">
          <ShieldCheck className="h-5 w-5 text-primary" />
          الالتزام بمستوى الخدمة
          <Badge variant="outline" className="text-[10px] mr-auto">SLA {SLA_TARGET_HOURS}h</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {!metrics || metrics.total === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-6">لا توجد شحنات مكتملة</p>
        ) : (
          <div className="space-y-4">
            <div className="text-center">
              <div className={`text-3xl font-bold ${metrics.complianceRate >= 80 ? 'text-green-500' : metrics.complianceRate >= 60 ? 'text-yellow-500' : 'text-destructive'}`}>
                {metrics.complianceRate}%
              </div>
              <p className="text-xs text-muted-foreground">نسبة الالتزام</p>
            </div>
            <Progress value={metrics.complianceRate} className="h-2" />
            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="p-2 rounded-lg bg-muted/50">
                <ShieldCheck className="h-4 w-4 mx-auto text-green-500 mb-1" />
                <div className="text-sm font-bold">{metrics.onTime}</div>
                <div className="text-[10px] text-muted-foreground">في الوقت</div>
              </div>
              <div className="p-2 rounded-lg bg-muted/50">
                <AlertTriangle className="h-4 w-4 mx-auto text-destructive mb-1" />
                <div className="text-sm font-bold">{metrics.late}</div>
                <div className="text-[10px] text-muted-foreground">متأخر</div>
              </div>
              <div className="p-2 rounded-lg bg-muted/50">
                <Clock className="h-4 w-4 mx-auto text-primary mb-1" />
                <div className="text-sm font-bold">{metrics.avgHours}h</div>
                <div className="text-[10px] text-muted-foreground">متوسط</div>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
