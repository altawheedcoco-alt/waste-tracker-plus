import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FileText, Clock, CheckCircle, AlertTriangle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

const licenses = [
  { org: 'شركة النيل للمخلفات', type: 'ترخيص نقل', applied: '2026-03-20', status: 'under_review', days: 17 },
  { org: 'مصنع جديد للتدوير', type: 'ترخيص تدوير', applied: '2026-03-01', status: 'approved', days: 0 },
  { org: 'شركة الفجر للنظافة', type: 'ترخيص نقل خطر', applied: '2026-04-01', status: 'under_review', days: 5 },
  { org: 'مدفن الوادي', type: 'ترخيص تخلص', applied: '2026-02-15', status: 'rejected', days: 0 },
];

const statusCfg = {
  under_review: { label: 'قيد المراجعة', color: 'bg-yellow-500/10 text-yellow-600 border-yellow-500/30' },
  approved: { label: 'معتمد', color: 'bg-green-500/10 text-green-600 border-green-500/30' },
  rejected: { label: 'مرفوض', color: 'bg-destructive/10 text-destructive border-destructive/30' },
};

const RegulatorLicenseApprovals = () => (
  <Card>
    <CardHeader className="pb-3">
      <CardTitle className="flex items-center gap-2 text-base">
        <FileText className="h-5 w-5 text-primary" />
        طلبات التراخيص
      </CardTitle>
    </CardHeader>
    <CardContent className="space-y-2">
      {licenses.map((l, i) => {
        const cfg = statusCfg[l.status as keyof typeof statusCfg];
        return (
          <div key={i} className="flex items-center justify-between p-2 rounded border">
            <div>
              <p className="text-sm font-medium">{l.org}</p>
              <p className="text-xs text-muted-foreground">{l.type} • تقدم: {l.applied}</p>
              {l.status === 'under_review' && (
                <p className="text-xs text-yellow-600 flex items-center gap-1">
                  <Clock className="h-3 w-3" /> منذ {l.days} يوم
                </p>
              )}
            </div>
            <Badge variant="outline" className={cfg.color}>{cfg.label}</Badge>
          </div>
        );
      })}
    </CardContent>
  </Card>
);

export default RegulatorLicenseApprovals;
