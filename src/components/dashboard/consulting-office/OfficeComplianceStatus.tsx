/**
 * حالة امتثال المكتب الاستشاري
 */
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ShieldCheck, AlertTriangle, CheckCircle2, Clock, FileWarning } from 'lucide-react';

const licenses = [
  { name: 'ترخيص مزاولة الاستشارات البيئية', status: 'valid', expiry: '2027-03-15' },
  { name: 'اعتماد جهاز شؤون البيئة (EEAA)', status: 'valid', expiry: '2026-12-01' },
  { name: 'شهادة ISO 14001', status: 'expiring', expiry: '2026-05-20' },
  { name: 'تأمين المسؤولية المهنية', status: 'valid', expiry: '2027-01-10' },
  { name: 'اعتماد WMRA', status: 'expired', expiry: '2026-03-01' },
];

const statusStyles: Record<string, { label: string; icon: typeof CheckCircle2; color: string }> = {
  valid: { label: 'ساري', icon: CheckCircle2, color: 'text-green-600' },
  expiring: { label: 'قارب الانتهاء', icon: Clock, color: 'text-amber-600' },
  expired: { label: 'منتهي', icon: FileWarning, color: 'text-red-600' },
};

const OfficeComplianceStatus = () => (
  <Card>
    <CardHeader className="pb-3">
      <CardTitle className="text-sm flex items-center gap-2">
        <ShieldCheck className="h-4 w-4 text-primary" />
        الامتثال والتراخيص
        <Badge variant={licenses.some(l => l.status === 'expired') ? 'destructive' : 'outline'} className="mr-auto text-[9px]">
          {licenses.filter(l => l.status === 'expired').length > 0 ? 'يحتاج انتباه' : 'ممتاز'}
        </Badge>
      </CardTitle>
    </CardHeader>
    <CardContent className="space-y-2">
      {licenses.map((l, i) => {
        const s = statusStyles[l.status];
        return (
          <div key={i} className="flex items-center gap-2 p-2 rounded border">
            <s.icon className={`h-4 w-4 ${s.color} shrink-0`} />
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium truncate">{l.name}</p>
              <p className="text-[10px] text-muted-foreground">ينتهي: {new Date(l.expiry).toLocaleDateString('ar-EG')}</p>
            </div>
            <Badge variant="outline" className={`text-[9px] ${s.color} border-current`}>{s.label}</Badge>
          </div>
        );
      })}
    </CardContent>
  </Card>
);

export default OfficeComplianceStatus;
