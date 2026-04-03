/**
 * ودجة نقاط السلامة للسائق
 * يعرض تقييم سلوك القيادة ومؤشرات السلامة
 */
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Shield, AlertTriangle, CheckCircle2, Zap, Clock, TrendingUp } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

const DriverSafetyScoreWidget = () => {
  const { profile } = useAuth();

  const { data: safety } = useQuery({
    queryKey: ['driver-safety', profile?.id],
    queryFn: async () => {
      if (!profile?.id) return null;
      const { data: shipments } = await supabase
        .from('shipments')
        .select('status, created_at, actual_weight')
        .eq('driver_id', profile.id)
        .gte('created_at', new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString())
        .limit(200);

      if (!shipments?.length) return null;

      const total = shipments.length;
      const delivered = shipments.filter((s: any) => ['delivered', 'confirmed'].includes(s.status)).length;
      const incidents = shipments.filter((s: any) => s.status === 'cancelled').length;

      const safetyScore = Math.min(100, Math.round(((delivered / total) * 85) + (incidents === 0 ? 15 : 0)));

      return {
        score: safetyScore,
        totalTrips: total,
        incidentFree: total - incidents,
        incidents,
        grade: safetyScore >= 90 ? 'A' : safetyScore >= 75 ? 'B' : safetyScore >= 60 ? 'C' : 'D',
      };
    },
    enabled: !!profile?.id,
    staleTime: 1000 * 60 * 10,
  });

  const gradeColors: Record<string, string> = {
    A: 'bg-green-500/10 text-green-700 dark:text-green-300',
    B: 'bg-blue-500/10 text-blue-700 dark:text-blue-300',
    C: 'bg-amber-500/10 text-amber-700 dark:text-amber-300',
    D: 'bg-red-500/10 text-red-700 dark:text-red-300',
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm flex items-center gap-2">
          <Shield className="h-4 w-4 text-primary" />
          نقاط السلامة
          {safety && (
            <Badge className={`text-[9px] mr-auto border-0 ${gradeColors[safety.grade]}`}>
              تقييم {safety.grade}
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {!safety ? (
          <div className="text-center py-4">
            <Shield className="h-8 w-8 text-muted-foreground/40 mx-auto mb-2" />
            <p className="text-xs text-muted-foreground">لا توجد بيانات كافية</p>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="text-center p-3 rounded-lg bg-primary/5">
              <div className="text-3xl font-bold text-primary">{safety.score}</div>
              <p className="text-[10px] text-muted-foreground">من 100 نقطة</p>
              <Progress value={safety.score} className="h-2 mt-2" />
            </div>
            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="p-2 rounded-lg bg-green-500/10">
                <CheckCircle2 className="h-3 w-3 text-green-500 mx-auto mb-1" />
                <div className="text-sm font-bold text-green-700 dark:text-green-300">{safety.incidentFree}</div>
                <p className="text-[9px] text-muted-foreground">بدون حوادث</p>
              </div>
              <div className="p-2 rounded-lg bg-blue-500/10">
                <Zap className="h-3 w-3 text-blue-500 mx-auto mb-1" />
                <div className="text-sm font-bold text-blue-700 dark:text-blue-300">{safety.totalTrips}</div>
                <p className="text-[9px] text-muted-foreground">إجمالي الرحلات</p>
              </div>
              <div className="p-2 rounded-lg bg-amber-500/10">
                <AlertTriangle className="h-3 w-3 text-amber-500 mx-auto mb-1" />
                <div className="text-sm font-bold text-amber-700 dark:text-amber-300">{safety.incidents}</div>
                <p className="text-[9px] text-muted-foreground">حوادث</p>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default DriverSafetyScoreWidget;
