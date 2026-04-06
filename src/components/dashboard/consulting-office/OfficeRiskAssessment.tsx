/**
 * تقييم المخاطر للمكتب الاستشاري
 */
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ShieldAlert, AlertTriangle, AlertOctagon, Info } from 'lucide-react';

const risks = [
  { title: 'تأخر تجديد اعتماد WMRA', severity: 'high', impact: 'إيقاف المشاريع الحكومية', action: 'تقديم طلب فوري' },
  { title: 'ضغط عمل مرتفع على م. خالد', severity: 'medium', impact: 'تأخر مراجعات', action: 'إعادة توزيع المشاريع' },
  { title: 'عميل متأخر في الدفع (60 يوم)', severity: 'medium', impact: 'سيولة نقدية', action: 'إرسال إنذار رسمي' },
  { title: 'انتهاء شهادة ISO قريباً', severity: 'low', impact: 'فقدان ميزة تنافسية', action: 'بدء إجراءات التجديد' },
];

const severityConfig: Record<string, { color: string; icon: typeof AlertTriangle }> = {
  high: { color: 'text-red-600 bg-red-500/10', icon: AlertOctagon },
  medium: { color: 'text-amber-600 bg-amber-500/10', icon: AlertTriangle },
  low: { color: 'text-blue-600 bg-blue-500/10', icon: Info },
};

const OfficeRiskAssessment = () => (
  <Card>
    <CardHeader className="pb-3">
      <CardTitle className="text-sm flex items-center gap-2">
        <ShieldAlert className="h-4 w-4 text-primary" />
        تقييم المخاطر
        <Badge variant="destructive" className="mr-auto text-[9px]">
          {risks.filter(r => r.severity === 'high').length} حرج
        </Badge>
      </CardTitle>
    </CardHeader>
    <CardContent className="space-y-2">
      {risks.map((r, i) => {
        const cfg = severityConfig[r.severity];
        const Icon = cfg.icon;
        return (
          <div key={i} className={`p-2 rounded-lg ${cfg.color.split(' ')[1]}`}>
            <div className="flex items-start gap-2">
              <Icon className={`h-4 w-4 ${cfg.color.split(' ')[0]} shrink-0 mt-0.5`} />
              <div>
                <p className="text-xs font-medium">{r.title}</p>
                <p className="text-[10px] text-muted-foreground">الأثر: {r.impact}</p>
                <p className="text-[10px] font-medium text-primary mt-0.5">→ {r.action}</p>
              </div>
            </div>
          </div>
        );
      })}
    </CardContent>
  </Card>
);

export default OfficeRiskAssessment;
