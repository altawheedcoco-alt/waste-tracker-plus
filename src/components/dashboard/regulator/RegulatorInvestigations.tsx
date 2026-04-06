/**
 * نظام التحقيقات والعقوبات
 */
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Scale, FileWarning, AlertOctagon, Clock, Gavel } from 'lucide-react';

const investigations = [
  { entity: 'شركة X للنقل', violation: 'نقل مخلفات خطرة بدون ترخيص', severity: 'critical', status: 'open', date: '2026-04-01' },
  { entity: 'مصنع Y للتدوير', violation: 'تجاوز حد الانبعاثات', severity: 'major', status: 'hearing', date: '2026-03-20' },
  { entity: 'موقع Z للدفن', violation: 'تسرب مياه رشح', severity: 'critical', status: 'penalty_issued', date: '2026-03-05' },
  { entity: 'شركة W المولّدة', violation: 'عدم فصل المخلفات', severity: 'minor', status: 'resolved', date: '2026-02-15' },
];

const severityConfig: Record<string, { label: string; color: string }> = {
  critical: { label: 'حرج', color: 'text-red-600 bg-red-500/10' },
  major: { label: 'جسيم', color: 'text-amber-600 bg-amber-500/10' },
  minor: { label: 'بسيط', color: 'text-blue-600 bg-blue-500/10' },
};

const statusLabels: Record<string, string> = {
  open: 'مفتوح',
  hearing: 'جلسة استماع',
  penalty_issued: 'عقوبة صادرة',
  resolved: 'تم الحل',
};

const RegulatorInvestigations = () => (
  <Card>
    <CardHeader className="pb-3">
      <CardTitle className="text-sm flex items-center gap-2">
        <Scale className="h-4 w-4 text-primary" />
        التحقيقات والعقوبات
        <Badge variant="destructive" className="mr-auto text-[9px]">
          {investigations.filter(i => i.status === 'open').length} مفتوح
        </Badge>
      </CardTitle>
    </CardHeader>
    <CardContent className="space-y-2">
      {investigations.map((inv, i) => {
        const sev = severityConfig[inv.severity];
        return (
          <div key={i} className="p-2 rounded border">
            <div className="flex items-center justify-between mb-1">
              <p className="text-xs font-medium">{inv.entity}</p>
              <Badge className={`text-[9px] border-0 ${sev.color}`}>{sev.label}</Badge>
            </div>
            <p className="text-[10px] text-muted-foreground">{inv.violation}</p>
            <div className="flex items-center justify-between mt-1">
              <span className="text-[10px] text-muted-foreground">{new Date(inv.date).toLocaleDateString('ar-EG')}</span>
              <span className="text-[9px] font-medium">{statusLabels[inv.status]}</span>
            </div>
          </div>
        );
      })}
    </CardContent>
  </Card>
);

export default RegulatorInvestigations;
