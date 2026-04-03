/**
 * ودجة تقويم المراجعات — خاص بجهات ISO
 * يعرض جدول المراجعات القادمة والمكتملة
 */
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar, CheckCircle2, Clock, AlertTriangle, Building2 } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

const AuditCalendarWidget = () => {
  const { profile, organization } = useAuth();

  const { data: audits } = useQuery({
    queryKey: ['iso-audit-calendar', organization?.id],
    queryFn: async () => {
      if (!organization?.id || !profile?.id) return null;
      const { data } = await supabase
        .from('audit_sessions')
        .select('id, status, created_at, overall_score, organization:organizations!audit_sessions_organization_id_fkey(name)')
        .or(`created_by.eq.${profile.id},auditor_organization.eq.${organization.name}`)
        .order('created_at', { ascending: false })
        .limit(10);

      if (!data?.length) return null;

      const completed = data.filter((a: any) => a.status === 'completed').length;
      const inProgress = data.filter((a: any) => a.status === 'in_progress').length;
      const pending = data.filter((a: any) => a.status === 'draft' || a.status === 'pending').length;
      const avgScore = data
        .filter((a: any) => a.overall_score)
        .reduce((sum: number, a: any) => sum + Number(a.overall_score), 0) / (completed || 1);

      return {
        total: data.length,
        completed,
        inProgress,
        pending,
        avgScore: Math.round(avgScore),
        recent: data.slice(0, 5).map((a: any) => ({
          id: a.id,
          orgName: a.organization?.name || 'غير محدد',
          status: a.status,
          score: a.overall_score,
          date: new Date(a.created_at).toLocaleDateString('ar-EG'),
        })),
      };
    },
    enabled: !!organization?.id && !!profile?.id,
    staleTime: 1000 * 60 * 5,
  });

  const statusConfig: Record<string, { icon: React.ReactNode; label: string; color: string }> = {
    completed: { icon: <CheckCircle2 className="h-3 w-3 text-green-500" />, label: 'مكتمل', color: 'bg-green-500/10 text-green-700 dark:text-green-300' },
    in_progress: { icon: <Clock className="h-3 w-3 text-blue-500" />, label: 'جاري', color: 'bg-blue-500/10 text-blue-700 dark:text-blue-300' },
    draft: { icon: <AlertTriangle className="h-3 w-3 text-amber-500" />, label: 'مسودة', color: 'bg-amber-500/10 text-amber-700 dark:text-amber-300' },
    pending: { icon: <Clock className="h-3 w-3 text-amber-500" />, label: 'معلق', color: 'bg-amber-500/10 text-amber-700 dark:text-amber-300' },
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm flex items-center gap-2">
          <Calendar className="h-4 w-4 text-primary" />
          تقويم المراجعات
          {audits && (
            <Badge variant="secondary" className="text-[9px] mr-auto">
              متوسط التقييم: {audits.avgScore}%
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {!audits ? (
          <div className="text-center py-4">
            <Calendar className="h-8 w-8 text-muted-foreground/40 mx-auto mb-2" />
            <p className="text-xs text-muted-foreground">لا توجد مراجعات حالية</p>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="p-2 rounded-lg bg-green-500/10">
                <div className="text-lg font-bold text-green-700 dark:text-green-300">{audits.completed}</div>
                <p className="text-[9px] text-muted-foreground">مكتمل</p>
              </div>
              <div className="p-2 rounded-lg bg-blue-500/10">
                <div className="text-lg font-bold text-blue-700 dark:text-blue-300">{audits.inProgress}</div>
                <p className="text-[9px] text-muted-foreground">جاري</p>
              </div>
              <div className="p-2 rounded-lg bg-amber-500/10">
                <div className="text-lg font-bold text-amber-700 dark:text-amber-300">{audits.pending}</div>
                <p className="text-[9px] text-muted-foreground">معلق</p>
              </div>
            </div>

            <div className="space-y-1.5">
              <p className="text-[10px] text-muted-foreground font-medium">آخر المراجعات</p>
              {audits.recent.map((a) => {
                const config = statusConfig[a.status] || statusConfig.draft;
                return (
                  <div key={a.id} className="flex items-center gap-2 p-1.5 rounded bg-muted/20">
                    {config.icon}
                    <div className="flex-1 min-w-0">
                      <span className="text-[10px] font-medium truncate block">{a.orgName}</span>
                      <span className="text-[9px] text-muted-foreground">{a.date}</span>
                    </div>
                    {a.score && (
                      <Badge variant="outline" className={`text-[8px] border-0 ${config.color}`}>
                        {a.score}%
                      </Badge>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default AuditCalendarWidget;
