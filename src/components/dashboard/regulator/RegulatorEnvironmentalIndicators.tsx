/**
 * مؤشرات بيئية وطنية
 */
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Leaf, Droplets, Wind, Thermometer, Trash2, Recycle } from 'lucide-react';

const indicators = [
  { label: 'إجمالي النفايات المُدارة (طن/شهر)', value: '45,200', icon: Trash2, trend: '+8%' },
  { label: 'نسبة التدوير الوطنية', value: '23%', icon: Recycle, trend: '+2%' },
  { label: 'مؤشر جودة الهواء (متوسط)', value: '72 AQI', icon: Wind, trend: '-3' },
  { label: 'حوادث تسرب بيئي (هذا الشهر)', value: '3', icon: Droplets, trend: '-1' },
  { label: 'البصمة الكربونية للقطاع', value: '12,400 tCO₂', icon: Thermometer, trend: '-5%' },
  { label: 'مساحات خضراء مستعادة (هكتار)', value: '156', icon: Leaf, trend: '+12' },
];

const RegulatorEnvironmentalIndicators = () => (
  <Card>
    <CardHeader className="pb-3">
      <CardTitle className="text-sm flex items-center gap-2">
        <Leaf className="h-4 w-4 text-primary" />
        المؤشرات البيئية الوطنية
      </CardTitle>
    </CardHeader>
    <CardContent>
      <div className="grid grid-cols-2 gap-2">
        {indicators.map((ind, i) => (
          <div key={i} className="p-2 rounded-lg border text-center">
            <ind.icon className="h-4 w-4 text-primary mx-auto mb-1" />
            <div className="text-sm font-bold">{ind.value}</div>
            <p className="text-[9px] text-muted-foreground">{ind.label}</p>
            <span className="text-[9px] text-green-600">{ind.trend}</span>
          </div>
        ))}
      </div>
    </CardContent>
  </Card>
);

export default RegulatorEnvironmentalIndicators;
