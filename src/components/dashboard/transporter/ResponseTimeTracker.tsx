/**
 * متتبع وقت الاستجابة - فكرة #59
 */
import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Timer } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Skeleton } from '@/components/ui/skeleton';
import { Progress } from '@/components/ui/progress';

export default function ResponseTimeTracker() {
  const { organization } = useAuth();
  const orgId = organization?.id;

  const { data: shipments, isLoading } = useQuery({
    queryKey: ['response-time', orgId],
    enabled: !!orgId,
    queryFn: async () => {
      const { data } = await supabase
        .from('shipments')
        .select('created_at, status')
        .eq('transporter_id', orgId!)
        .gte('created_at', new Date(Date.now() - 30 * 24 * 3600000).toISOString())
        .limit(200);
      return (data || []) as any[];
    },
  });

  const metrics = useMemo(() => {
    if (!shipments?.length) return null;
    const total = shipments.length;
    const delivered = shipments.filter((s: any) => s.status === 'delivered' || s.status === 'confirmed').length;
    const deliveryRate = Math.round((delivered / total) * 100);

    return {
      total,
      delivered,
      deliveryRate,
    };
  }, [shipments]);

  if (isLoading) return <Skeleton className="h-[200px] w-full rounded-xl" />;

  return (
    <Card className="border-border">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-base">
          <Timer className="h-5 w-5 text-primary" />
          أداء الشحنات
        </CardTitle>
      </CardHeader>
      <CardContent>
        {!metrics ? (
          <p className="text-sm text-muted-foreground text-center py-6">لا توجد بيانات كافية</p>
        ) : (
          <div className="space-y-3">
            <div className="text-center">
              <div className="text-3xl font-bold text-primary">{metrics.deliveryRate}%</div>
              <div className="text-xs text-muted-foreground">معدل الإنجاز (30 يوم)</div>
            </div>

            <div>
              <div className="flex justify-between text-[10px] mb-1">
                <span>مكتمل</span>
                <span className="font-medium">{metrics.delivered}/{metrics.total}</span>
              </div>
              <Progress value={metrics.deliveryRate} className="h-1.5" />
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}