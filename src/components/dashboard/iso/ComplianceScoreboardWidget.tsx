/**
 * ودجة لوحة نتائج الامتثال — خاص بجهة ISO
 * يعرض تقييم المنشآت المدققة ومعدلات الامتثال
 */
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Award, Building2, CheckCircle2, AlertTriangle, TrendingUp } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

const ComplianceScoreboardWidget = () => {
  const { profile } = useAuth();

  const { data: scoreboard } = useQuery({
    queryKey: ['iso-compliance-scoreboard', profile?.id],
    queryFn: async () => {
      if (!profile?.id) return null;
      const { data: audits } = await supabase
        .from('audit_sessions')
        .select('id, status, overall_score, organization_id')
        .eq('created_by', profile.id)
        .limit(100);

      if (!audits?.length) return null;

      const completed = audits.filter((a: any) => a.status === 'completed');
      const scores = completed.map((a: any) => Number(a.overall_score) || 0).filter(s => s > 0);
      const avgScore = scores.length ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0;
      const highCompliance = scores.filter(s => s >= 80).length;
      const needsImprovement = scores.filter(s => s < 60).length;
      const uniqueOrgs = new Set(audits.map((a: any) => a.organization_id)).size;

      return {
        totalAudits: audits.length,
        completedAudits: completed.length,
        avgScore,
        highCompliance,
        needsImprovement,
        uniqueOrgs,
      };
    },
    enabled: !!profile?.id,
    staleTime: 1000 * 60 * 10,
  });

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm flex items-center gap-2">
          <Award className="h-4 w-4 text-primary" />
          لوحة نتائج الامتثال
          {scoreboard && (
            <Badge variant="outline" className="text-[9px] mr-auto border-0 bg-primary/10 text-primary">
              {scoreboard.uniqueOrgs} منشأة
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {!scoreboard ? (
          <div className="text-center py-4">
            <Award className="h-8 w-8 text-muted-foreground/40 mx-auto mb-2" />
            <p className="text-xs text-muted-foreground">لا توجد بيانات تدقيق</p>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="text-center p-3 rounded-lg bg-primary/5">
              <div className="text-2xl font-bold text-primary">{scoreboard.avgScore}%</div>
              <p className="text-[10px] text-muted-foreground">متوسط نتائج الامتثال</p>
              <Progress value={scoreboard.avgScore} className="h-2 mt-2" />
            </div>
            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="p-2 rounded-lg bg-green-500/10">
                <CheckCircle2 className="h-3 w-3 text-green-500 mx-auto mb-1" />
                <div className="text-sm font-bold text-green-700 dark:text-green-300">{scoreboard.highCompliance}</div>
                <p className="text-[9px] text-muted-foreground">ممتاز</p>
              </div>
              <div className="p-2 rounded-lg bg-amber-500/10">
                <AlertTriangle className="h-3 w-3 text-amber-500 mx-auto mb-1" />
                <div className="text-sm font-bold text-amber-700 dark:text-amber-300">{scoreboard.needsImprovement}</div>
                <p className="text-[9px] text-muted-foreground">يحتاج تحسين</p>
              </div>
              <div className="p-2 rounded-lg bg-blue-500/10">
                <Building2 className="h-3 w-3 text-blue-500 mx-auto mb-1" />
                <div className="text-sm font-bold text-blue-700 dark:text-blue-300">{scoreboard.completedAudits}</div>
                <p className="text-[9px] text-muted-foreground">تدقيق مكتمل</p>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ComplianceScoreboardWidget;
