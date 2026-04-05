/**
 * لوحة الشحنات المعلقة والمتأخرة - فكرة #53
 */
import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Clock, AlertTriangle, Package, CheckCircle } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Skeleton } from '@/components/ui/skeleton';

export default function PendingDelayedShipments() {
  const { organization } = useAuth();
  const orgId = organization?.id;

  const { data: shipments, isLoading } = useQuery({
    queryKey: ['pending-delayed', orgId],
    enabled: !!orgId,
    queryFn: async () => {
      const { data } = await supabase
        .from('shipments')
        .select('id, tracking_number, status, created_at, scheduled_date, waste_type')
        .eq('transporter_id', orgId!)
        .in('status', ['new', 'approved', 'collecting', 'in_transit'])
        .order('created_at', { ascending: true })
        .limit(20);
      return (data || []) as any[];
    },
  });

  const categorized = useMemo(() => {
    const now = new Date();
    const delayed: any[] = [];
    const pending: any[] = [];

    (shipments || []).forEach((s: any) => {
      const created = new Date(s.created_at);
      const hoursSince = (now.getTime() - created.getTime()) / (1000 * 60 * 60);
      const scheduled = s.scheduled_date ? new Date(s.scheduled_date) : null;

      if ((scheduled && scheduled < now) || hoursSince > 48) {
        delayed.push(s);
      } else {
        pending.push(s);
      }
    });

    return { delayed, pending };
  }, [shipments]);

  if (isLoading) return <Skeleton className="h-[200px] w-full rounded-xl" />;

  const total = (shipments || []).length;

  return (
    <Card className="border-border">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-base">
            <Package className="h-5 w-5 text-primary" />
            الشحنات النشطة
          </CardTitle>
          <Badge variant="outline" className="text-[10px]">{total}</Badge>
        </div>
      </CardHeader>
      <CardContent>
        {total === 0 ? (
          <div className="text-center py-6">
            <CheckCircle className="h-8 w-8 text-emerald-500 mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">لا توجد شحنات معلقة</p>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-2">
              <div className="text-center p-2 rounded-lg bg-destructive/10">
                <AlertTriangle className="h-4 w-4 text-destructive mx-auto mb-1" />
                <div className="text-lg font-bold text-destructive">{categorized.delayed.length}</div>
                <div className="text-[9px] text-muted-foreground">متأخرة</div>
              </div>
              <div className="text-center p-2 rounded-lg bg-amber-500/10">
                <Clock className="h-4 w-4 text-amber-500 mx-auto mb-1" />
                <div className="text-lg font-bold text-amber-600">{categorized.pending.length}</div>
                <div className="text-[9px] text-muted-foreground">قيد التنفيذ</div>
              </div>
            </div>

            {categorized.delayed.length > 0 && (
              <div className="space-y-1">
                <p className="text-[10px] font-medium text-destructive">⚠️ شحنات متأخرة:</p>
                {categorized.delayed.slice(0, 3).map((s: any) => (
                  <div key={s.id} className="flex justify-between items-center p-1.5 rounded bg-destructive/5 text-[10px]">
                    <span className="truncate">{s.tracking_number || 'شحنة'}</span>
                    <Badge variant="destructive" className="text-[8px]">{s.status}</Badge>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}