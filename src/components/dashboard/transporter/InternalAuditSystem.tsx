import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { ClipboardList, Camera, CheckCircle2, Clock, Plus } from 'lucide-react';

const audits = [
  { area: 'سلامة المركبات', completion: 100, lastAudit: '2026-03-25', findings: 0, status: 'passed' as const },
  { area: 'مستندات السائقين', completion: 85, lastAudit: '2026-03-20', findings: 2, status: 'in_progress' as const },
  { area: 'تخزين المخلفات المؤقت', completion: 60, lastAudit: '2026-03-10', findings: 3, status: 'in_progress' as const },
  { area: 'معدات الطوارئ', completion: 100, lastAudit: '2026-03-28', findings: 0, status: 'passed' as const },
  { area: 'النظافة والتعقيم', completion: 40, lastAudit: '2026-02-15', findings: 5, status: 'overdue' as const },
];

const statusConfig = {
  passed: { label: 'مجتاز', color: 'bg-green-100 text-green-800' },
  in_progress: { label: 'جاري', color: 'bg-blue-100 text-blue-800' },
  overdue: { label: 'متأخر', color: 'bg-red-100 text-red-800' },
};

export default function InternalAuditSystem() {
  const avgCompletion = Math.round(audits.reduce((s, a) => s + a.completion, 0) / audits.length);

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-base">
            <ClipboardList className="w-5 h-5 text-primary" />
            نظام التدقيق الداخلي
          </CardTitle>
          <Button size="sm" variant="outline" className="gap-1 h-7"><Plus className="w-3 h-3" /> فحص جديد</Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center gap-3">
          <Progress value={avgCompletion} className="flex-1" />
          <span className="text-sm font-bold">{avgCompletion}%</span>
        </div>

        <div className="space-y-2">
          {audits.map((audit, i) => {
            const config = statusConfig[audit.status];
            return (
              <div key={i} className="p-2.5 rounded-lg border">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium">{audit.area}</span>
                  <Badge variant="outline" className={`text-[10px] ${config.color}`}>{config.label}</Badge>
                </div>
                <Progress value={audit.completion} className="h-1.5 mb-1" />
                <div className="flex items-center justify-between text-[10px] text-muted-foreground">
                  <span>آخر تدقيق: {audit.lastAudit}</span>
                  <span>{audit.findings > 0 ? `${audit.findings} ملاحظات` : 'بدون ملاحظات ✓'}</span>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
