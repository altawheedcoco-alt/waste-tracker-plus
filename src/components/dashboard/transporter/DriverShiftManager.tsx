/**
 * جدول المناوبات الذكي - فكرة #33
 */
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Clock, AlertTriangle } from 'lucide-react';
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
        .from('drivers')
        .select('id, is_available, license_number')
        .eq('organization_id', orgId!)
        .order('created_at', { ascending: false });
      return (data || []) as any[];
    },
  });

  const summary = useMemo(() => {
    const d = drivers || [];
    return {
      available: d.filter((x: any) => x.is_available).length,
      unavailable: d.filter((x: any) => !x.is_available).length,
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
        <div className="grid grid-cols-2 gap-2 mb-3">
          <div className="text-center p-2 rounded-lg bg-emerald-500/10">
            <div className="text-lg font-bold text-emerald-600">{summary.available}</div>
            <div className="text-[9px] text-muted-foreground">متاح</div>
          </div>
          <div className="text-center p-2 rounded-lg bg-muted/50">
            <div className="text-lg font-bold">{summary.unavailable}</div>
            <div className="text-[9px] text-muted-foreground">غير متاح</div>
          </div>
        </div>

        {summary.total === 0 && (
          <p className="text-sm text-muted-foreground text-center py-4">لا يوجد سائقون مسجلون</p>
        )}
      </CardContent>
    </Card>
  );
}