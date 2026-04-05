/**
 * سجل المخالفات والجزاءات التراكمي - فكرة #7
 */
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertOctagon, FileWarning, CheckCircle } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Skeleton } from '@/components/ui/skeleton';

export default function ViolationRegistry() {
  const { organization } = useAuth();
  const orgId = organization?.id;

  const { data: violations, isLoading } = useQuery({
    queryKey: ['violation-registry', orgId],
    enabled: !!orgId,
    queryFn: async () => {
      const { data } = await supabase
        .from('compliance_violations' as any)
        .select('id, violation_type, severity, status, description, created_at, penalty_amount')
        .eq('organization_id', orgId!)
        .order('created_at', { ascending: false })
        .limit(10);
      return data || [];
    },
  });

  if (isLoading) return <Skeleton className="h-[200px] w-full rounded-xl" />;

  const total = violations?.length || 0;
  const resolved = violations?.filter(v => v.status === 'resolved').length || 0;
  const totalPenalty = violations?.reduce((s, v) => s + (v.penalty_amount || 0), 0) || 0;

  return (
    <Card className="border-border">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-base">
          <FileWarning className="h-5 w-5 text-primary" />
          سجل المخالفات
        </CardTitle>
      </CardHeader>
      <CardContent>
        {total === 0 ? (
          <div className="text-center py-6">
            <CheckCircle className="h-10 w-10 text-emerald-500 mx-auto mb-2" />
            <p className="text-sm font-medium text-emerald-600">سجل نظيف</p>
            <p className="text-[10px] text-muted-foreground">لا توجد مخالفات مسجلة</p>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="p-2 rounded-lg bg-destructive/10">
                <div className="text-lg font-bold text-destructive">{total}</div>
                <div className="text-[9px] text-muted-foreground">إجمالي</div>
              </div>
              <div className="p-2 rounded-lg bg-emerald-500/10">
                <div className="text-lg font-bold text-emerald-600">{resolved}</div>
                <div className="text-[9px] text-muted-foreground">تم حلها</div>
              </div>
              <div className="p-2 rounded-lg bg-amber-500/10">
                <div className="text-lg font-bold text-amber-600">{totalPenalty.toLocaleString('ar-EG')}</div>
                <div className="text-[9px] text-muted-foreground">ج.م غرامات</div>
              </div>
            </div>

            {violations?.slice(0, 3).map(v => (
              <div key={v.id} className="flex items-center justify-between p-2 rounded-lg border border-border text-xs">
                <div className="flex items-center gap-2">
                  <AlertOctagon className={`h-3.5 w-3.5 ${v.severity === 'high' ? 'text-destructive' : 'text-amber-500'}`} />
                  <span className="truncate max-w-[150px]">{v.description || v.violation_type}</span>
                </div>
                <Badge variant={v.status === 'resolved' ? 'default' : 'destructive'} className="text-[8px]">
                  {v.status === 'resolved' ? 'محلول' : 'مفتوح'}
                </Badge>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
