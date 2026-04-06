/**
 * لوحة مؤشرات الأداء الرئيسية للمكتب
 */
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Activity, TrendingUp, TrendingDown, Minus } from 'lucide-react';

const kpis = [
  { label: 'متوسط مدة المشروع', value: '45 يوم', trend: 'down', change: '-8%', good: true },
  { label: 'نسبة إعادة التعاقد', value: '72%', trend: 'up', change: '+5%', good: true },
  { label: 'تكلفة اكتساب العميل', value: '8,500 ج.م', trend: 'down', change: '-12%', good: true },
  { label: 'هامش الربح', value: '34%', trend: 'up', change: '+2%', good: true },
  { label: 'معدل الخطأ في التقارير', value: '3.2%', trend: 'up', change: '+0.5%', good: false },
  { label: 'ساعات العمل الإضافي', value: '18 ساعة/شهر', trend: 'neutral', change: '0%', good: true },
];

const TrendIcon = ({ trend, good }: { trend: string; good: boolean }) => {
  if (trend === 'neutral') return <Minus className="h-3 w-3 text-muted-foreground" />;
  if (trend === 'up') return <TrendingUp className={`h-3 w-3 ${good ? 'text-green-500' : 'text-red-500'}`} />;
  return <TrendingDown className={`h-3 w-3 ${good ? 'text-green-500' : 'text-red-500'}`} />;
};

const OfficeKPIDashboard = () => (
  <Card>
    <CardHeader className="pb-3">
      <CardTitle className="text-sm flex items-center gap-2">
        <Activity className="h-4 w-4 text-primary" />
        مؤشرات الأداء الرئيسية
      </CardTitle>
    </CardHeader>
    <CardContent>
      <div className="grid grid-cols-2 gap-2">
        {kpis.map((k, i) => (
          <div key={i} className="p-2 rounded-lg border text-center">
            <div className="text-sm font-bold">{k.value}</div>
            <p className="text-[10px] text-muted-foreground">{k.label}</p>
            <div className="flex items-center justify-center gap-1 mt-1">
              <TrendIcon trend={k.trend} good={k.good} />
              <span className={`text-[9px] ${k.good ? 'text-green-600' : 'text-red-600'}`}>{k.change}</span>
            </div>
          </div>
        ))}
      </div>
    </CardContent>
  </Card>
);

export default OfficeKPIDashboard;
