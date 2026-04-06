/**
 * سجل تدريبات وشهادات السائق
 */
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { GraduationCap, Award, Clock, CheckCircle2 } from 'lucide-react';

const certifications = [
  { name: 'رخصة نقل مخلفات خطرة', status: 'valid', expiry: '2027-06-15', issuer: 'EEAA' },
  { name: 'شهادة السلامة المهنية', status: 'valid', expiry: '2026-12-01', issuer: 'وزارة القوى العاملة' },
  { name: 'تدريب الطوارئ الكيميائية', status: 'expiring', expiry: '2026-05-10', issuer: 'الدفاع المدني' },
  { name: 'رخصة قيادة مركبات ثقيلة', status: 'valid', expiry: '2028-03-01', issuer: 'المرور' },
];

const trainings = [
  { name: 'تدريب التعامل مع المخلفات الطبية', date: '2026-03-15', duration: '4 ساعات', passed: true },
  { name: 'ورشة القيادة الآمنة', date: '2026-02-20', duration: '6 ساعات', passed: true },
];

const statusColors: Record<string, string> = {
  valid: 'text-green-600',
  expiring: 'text-amber-600',
  expired: 'text-red-600',
};

const DriverCertifications = () => (
  <Card>
    <CardHeader className="pb-3">
      <CardTitle className="text-sm flex items-center gap-2">
        <GraduationCap className="h-4 w-4 text-primary" />
        الشهادات والتدريبات
      </CardTitle>
    </CardHeader>
    <CardContent className="space-y-3">
      <div className="space-y-2">
        <p className="text-[10px] font-medium text-muted-foreground">الشهادات</p>
        {certifications.map((c, i) => (
          <div key={i} className="flex items-center gap-2 p-2 rounded border">
            <Award className={`h-4 w-4 ${statusColors[c.status]} shrink-0`} />
            <div className="flex-1 min-w-0">
              <p className="text-xs truncate">{c.name}</p>
              <p className="text-[10px] text-muted-foreground">{c.issuer} • ينتهي {new Date(c.expiry).toLocaleDateString('ar-EG')}</p>
            </div>
          </div>
        ))}
      </div>
      <div className="space-y-2">
        <p className="text-[10px] font-medium text-muted-foreground">التدريبات الأخيرة</p>
        {trainings.map((t, i) => (
          <div key={i} className="flex items-center gap-2 p-2 rounded border">
            <CheckCircle2 className="h-3 w-3 text-green-500 shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-xs truncate">{t.name}</p>
              <p className="text-[10px] text-muted-foreground">{t.duration} • {new Date(t.date).toLocaleDateString('ar-EG')}</p>
            </div>
          </div>
        ))}
      </div>
    </CardContent>
  </Card>
);

export default DriverCertifications;
