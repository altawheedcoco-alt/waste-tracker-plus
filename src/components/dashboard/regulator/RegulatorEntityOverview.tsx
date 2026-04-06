import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Building, Shield, AlertTriangle, CheckCircle, XCircle } from 'lucide-react';

const orgs = [
  { name: 'شركة النيل للمخلفات', type: 'ناقل', license: 'ساري', compliance: 95, violations: 0, status: 'compliant' },
  { name: 'مصنع الدلتا للتدوير', type: 'مدوّر', license: 'ساري', compliance: 88, violations: 1, status: 'compliant' },
  { name: 'شركة الصعيد للنظافة', type: 'ناقل', license: 'قارب', compliance: 62, violations: 3, status: 'warning' },
  { name: 'مصنع الحديد المصري', type: 'مولد', license: 'ساري', compliance: 91, violations: 0, status: 'compliant' },
  { name: 'شركة الوادي للنقل', type: 'ناقل', license: 'منتهي', compliance: 35, violations: 7, status: 'violation' },
];

const statusCfg = {
  compliant: { label: 'ممتثل', color: 'bg-green-500/10 text-green-600 border-green-500/30', icon: CheckCircle },
  warning: { label: 'تحذير', color: 'bg-yellow-500/10 text-yellow-600 border-yellow-500/30', icon: AlertTriangle },
  violation: { label: 'مخالف', color: 'bg-destructive/10 text-destructive border-destructive/30', icon: XCircle },
};

const RegulatorEntityOverview = () => (
  <Card>
    <CardHeader className="pb-3">
      <CardTitle className="flex items-center gap-2 text-base">
        <Building className="h-5 w-5 text-primary" />
        نظرة عامة على الجهات المسجلة
      </CardTitle>
    </CardHeader>
    <CardContent className="space-y-2">
      {orgs.map((o, i) => {
        const cfg = statusCfg[o.status as keyof typeof statusCfg];
        const Icon = cfg.icon;
        return (
          <div key={i} className="flex items-center justify-between p-3 rounded-lg border">
            <div className="flex items-center gap-2">
              <Icon className="h-4 w-4" />
              <div>
                <p className="text-sm font-medium">{o.name}</p>
                <p className="text-xs text-muted-foreground">{o.type} • ترخيص: {o.license} • مخالفات: {o.violations}</p>
              </div>
            </div>
            <div className="text-left">
              <Badge variant="outline" className={cfg.color}>{cfg.label}</Badge>
              <p className="text-xs text-muted-foreground mt-1">{o.compliance}%</p>
            </div>
          </div>
        );
      })}
    </CardContent>
  </Card>
);

export default RegulatorEntityOverview;
