/**
 * ودجة مهام الموظف اليومية — خاص بالموظفين
 * يعرض ملخص المهام والإنجازات
 */
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ClipboardList, CheckCircle2, Clock, Target, Zap } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

const EmployeeTaskSummary = () => {
  const { profile, organization } = useAuth();

  const { data: tasks } = useQuery({
    queryKey: ['employee-tasks', profile?.id],
    queryFn: async () => {
      if (!profile?.id || !organization?.id) return null;

      // حساب الشحنات التي أنشأها أو تم تعيينه عليها
      const { data: shipments } = await supabase
        .from('shipments')
        .select('status, created_at')
        .or(`created_by.eq.${profile.id}`)
        .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
        .limit(100);

      if (!shipments?.length) return null;

      const total = shipments.length;
      const completed = shipments.filter((s: any) => ['delivered', 'confirmed'].includes(s.status)).length;
      const pending = shipments.filter((s: any) => ['pending', 'draft'].includes(s.status)).length;
      const inProgress = total - completed - pending;
      const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;

      return { total, completed, pending, inProgress, completionRate };
    },
    enabled: !!profile?.id && !!organization?.id,
    staleTime: 1000 * 60 * 5,
  });

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm flex items-center gap-2">
          <ClipboardList className="h-4 w-4 text-primary" />
          ملخص المهام الأسبوعي
          {tasks && (
            <Badge variant="secondary" className="text-[9px] mr-auto">
              {tasks.completionRate}% إنجاز
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {!tasks ? (
          <div className="text-center py-4">
            <Target className="h-8 w-8 text-muted-foreground/40 mx-auto mb-2" />
            <p className="text-xs text-muted-foreground">لا توجد مهام هذا الأسبوع</p>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="p-3 rounded-lg bg-primary/5">
              <div className="flex items-end justify-between mb-2">
                <span className="text-2xl font-bold text-primary">{tasks.completionRate}%</span>
                <span className="text-[10px] text-muted-foreground">معدل الإنجاز</span>
              </div>
              <Progress value={tasks.completionRate} className="h-2" />
            </div>

            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="p-2 rounded-lg bg-green-500/10">
                <CheckCircle2 className="h-3 w-3 text-green-500 mx-auto mb-1" />
                <div className="text-sm font-bold text-green-700 dark:text-green-300">{tasks.completed}</div>
                <p className="text-[9px] text-muted-foreground">مكتمل</p>
              </div>
              <div className="p-2 rounded-lg bg-blue-500/10">
                <Zap className="h-3 w-3 text-blue-500 mx-auto mb-1" />
                <div className="text-sm font-bold text-blue-700 dark:text-blue-300">{tasks.inProgress}</div>
                <p className="text-[9px] text-muted-foreground">جاري</p>
              </div>
              <div className="p-2 rounded-lg bg-amber-500/10">
                <Clock className="h-3 w-3 text-amber-500 mx-auto mb-1" />
                <div className="text-sm font-bold text-amber-700 dark:text-amber-300">{tasks.pending}</div>
                <p className="text-[9px] text-muted-foreground">معلق</p>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default EmployeeTaskSummary;
