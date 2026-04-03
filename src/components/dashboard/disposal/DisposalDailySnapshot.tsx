/**
 * ملخص العمليات اليومية — خاص بجهات التخلص
 * يعرض عدد العمليات الواردة والمعالجة اليوم
 */
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Activity, Package, Scale, CheckCircle2, Clock } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

const DisposalDailySnapshot = () => {
  const { organization } = useAuth();

  const { data: today } = useQuery({
    queryKey: ['disposal-daily-snapshot', organization?.id],
    queryFn: async () => {
      if (!organization?.id) return null;
      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);

      const { data: shipments } = await supabase
        .from('shipments')
        .select('id, status, actual_weight, quantity')
        .eq('disposal_facility_id', organization.id)
        .gte('created_at', todayStart.toISOString())
        .limit(100);

      const all = shipments || [];
      const received = all.filter((s: any) => ['delivered', 'confirmed'].includes(s.status));
      const pending = all.filter((s: any) => ['new', 'approved', 'collecting', 'in_transit'].includes(s.status));
      const totalWeight = received.reduce((a, s: any) => a + (Number(s.actual_weight || s.quantity) || 0), 0);

      return {
        totalToday: all.length,
        received: received.length,
        pending: pending.length,
        totalWeight: Math.round(totalWeight),
      };
    },
    enabled: !!organization?.id,
    staleTime: 1000 * 60 * 3,
  });

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm flex items-center gap-2">
          <Activity className="h-4 w-4 text-primary" />
          عمليات اليوم
          <Badge variant="secondary" className="text-[10px] mr-auto">مباشر</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-2">
          <div className="p-3 rounded-lg bg-muted/30 text-center">
            <Package className="h-5 w-5 text-primary mx-auto mb-1" />
            <div className="text-lg font-bold">{today?.totalToday || 0}</div>
            <p className="text-[10px] text-muted-foreground">إجمالي العمليات</p>
          </div>
          <div className="p-3 rounded-lg bg-green-500/10 text-center">
            <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400 mx-auto mb-1" />
            <div className="text-lg font-bold">{today?.received || 0}</div>
            <p className="text-[10px] text-muted-foreground">تم استلامها</p>
          </div>
          <div className="p-3 rounded-lg bg-amber-500/10 text-center">
            <Clock className="h-5 w-5 text-amber-600 dark:text-amber-400 mx-auto mb-1" />
            <div className="text-lg font-bold">{today?.pending || 0}</div>
            <p className="text-[10px] text-muted-foreground">قيد الانتظار</p>
          </div>
          <div className="p-3 rounded-lg bg-primary/5 text-center">
            <Scale className="h-5 w-5 text-primary mx-auto mb-1" />
            <div className="text-lg font-bold">{(today?.totalWeight || 0).toLocaleString('ar-EG')}</div>
            <p className="text-[10px] text-muted-foreground">كجم مُعالج</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default DisposalDailySnapshot;
