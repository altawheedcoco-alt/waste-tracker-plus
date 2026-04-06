import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { FileText, CheckCircle, Clock, AlertTriangle } from 'lucide-react';

const docs = [
  { name: 'رخصة القيادة المهنية', status: 'active', expiry: '2027-08-15', type: 'شخصي' },
  { name: 'شهادة نقل مخلفات خطرة', status: 'active', expiry: '2026-12-01', type: 'تخصصي' },
  { name: 'الفحص الطبي الدوري', status: 'expiring', expiry: '2026-04-20', type: 'صحي' },
  { name: 'شهادة تدريب السلامة', status: 'active', expiry: '2026-09-10', type: 'تدريبي' },
  { name: 'تصريح دخول المناطق المحظورة', status: 'expired', expiry: '2026-03-01', type: 'أمني' },
];

const statusCfg = {
  active: { label: 'ساري', color: 'bg-green-500/10 text-green-600 border-green-500/30', icon: CheckCircle },
  expiring: { label: 'قارب الانتهاء', color: 'bg-yellow-500/10 text-yellow-600 border-yellow-500/30', icon: Clock },
  expired: { label: 'منتهي', color: 'bg-destructive/10 text-destructive border-destructive/30', icon: AlertTriangle },
};

const DriverDocumentStatus = () => (
  <Card>
    <CardHeader className="pb-3">
      <CardTitle className="flex items-center gap-2 text-base">
        <FileText className="h-5 w-5 text-primary" />
        حالة الوثائق والتراخيص
      </CardTitle>
    </CardHeader>
    <CardContent className="space-y-2">
      {docs.map((d, i) => {
        const cfg = statusCfg[d.status as keyof typeof statusCfg];
        return (
          <div key={i} className="flex items-center justify-between p-2 rounded border">
            <div>
              <p className="text-sm font-medium">{d.name}</p>
              <p className="text-xs text-muted-foreground">{d.type} • ينتهي: {d.expiry}</p>
            </div>
            <Badge variant="outline" className={cfg.color}>{cfg.label}</Badge>
          </div>
        );
      })}
    </CardContent>
  </Card>
);

export default DriverDocumentStatus;
