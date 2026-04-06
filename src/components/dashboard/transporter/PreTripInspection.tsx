import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Camera, CheckCircle2, AlertTriangle, Truck } from 'lucide-react';

const checklistItems = [
  { item: 'مستوى الزيت', checked: true },
  { item: 'ضغط الإطارات', checked: true },
  { item: 'الفرامل', checked: true },
  { item: 'الأضواء والإشارات', checked: false },
  { item: 'معدات السلامة (طفاية، مثلث)', checked: true },
  { item: 'حالة الحاوية', checked: true },
  { item: 'حزام الأمان', checked: true },
  { item: 'المرايا', checked: false },
];

export default function PreTripInspection() {
  const total = checklistItems.length;
  const passed = checklistItems.filter(c => c.checked).length;
  const allPassed = passed === total;

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Truck className="w-5 h-5 text-primary" />
          فحص ما قبل الرحلة
        </CardTitle>
        <Badge variant="outline" className={allPassed ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}>
          {passed}/{total} بند
        </Badge>
      </CardHeader>
      <CardContent className="space-y-2">
        {checklistItems.map((item, i) => (
          <div key={i} className="flex items-center justify-between p-2 rounded-lg border">
            <span className="text-sm">{item.item}</span>
            {item.checked ? <CheckCircle2 className="w-4 h-4 text-green-500" /> : <AlertTriangle className="w-4 h-4 text-yellow-500" />}
          </div>
        ))}
        <Button variant="outline" size="sm" className="w-full gap-1 mt-2"><Camera className="w-3.5 h-3.5" /> إرفاق صور</Button>
      </CardContent>
    </Card>
  );
}
