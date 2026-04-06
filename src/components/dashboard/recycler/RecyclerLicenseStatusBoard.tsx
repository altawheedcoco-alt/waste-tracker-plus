import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Shield, AlertTriangle, CheckCircle, Clock } from 'lucide-react';

const licenses = [
  { name: 'ترخيص تدوير المخلفات الصلبة', status: 'active', expiry: '2026-12-15', authority: 'جهاز تنظيم المخلفات' },
  { name: 'ترخيص بيئي (EIA)', status: 'active', expiry: '2026-08-20', authority: 'وزارة البيئة' },
  { name: 'ترخيص صناعي', status: 'expiring', expiry: '2026-05-01', authority: 'هيئة التنمية الصناعية' },
  { name: 'شهادة ISO 14001', status: 'active', expiry: '2027-03-10', authority: 'هيئة الاعتماد' },
  { name: 'ترخيص الانبعاثات', status: 'expired', expiry: '2026-02-28', authority: 'وزارة البيئة' },
  { name: 'ترخيص مزاولة نشاط', status: 'active', expiry: '2027-01-15', authority: 'السجل التجاري' },
];

const statusConfig = {
  active: { label: 'ساري', color: 'bg-green-500/10 text-green-600 border-green-500/30', icon: CheckCircle },
  expiring: { label: 'قارب الانتهاء', color: 'bg-yellow-500/10 text-yellow-600 border-yellow-500/30', icon: Clock },
  expired: { label: 'منتهي', color: 'bg-destructive/10 text-destructive border-destructive/30', icon: AlertTriangle },
};

const RecyclerLicenseStatusBoard = () => (
  <Card>
    <CardHeader className="pb-3">
      <CardTitle className="flex items-center gap-2 text-base">
        <Shield className="h-5 w-5 text-primary" />
        لوحة حالة التراخيص
      </CardTitle>
    </CardHeader>
    <CardContent className="space-y-3">
      {licenses.map((lic, i) => {
        const cfg = statusConfig[lic.status as keyof typeof statusConfig];
        const Icon = cfg.icon;
        return (
          <div key={i} className="flex items-center justify-between p-3 rounded-lg border bg-card/50">
            <div className="flex items-center gap-3">
              <Icon className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">{lic.name}</p>
                <p className="text-xs text-muted-foreground">{lic.authority}</p>
              </div>
            </div>
            <div className="text-left">
              <Badge variant="outline" className={cfg.color}>{cfg.label}</Badge>
              <p className="text-xs text-muted-foreground mt-1">{lic.expiry}</p>
            </div>
          </div>
        );
      })}
    </CardContent>
  </Card>
);

export default RecyclerLicenseStatusBoard;
