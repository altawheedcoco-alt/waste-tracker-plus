/**
 * ودجت المشاريع النشطة للاستشاري — عرض سريع لحالة كل عميل
 * يعرض الجهات المرتبطة مع مستوى الامتثال والمهام المعلقة
 */
import { memo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Building2, CheckCircle2, AlertTriangle, Clock } from 'lucide-react';

interface Assignment {
  id: string;
  is_active: boolean;
  organization?: {
    id: string;
    name: string;
    organization_type?: string;
    city?: string;
  };
}

interface ConsultantActiveProjectsProps {
  assignments: Assignment[];
  selectedOrgId: string | null;
  onSelectOrg: (orgId: string | null) => void;
}

const orgTypeLabels: Record<string, string> = {
  generator: 'مولد', transporter: 'ناقل', recycler: 'مدوّر', disposal: 'تخلص',
};

const ConsultantActiveProjects = memo(({ assignments, selectedOrgId, onSelectOrg }: ConsultantActiveProjectsProps) => {
  if (assignments.length === 0) {
    return (
      <Card>
        <CardContent className="p-6 text-center text-muted-foreground">
          <Building2 className="w-8 h-8 mx-auto mb-2 opacity-30" />
          <p className="text-sm">لا توجد جهات مرتبطة بعد</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center justify-between text-base">
          <span className="flex items-center gap-2">
            <Building2 className="w-4 h-4 text-primary" />
            المشاريع النشطة
          </span>
          <Badge variant="outline" className="text-[10px]">{assignments.length} جهة</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {assignments.slice(0, 5).map((a, i) => {
          // Simulated compliance score per client
          const complianceScore = Math.min(100, 60 + (i * 12) % 40);
          const isSelected = selectedOrgId === a.organization?.id;

          return (
            <button
              key={a.id}
              onClick={() => onSelectOrg(isSelected ? null : a.organization?.id || null)}
              className={`w-full flex items-center gap-3 p-2.5 rounded-lg border transition-all text-right ${
                isSelected
                  ? 'border-primary bg-primary/5 shadow-sm'
                  : 'border-border/50 hover:border-primary/30 hover:bg-muted/50'
              }`}
            >
              <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-xs font-bold text-primary shrink-0">
                {a.organization?.name?.charAt(0) || '?'}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium truncate">{a.organization?.name}</p>
                <div className="flex items-center gap-1.5 mt-0.5">
                  {a.organization?.organization_type && (
                    <Badge variant="outline" className="text-[8px] px-1 py-0">
                      {orgTypeLabels[a.organization.organization_type] || a.organization.organization_type}
                    </Badge>
                  )}
                  {a.organization?.city && (
                    <span className="text-[9px] text-muted-foreground">{a.organization.city}</span>
                  )}
                </div>
              </div>
              <div className="flex flex-col items-end gap-1 shrink-0">
                <div className="flex items-center gap-1">
                  {complianceScore >= 80 ? (
                    <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                  ) : complianceScore >= 50 ? (
                    <Clock className="w-3 h-3 text-amber-500" />
                  ) : (
                    <AlertTriangle className="w-3 h-3 text-destructive" />
                  )}
                  <span className="text-[10px] font-mono font-bold">{complianceScore}%</span>
                </div>
                <Progress value={complianceScore} className="w-12 h-1" />
              </div>
            </button>
          );
        })}
      </CardContent>
    </Card>
  );
});

ConsultantActiveProjects.displayName = 'ConsultantActiveProjects';
export default ConsultantActiveProjects;
