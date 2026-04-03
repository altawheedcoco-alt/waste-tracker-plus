/**
 * DisputeResolutionWidget — تتبع النزاعات والشكاوى
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

  const { data: disputes, isLoading } = useQuery({
    queryKey: ['disputes', orgId],
    enabled: !!orgId,
    queryFn: async () => {
      const { data } = await supabase
        .from('disputes')
        .select('status, priority, created_at, resolved_at')
        .or(`raised_by_org.eq.${orgId},against_org.eq.${orgId}`)
        .limit(200);
      return data || [];
    },
  });

  const stats = useMemo(() => {
    if (!disputes) return { total: 0, resolved: 0, pending: 0, resolutionRate: 0, avgDays: 0 };
    const resolved = disputes.filter(d => d.status === 'resolved' || d.status === 'closed');
    const pending = disputes.filter(d => d.status === 'open' || d.status === 'pending');
    let totalDays = 0;
    resolved.forEach(d => {
      if (d.resolved_at) {
        totalDays += (new Date(d.resolved_at).getTime() - new Date(d.created_at).getTime()) / (1000 * 60 * 60 * 24);
      }
    });
    return {
      total: disputes.length,
      resolved: resolved.length,
      pending: pending.length,
      resolutionRate: disputes.length > 0 ? Math.round((resolved.length / disputes.length) * 100) : 0,
      avgDays: resolved.length > 0 ? Math.round(totalDays / resolved.length) : 0,
    };
  }, [disputes]);

  if (isLoading) return <Skeleton className="h-[240px] w-full rounded-xl" />;

  return (
    <Card className="border-border">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-base">
          <MessageSquareWarning className="h-5 w-5 text-primary" />
          النزاعات والشكاوى
        </CardTitle>
      </CardHeader>
      <CardContent>
        {stats.total === 0 ? (
          <div className="text-center py-6">
            <CheckCircle2 className="h-8 w-8 mx-auto text-green-500 mb-2" />
            <p className="text-sm text-muted-foreground">لا توجد نزاعات — أداء ممتاز! 🎉</p>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm">نسبة الحل</span>
              <Badge variant={stats.resolutionRate >= 80 ? 'default' : 'destructive'}>{stats.resolutionRate}%</Badge>
            </div>
            <Progress value={stats.resolutionRate} className="h-2" />
            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="p-2 rounded-lg bg-muted/50">
                <AlertCircle className="h-4 w-4 mx-auto text-orange-500 mb-1" />
                <div className="text-lg font-bold">{stats.pending}</div>
                <div className="text-[10px] text-muted-foreground">معلقة</div>
              </div>
              <div className="p-2 rounded-lg bg-muted/50">
                <CheckCircle2 className="h-4 w-4 mx-auto text-green-500 mb-1" />
                <div className="text-lg font-bold">{stats.resolved}</div>
                <div className="text-[10px] text-muted-foreground">محلولة</div>
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
