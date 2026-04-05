/**
 * جدول المناوبات الذكي - فكرة #33
 */
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Clock, User, AlertTriangle, CheckCircle } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Skeleton } from '@/components/ui/skeleton';
import { useMemo } from 'react';

export default function DriverShiftManager() {
  const { organization } = useAuth();
  const orgId = organization?.id;

  const { data: drivers, isLoading } = useQuery({
    queryKey: ['driver-shifts-mgr', orgId],
    enabled: !!orgId,
    queryFn: async () => {
      const { data } = await supabase
        .from('drivers' as any)
        .select('id, full_name, is_active, current_status, shift_start, shift_end, total_hours_today')
        .eq('organization_id', orgId!)
        .eq('is_active', true)
        .order('full_name');
      return data || [];
    },
  });

  const summary = useMemo(() => {
    const d = drivers || [];
    return {
      onDuty: d.filter(x => x.current_status === 'on_duty' || x.current_status === 'driving').length,
      offDuty: d.filter(x => x.current_status === 'off_duty' || !x.current_status).length,
      overHours: d.filter(x => (x.total_hours_today || 0) > 10).length,
      total: d.length,
    };
  }, [drivers]);

  if (isLoading) return <Skeleton className="h-[200px] w-full rounded-xl" />;

  return (
    <Card className="border-border">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-base">
          <Clock className="h-5 w-5 text-primary" />
          مناوبات السائقين
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-3 gap-2 mb-3">
          <div className="text-center p-2 rounded-lg bg-emerald-500/10">
            <div className="text-lg font-bold text-emerald-600">{summary.onDuty}</div>
            <div className="text-[9px] text-muted-foreground">في الخدمة</div>
          </div>
          <div className="text-center p-2 rounded-lg bg-muted/50">
            <div className="text-lg font-bold">{summary.offDuty}</div>
            <div className="text-[9px] text-muted-foreground">خارج الخدمة</div>
          </div>
          <div className="text-center p-2 rounded-lg bg-destructive/10">
            <div className="text-lg font-bold text-destructive">{summary.overHours}</div>
            <div className="text-[9px] text-muted-foreground">تجاوز الحد</div>
          </div>
        </div>

        {summary.overHours > 0 && (
          <div className="p-2 rounded-lg bg-destructive/5 border border-destructive/20 flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-destructive shrink-0" />
            <span className="text-[11px] text-destructive">
              {summary.overHours} سائق تجاوز 10 ساعات قيادة (الحد القانوني)
            </span>
          </div>
        )}

        {summary.total === 0 && (
          <p className="text-sm text-muted-foreground text-center py-4">لا يوجد سائقون نشطون</p>
        )}
      </CardContent>
    </Card>
  );
}
