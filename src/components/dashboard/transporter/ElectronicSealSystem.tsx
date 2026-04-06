import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Lock, QrCode, Shield, MapPin } from 'lucide-react';

const seals = [
  { containerId: 'C-101', sealCode: 'SEAL-7829', origin: 'مصنع الحديد', destination: 'مركز التدوير', status: 'sealed' as const, tampered: false },
  { containerId: 'C-102', sealCode: 'SEAL-7830', origin: 'مستشفى القاهرة', destination: 'محرقة طبية', status: 'opened' as const, tampered: false },
  { containerId: 'C-103', sealCode: 'SEAL-7831', origin: 'مصنع كيماويات', destination: 'مدفن آمن', status: 'sealed' as const, tampered: true },
];

const statusConfig = {
  sealed: { label: 'مختوم', color: 'bg-green-100 text-green-800' },
  opened: { label: 'مفتوح (عند الوجهة)', color: 'bg-blue-100 text-blue-800' },
};

export default function ElectronicSealSystem() {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Lock className="w-5 h-5 text-primary" />
          نظام الختم الإلكتروني
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {seals.map(s => (
          <div key={s.containerId} className={`p-2.5 rounded-lg border ${s.tampered ? 'border-red-300 bg-red-50' : ''}`}>
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-2">
                <QrCode className="w-4 h-4 text-primary" />
                <span className="text-sm font-medium">{s.containerId}</span>
              </div>
              <div className="flex items-center gap-1">
                {s.tampered && <Badge variant="destructive" className="text-[9px]">تلاعب!</Badge>}
                <Badge variant="outline" className={`text-[10px] ${statusConfig[s.status].color}`}>
                  {statusConfig[s.status].label}
                </Badge>
              </div>
            </div>
            <div className="text-[10px] text-muted-foreground space-y-0.5">
              <p>كود الختم: {s.sealCode}</p>
              <p className="flex items-center gap-0.5"><MapPin className="w-2.5 h-2.5" />{s.origin} → {s.destination}</p>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
