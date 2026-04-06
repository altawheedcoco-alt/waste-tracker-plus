import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Eye, DollarSign, Fuel, Clock, TrendingDown } from 'lucide-react';

const hiddenCosts = [
  { category: 'أوقات الانتظار', description: 'متوسط 35 دقيقة/رحلة عند بوابات المصانع', monthlyCost: 8500, icon: Clock },
  { category: 'رحلات فارغة', description: '22% من الرحلات بدون حمولة عودة', monthlyCost: 12000, icon: TrendingDown },
  { category: 'صيانة طارئة', description: 'أعطال مفاجئة (3 حالات/شهر)', monthlyCost: 4500, icon: Eye },
  { category: 'استهلاك وقود زائد', description: 'تجاوز المعيار بـ 12% في 4 مركبات', monthlyCost: 6200, icon: Fuel },
];

export default function HiddenLossDetector() {
  const total = hiddenCosts.reduce((s, c) => s + c.monthlyCost, 0);

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Eye className="w-5 h-5 text-primary" />
          كاشف الخسائر الخفية
        </CardTitle>
        <Badge variant="destructive">{total.toLocaleString()} ج.م/شهر</Badge>
      </CardHeader>
      <CardContent className="space-y-2">
        {hiddenCosts.map((c, i) => {
          const Icon = c.icon;
          return (
            <div key={i} className="p-2.5 rounded-lg border">
              <div className="flex items-center gap-2 mb-1">
                <Icon className="w-4 h-4 text-red-500" />
                <span className="text-sm font-medium">{c.category}</span>
                <Badge variant="outline" className="text-[10px] bg-red-100 text-red-800 mr-auto">
                  {c.monthlyCost.toLocaleString()} ج.م
                </Badge>
              </div>
              <p className="text-[10px] text-muted-foreground">{c.description}</p>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
