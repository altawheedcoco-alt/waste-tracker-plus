import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Zap, Droplets, Flame, TrendingDown } from 'lucide-react';

const utilities = [
  { name: 'كهرباء', icon: Zap, current: '45,200 كيلو واط', change: -5, cost: '158,200 ج.م', unit: 'ج.م/طن: 42' },
  { name: 'مياه', icon: Droplets, current: '1,200 م³', change: -8, cost: '18,000 ج.م', unit: 'ج.م/طن: 4.8' },
  { name: 'غاز طبيعي', icon: Flame, current: '8,500 م³', change: +3, cost: '42,500 ج.م', unit: 'ج.م/طن: 11.3' },
];

const RecyclerEnergyConsumption = () => (
  <Card>
    <CardHeader className="pb-3">
      <CardTitle className="flex items-center gap-2 text-base">
        <Zap className="h-5 w-5 text-primary" />
        استهلاك الطاقة لكل طن
      </CardTitle>
    </CardHeader>
    <CardContent className="space-y-3">
      {utilities.map((u, i) => {
        const Icon = u.icon;
        return (
          <div key={i} className="p-3 rounded-lg border bg-card/50">
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-2">
                <Icon className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium text-sm">{u.name}</span>
              </div>
              <span className={`text-xs font-bold ${u.change < 0 ? 'text-green-600' : 'text-destructive'}`}>
                {u.change > 0 ? '+' : ''}{u.change}%
              </span>
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
              <span>{u.current}</span>
              <span>{u.cost}</span>
            </div>
            <p className="text-xs text-primary mt-1">{u.unit}</p>
          </div>
        );
      })}
      <div className="flex items-center gap-2 pt-2 border-t text-sm text-green-600">
        <TrendingDown className="h-4 w-4" />
        إجمالي تكلفة المرافق/طن: 58.1 ج.م (-3.4%)
      </div>
    </CardContent>
  </Card>
);

export default RecyclerEnergyConsumption;
