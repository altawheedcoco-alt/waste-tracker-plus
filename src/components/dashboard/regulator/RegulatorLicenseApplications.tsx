/**
 * إدارة طلبات التراخيص
 */
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { FileKey, Clock, CheckCircle2, XCircle, AlertTriangle } from 'lucide-react';

const applications = [
  { entity: 'شركة النظافة العامة', type: 'ترخيص نقل مخلفات خطرة', submittedAt: '2026-03-28', status: 'pending', daysWaiting: 9 },
  { entity: 'مصنع إعادة تدوير الورق', type: 'تجديد ترخيص تدوير', submittedAt: '2026-04-01', status: 'review', daysWaiting: 5 },
  { entity: 'شركة المعالجة الكيميائية', type: 'ترخيص معالجة جديد', submittedAt: '2026-03-15', status: 'documents_needed', daysWaiting: 22 },
  { entity: 'منشأة الدفن الآمن', type: 'تمديد ترخيص تشغيل', submittedAt: '2026-04-03', status: 'approved', daysWaiting: 3 },
];

const statusMap: Record<string, { label: string; color: string; icon: typeof Clock }> = {
  pending: { label: 'قيد الانتظار', color: 'text-amber-600', icon: Clock },
  review: { label: 'قيد المراجعة', color: 'text-blue-600', icon: AlertTriangle },
  documents_needed: { label: 'مستندات ناقصة', color: 'text-red-600', icon: XCircle },
  approved: { label: 'تمت الموافقة', color: 'text-green-600', icon: CheckCircle2 },
};

const RegulatorLicenseApplications = () => (
  <Card>
    <CardHeader className="pb-3">
      <CardTitle className="text-sm flex items-center gap-2">
        <FileKey className="h-4 w-4 text-primary" />
        طلبات التراخيص
        <Badge variant="destructive" className="mr-auto text-[9px]">
          {applications.filter(a => a.status === 'pending' || a.status === 'documents_needed').length} بانتظار إجراء
        </Badge>
      </CardTitle>
    </CardHeader>
    <CardContent className="space-y-2">
      {applications.map((a, i) => {
        const s = statusMap[a.status];
        const Icon = s.icon;
        return (
          <div key={i} className="p-2 rounded border">
            <div className="flex items-center justify-between mb-1">
              <p className="text-xs font-medium">{a.entity}</p>
              <div className={`flex items-center gap-1 text-[9px] ${s.color}`}>
                <Icon className="h-3 w-3" />
                {s.label}
              </div>
            </div>
            <p className="text-[10px] text-muted-foreground">{a.type}</p>
            <p className="text-[10px] text-muted-foreground">منذ {a.daysWaiting} يوم</p>
          </div>
        );
      })}
    </CardContent>
  </Card>
);

export default RegulatorLicenseApplications;
