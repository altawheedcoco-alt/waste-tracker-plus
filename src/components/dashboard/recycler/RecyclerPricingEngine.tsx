import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DollarSign, TrendingUp, TrendingDown, Minus } from 'lucide-react';

const prices = [
  { material: 'حبيبات PET', current: 18500, previous: 17200, unit: 'ج.م/طن' },
  { material: 'حبيبات HDPE', current: 14200, previous: 14800, unit: 'ج.م/طن' },
  { material: 'لب ورقي', current: 8900, previous: 8900, unit: 'ج.م/طن' },
  { material: 'خردة حديد', current: 22000, previous: 20500, unit: 'ج.م/طن' },
  { material: 'ألومنيوم مضغوط', current: 65000, previous: 62000, unit: 'ج.م/طن' },
  { material: 'زجاج مكسر', current: 6500, previous: 7100, unit: 'ج.م/طن' },
];

const RecyclerPricingEngine = () => (
  <Card>
    <CardHeader className="pb-3">
      <CardTitle className="flex items-center gap-2 text-base">
        <DollarSign className="h-5 w-5 text-primary" />
        محرك تسعير المواد المعاد تدويرها
      </CardTitle>
    </CardHeader>
    <CardContent className="space-y-2">
      {prices.map((p, i) => {
        const change = ((p.current - p.previous) / p.previous * 100).toFixed(1);
        const isUp = p.current > p.previous;
        const isFlat = p.current === p.previous;
        return (
          <div key={i} className="flex items-center justify-between p-2 rounded border">
            <span className="text-sm font-medium">{p.material}</span>
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold">{p.current.toLocaleString()} {p.unit}</span>
              <div className={`flex items-center gap-0.5 text-xs ${isUp ? 'text-green-600' : isFlat ? 'text-muted-foreground' : 'text-destructive'}`}>
                {isUp ? <TrendingUp className="h-3 w-3" /> : isFlat ? <Minus className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                {isFlat ? '0%' : `${isUp ? '+' : ''}${change}%`}
              </div>
            </div>
          </div>
        );
      })}
    </CardContent>
  </Card>
);

export default RecyclerPricingEngine;
