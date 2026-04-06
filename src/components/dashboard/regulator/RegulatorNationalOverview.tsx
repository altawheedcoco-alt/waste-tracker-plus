/**
 * لوحة الإحصائيات الوطنية المتقدمة
 */
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Globe, Building, Truck, Factory, Trash2, Recycle } from 'lucide-react';

const nationalStats = [
  { label: 'جهات مولّدة مسجلة', value: '2,847', icon: Building, change: '+124 هذا الشهر' },
  { label: 'جهات ناقلة مرخصة', value: '186', icon: Truck, change: '+8 هذا الشهر' },
  { label: 'مصانع تدوير', value: '94', icon: Recycle, change: '+3 هذا الشهر' },
  { label: 'مواقع تخلص نهائي', value: '42', icon: Trash2, change: 'بدون تغيير' },
  { label: 'مكاتب استشارية', value: '67', icon: Factory, change: '+5 هذا الشهر' },
];

const RegulatorNationalOverview = () => (
  <Card>
    <CardHeader className="pb-3">
      <CardTitle className="text-sm flex items-center gap-2">
        <Globe className="h-4 w-4 text-primary" />
        النظرة الوطنية الشاملة
        <Badge variant="outline" className="mr-auto text-[9px]">بيانات مباشرة</Badge>
      </CardTitle>
    </CardHeader>
    <CardContent>
      <div className="grid grid-cols-2 gap-2">
        {nationalStats.map((s, i) => (
          <div key={i} className={`p-3 rounded-lg border text-center ${i === 0 ? 'col-span-2' : ''}`}>
            <s.icon className="h-5 w-5 text-primary mx-auto mb-1" />
            <div className="text-xl font-bold">{s.value}</div>
            <p className="text-[10px] text-muted-foreground">{s.label}</p>
            <p className="text-[9px] text-green-600 mt-0.5">{s.change}</p>
          </div>
        ))}
      </div>
    </CardContent>
  </Card>
);

export default RegulatorNationalOverview;
