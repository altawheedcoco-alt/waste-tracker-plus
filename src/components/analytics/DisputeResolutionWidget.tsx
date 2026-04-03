/**
 * DisputeResolutionWidget — تتبع النزاعات (من shipment_logs)
 */
import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { MessageSquareWarning, CheckCircle2, Clock, AlertCircle } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Skeleton } from '@/components/ui/skeleton';

export default function DisputeResolutionWidget() {
  const { organization } = useAuth();
  const orgId = organization?.id;

  const { data, isLoading } = useQuery({
    queryKey: ['dispute-resolution', orgId],
    enabled: !!orgId,
    queryFn: async () => {
      // Use shipments with status issues as proxy for disputes
      const { data: shipments } = await supabase
        .from('shipments')
        .select('status, created_at, delivered_at')
        .or(`generator_id.eq.${orgId},recycler_id.eq.${orgId},transporter_id.eq.${orgId}`)
        .limit(500);
      return shipments || [];
    },
  });

  const stats = useMemo(() => {
    if (!data) return { total: 0, delivered: 0, cancelled: 0, pending: 0, deliveryRate: 0, avgDays: 0 };
    const delivered = data.filter(s => s.status === 'delivered');
    const cancelled = data.filter(s => s.status === 'cancelled');
    const pending = data.filter(s => !['delivered', 'cancelled', 'confirmed'].includes(s.status || ''));
    
    let totalDays = 0;
    let counted = 0;
    delivered.forEach(s => {
      if (s.delivered_at) {
        totalDays += (new Date(s.delivered_at).getTime() - new Date(s.created_at).getTime()) / (1000 * 60 * 60 * 24);
        counted++;
      }
    });

    return {
      total: data.length,
      delivered: delivered.length,
      cancelled: cancelled.length,
      pending: pending.length,
      deliveryRate: data.length > 0 ? Math.round((delivered.length / data.length) * 100) : 0,
      avgDays: counted > 0 ? Math.round(totalDays / counted) : 0,
    };
  }, [data]);

  if (isLoading) return <Skeleton className="h-[240px] w-full rounded-xl" />;

  return (
    <Card className="border-border">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-base">
          <MessageSquareWarning className="h-5 w-5 text-primary" />
          معدل إتمام العمليات
        </CardTitle>
      </CardHeader>
      <CardContent>
        {stats.total === 0 ? (
          <div className="text-center py-6">
            <CheckCircle2 className="h-8 w-8 mx-auto text-primary mb-2" />
            <p className="text-sm text-muted-foreground">لا توجد عمليات بعد</p>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm">نسبة الإتمام</span>
              <Badge variant={stats.deliveryRate >= 80 ? 'default' : 'destructive'}>{stats.deliveryRate}%</Badge>
            </div>
            <Progress value={stats.deliveryRate} className="h-2" />
            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="p-2 rounded-lg bg-muted/50">
                <AlertCircle className="h-4 w-4 mx-auto text-primary mb-1" />
                <div className="text-lg font-bold">{stats.pending}</div>
                <div className="text-[10px] text-muted-foreground">قيد التنفيذ</div>
              </div>
              <div className="p-2 rounded-lg bg-muted/50">
                <CheckCircle2 className="h-4 w-4 mx-auto text-primary mb-1" />
                <div className="text-lg font-bold">{stats.delivered}</div>
                <div className="text-[10px] text-muted-foreground">مكتملة</div>
              </div>
              <div className="p-2 rounded-lg bg-muted/50">
                <Clock className="h-4 w-4 mx-auto text-primary mb-1" />
                <div className="text-lg font-bold">{stats.avgDays}</div>
                <div className="text-[10px] text-muted-foreground">متوسط أيام</div>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
