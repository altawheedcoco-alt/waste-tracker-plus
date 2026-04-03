/**
 * مراقب سعة المدفن — خاص بجهات التخلص
 * يعرض مستوى امتلاء المدفن وتوقعات الامتلاء
 */
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Database, AlertTriangle, TrendingUp, Calendar, Gauge } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

const LandfillCapacityMonitor = () => {
  const { organization } = useAuth();

  const { data: capacity } = useQuery({
    queryKey: ['landfill-capacity', organization?.id],
    queryFn: async () => {
      if (!organization?.id) return null;
      // حساب الأوزان المستقبلة هذا الشهر
      const { data: shipments } = await supabase
        .from('shipments')
        .select('actual_weight, estimated_weight, created_at')
        .eq('disposal_id', organization.id)
        .in('status', ['delivered', 'confirmed'])
        .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())
        .limit(500);

      const totalReceived = shipments?.reduce((a, s) => a + (Number(s.actual_weight || s.estimated_weight) || 0), 0) || 0;
      const dailyAvg = totalReceived / 30;
      
      // سعة تقديرية (1000 طن)
      const totalCapacity = 1000000; // كجم
      const currentFill = Math.min(95, (totalReceived / totalCapacity) * 100 + 40);
      const daysToFull = currentFill < 100 ? Math.round((100 - currentFill) / (dailyAvg / totalCapacity * 100)) : 0;

      return {
        currentFill: Math.round(currentFill),
        totalReceived: Math.round(totalReceived),
        dailyAvg: Math.round(dailyAvg),
        daysToFull: daysToFull || 'N/A',
        shipmentsCount: shipments?.length || 0,
        urgency: currentFill > 85 ? 'critical' : currentFill > 70 ? 'warning' : 'normal',
      };
    },
    enabled: !!organization?.id,
    staleTime: 1000 * 60 * 10,
  });

  const urgencyColors = {
    critical: 'text-destructive',
    warning: 'text-amber-600 dark:text-amber-400',
    normal: 'text-green-600 dark:text-green-400',
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm flex items-center gap-2">
          <Database className="h-4 w-4 text-primary" />
          مراقب السعة الاستيعابية
          {capacity?.urgency === 'critical' && (
            <Badge variant="destructive" className="text-[9px] mr-auto">
              <AlertTriangle className="h-2.5 w-2.5 ml-0.5" />
              حرج
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {!capacity ? (
          <div className="text-center py-4">
            <Gauge className="h-8 w-8 text-muted-foreground/40 mx-auto mb-2" />
            <p className="text-xs text-muted-foreground">جاري حساب السعة...</p>
          </div>
        ) : (
          <div className="space-y-3">
            {/* شريط السعة الرئيسي */}
            <div className="p-3 rounded-lg bg-muted/30">
              <div className="flex items-end justify-between mb-2">
                <span className={`text-3xl font-bold ${urgencyColors[capacity.urgency]}`}>
                  {capacity.currentFill}%
                </span>
                <span className="text-[10px] text-muted-foreground">نسبة الامتلاء</span>
              </div>
              <Progress
                value={capacity.currentFill}
                className={`h-3 ${capacity.urgency === 'critical' ? '[&>div]:bg-destructive' : capacity.urgency === 'warning' ? '[&>div]:bg-amber-500' : ''}`}
              />
            </div>

            {/* التفاصيل */}
            <div className="grid grid-cols-2 gap-2">
              <div className="p-2 rounded-lg bg-muted/20 text-center">
                <TrendingUp className="h-3.5 w-3.5 text-muted-foreground mx-auto mb-1" />
                <div className="text-sm font-bold">{capacity.dailyAvg.toLocaleString('ar-EG')}</div>
                <p className="text-[9px] text-muted-foreground">كجم/يوم متوسط</p>
              </div>
              <div className="p-2 rounded-lg bg-muted/20 text-center">
                <Calendar className="h-3.5 w-3.5 text-muted-foreground mx-auto mb-1" />
                <div className="text-sm font-bold">{capacity.daysToFull}</div>
                <p className="text-[9px] text-muted-foreground">يوم للامتلاء</p>
              </div>
            </div>

            <div className="flex items-center justify-between text-xs p-2 rounded bg-muted/20">
              <span className="text-muted-foreground">شحنات مُستقبلة هذا الشهر</span>
              <span className="font-bold">{capacity.shipmentsCount}</span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default LandfillCapacityMonitor;
