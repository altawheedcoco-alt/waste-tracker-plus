import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Building2, FileText, Shield, MapPin, Users, Truck } from 'lucide-react';

export default function CorporatePassport() {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Building2 className="w-5 h-5 text-primary" />
          جواز السفر المؤسسي
        </CardTitle>
        <p className="text-xs text-muted-foreground">ملف الجهة الرقمي الموحد</p>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid grid-cols-2 gap-2">
          {[
            { icon: FileText, label: 'السجل التجاري', value: '12345/2020', status: 'ساري' },
            { icon: FileText, label: 'البطاقة الضريبية', value: '987-654-321', status: 'ساري' },
            { icon: Shield, label: 'ترخيص EEAA', value: 'ENV-2024-789', status: 'ساري' },
            { icon: Shield, label: 'ترخيص WMRA', value: 'WM-2024-456', status: 'تجديد قريب' },
            { icon: Truck, label: 'رخصة النقل البري', value: 'TR-2024-123', status: 'ساري' },
            { icon: Shield, label: 'شهادة الدفاع المدني', value: 'CD-2024-321', status: 'ساري' },
            { icon: MapPin, label: 'النطاق الجغرافي', value: 'القاهرة الكبرى', status: '3 محافظات' },
            { icon: Users, label: 'عدد الموظفين', value: '47', status: '12 سائق' },
          ].map((item, i) => {
            const Icon = item.icon;
            return (
              <div key={i} className="p-2 rounded-lg border bg-muted/30">
                <div className="flex items-center gap-1.5 mb-1">
                  <Icon className="w-3.5 h-3.5 text-primary" />
                  <span className="text-[10px] text-muted-foreground">{item.label}</span>
                </div>
                <p className="text-xs font-semibold">{item.value}</p>
                <Badge variant="outline" className={`text-[9px] mt-0.5 ${item.status.includes('تجديد') ? 'bg-yellow-100 text-yellow-800' : 'bg-green-100 text-green-800'}`}>
                  {item.status}
                </Badge>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
