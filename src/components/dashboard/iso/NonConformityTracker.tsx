/**
 * ودجة متتبع عدم المطابقة — خاص بجهة ISO
 * يتتبع حالات عدم المطابقة المكتشفة أثناء التدقيق
 */
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { FileX2, AlertOctagon, Clock, CheckCircle2, BarChart3 } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

const NonConformityTracker = () => {
  const { profile } = useAuth();

  const { data: ncData } = useQuery({
    queryKey: ['iso-nc-tracker', profile?.id],
    queryFn: async () => {
      if (!profile?.id) return null;
      const { data: audits } = await supabase
        .from('audit_sessions')
        .select('id, status, overall_score, findings, organization:organizations!audit_sessions_organization_id_fkey(name)')
        .eq('created_by', profile.id)
        .order('created_at', { ascending: false })
        .limit(50);

      if (!audits?.length) return null;

      // تحليل عدم المطابقات من نتائج التدقيق
      let totalFindings = 0;
      let critical = 0;
      let minor = 0;
      let resolved = 0;

      audits.forEach((audit: any) => {
        if (audit.findings && typeof audit.findings === 'object') {
          const f = audit.findings as any;
          totalFindings += Number(f.total || 0);
          critical += Number(f.critical || f.major || 0);
          minor += Number(f.minor || 0);
          resolved += Number(f.resolved || f.closed || 0);
        }
      });

      // إذا لم توجد بيانات findings مهيكلة، نستخدم تقديرات من الدرجات
      if (totalFindings === 0) {
        const lowScoreAudits = audits.filter((a: any) => Number(a.overall_score) < 70);
        critical = lowScoreAudits.length;
        minor = audits.filter((a: any) => {
          const s = Number(a.overall_score);
          return s >= 70 && s < 85;
        }).length;
        resolved = audits.filter((a: any) => a.status === 'completed' && Number(a.overall_score) >= 85).length;
        totalFindings = critical + minor;
      }

      return {
        totalFindings,
        critical,
        minor,
        resolved,
        pendingResolution: totalFindings - resolved,
        resolutionRate: totalFindings > 0 ? Math.round((resolved / totalFindings) * 100) : 100,
      };
    },
    enabled: !!profile?.id,
    staleTime: 1000 * 60 * 10,
  });

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm flex items-center gap-2">
          <FileX2 className="h-4 w-4 text-primary" />
          متتبع عدم المطابقة
          {ncData && ncData.pendingResolution > 0 && (
            <Badge variant="destructive" className="text-[9px] mr-auto">
              {ncData.pendingResolution} مفتوح
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {!ncData ? (
          <div className="text-center py-4">
            <FileX2 className="h-8 w-8 text-muted-foreground/40 mx-auto mb-2" />
            <p className="text-xs text-muted-foreground">لا توجد بيانات تدقيق</p>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-2">
              <div className="p-2 rounded-lg bg-red-500/10 text-center">
                <AlertOctagon className="h-4 w-4 text-destructive mx-auto mb-1" />
                <div className="text-lg font-bold text-red-700 dark:text-red-300">{ncData.critical}</div>
                <p className="text-[9px] text-muted-foreground">جسيمة</p>
              </div>
              <div className="p-2 rounded-lg bg-amber-500/10 text-center">
                <Clock className="h-4 w-4 text-amber-500 mx-auto mb-1" />
                <div className="text-lg font-bold text-amber-700 dark:text-amber-300">{ncData.minor}</div>
                <p className="text-[9px] text-muted-foreground">بسيطة</p>
              </div>
            </div>
            <div className="p-2 rounded-lg bg-green-500/5 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-500" />
                <span className="text-xs">معدل المعالجة</span>
              </div>
              <span className="text-sm font-bold text-green-700 dark:text-green-300">{ncData.resolutionRate}%</span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default NonConformityTracker;
