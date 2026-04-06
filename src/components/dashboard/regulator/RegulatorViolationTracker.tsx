import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, Gavel } from 'lucide-react';

const violations = [
  { org: 'شركة الوادي للنقل', type: 'ترخيص منتهي', severity: 'critical', date: '2026-04-01', penalty: '50,000 ج.م', status: 'open' },
  { org: 'شركة الصعيد للنظافة', type: 'تجاوز حمولة', severity: 'high', date: '2026-03-28', penalty: '15,000 ج.م', status: 'open' },
  { org: 'مصنع الدلتا للتدوير', type: 'انبعاثات زائدة', severity: 'medium', date: '2026-03-15', penalty: 'إنذار', status: 'resolved' },
  { org: 'شركة الوادي للنقل', type: 'نقل بدون مانيفست', severity: 'high', date: '2026-03-10', penalty: '25,000 ج.م', status: 'open' },
];

const severityColor = {
  critical: 'bg-destructive/10 text-destructive border-destructive/30',
  high: 'bg-orange-500/10 text-orange-600 border-orange-500/30',
  medium: 'bg-yellow-500/10 text-yellow-600 border-yellow-500/30',
};

const RegulatorViolationTracker = () => (
  <Card>
    <CardHeader className="pb-3">
      <CardTitle className="flex items-center gap-2 text-base">
        <Gavel className="h-5 w-5 text-primary" />
        سجل المخالفات
      </CardTitle>
    </CardHeader>
    <CardContent className="space-y-2">
      {violations.map((v, i) => (
        <div key={i} className="flex items-center justify-between p-2 rounded border">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
            <div>
              <p className="text-sm font-medium">{v.org}</p>
              <p className="text-xs text-muted-foreground">{v.type} • {v.date}</p>
            </div>
          </div>
          <div className="text-left">
            <Badge variant="outline" className={severityColor[v.severity as keyof typeof severityColor]}>
              {v.penalty}
            </Badge>
          </div>
        </div>
      ))}
    </CardContent>
  </Card>
);

export default RegulatorViolationTracker;
