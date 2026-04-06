import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { BarChart3, TrendingUp, TrendingDown, ArrowUpDown } from 'lucide-react';

interface MarketPrice {
  wasteType: string;
  yourPrice: number;
  marketAvg: number;
  marketLow: number;
  marketHigh: number;
  unit: string;
  trend: 'up' | 'down' | 'stable';
}

const MOCK_PRICES: MarketPrice[] = [
  { wasteType: 'نفايات صلبة عامة', yourPrice: 120, marketAvg: 115, marketLow: 90, marketHigh: 150, unit: 'ج.م/طن', trend: 'stable' },
  { wasteType: 'نفايات طبية', yourPrice: 350, marketAvg: 380, marketLow: 300, marketHigh: 450, unit: 'ج.م/طن', trend: 'up' },
  { wasteType: 'مخلفات خطرة', yourPrice: 550, marketAvg: 520, marketLow: 420, marketHigh: 680, unit: 'ج.م/طن', trend: 'up' },
  { wasteType: 'مخلفات بناء وهدم', yourPrice: 45, marketAvg: 50, marketLow: 30, marketHigh: 75, unit: 'ج.م/طن', trend: 'down' },
  { wasteType: 'زيوت مستعملة', yourPrice: 280, marketAvg: 260, marketLow: 200, marketHigh: 320, unit: 'ج.م/طن', trend: 'stable' },
  { wasteType: 'نفايات إلكترونية', yourPrice: 180, marketAvg: 200, marketLow: 150, marketHigh: 280, unit: 'ج.م/طن', trend: 'up' },
];

export default function MarketPriceComparison() {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <BarChart3 className="w-5 h-5 text-primary" />
          مقارنة الأسعار مع السوق
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[380px]">
          <div className="space-y-3">
            {MOCK_PRICES.map((price, idx) => {
              const diff = price.yourPrice - price.marketAvg;
              const diffPercent = ((diff / price.marketAvg) * 100).toFixed(1);
              const isAbove = diff > 0;
              const position = ((price.yourPrice - price.marketLow) / (price.marketHigh - price.marketLow)) * 100;

              return (
                <div key={idx} className="p-3 border rounded-lg space-y-2 hover:bg-muted/30">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1">
                      {price.trend === 'up' && <TrendingUp className="w-3 h-3 text-green-500" />}
                      {price.trend === 'down' && <TrendingDown className="w-3 h-3 text-red-500" />}
                      {price.trend === 'stable' && <ArrowUpDown className="w-3 h-3 text-muted-foreground" />}
                    </div>
                    <p className="text-sm font-semibold text-right">{price.wasteType}</p>
                  </div>

                  <div className="grid grid-cols-3 gap-2 text-center text-xs">
                    <div className="p-1.5 bg-muted/50 rounded">
                      <p className="font-bold text-primary">{price.yourPrice}</p>
                      <p className="text-muted-foreground">سعرك</p>
                    </div>
                    <div className="p-1.5 bg-muted/50 rounded">
                      <p className="font-bold">{price.marketAvg}</p>
                      <p className="text-muted-foreground">متوسط السوق</p>
                    </div>
                    <div className="p-1.5 bg-muted/50 rounded">
                      <p className={`font-bold ${isAbove ? 'text-orange-600' : 'text-green-600'}`}>
                        {isAbove ? '+' : ''}{diffPercent}%
                      </p>
                      <p className="text-muted-foreground">الفرق</p>
                    </div>
                  </div>

                  {/* Price range bar */}
                  <div className="relative h-2 bg-muted rounded-full">
                    <div className="absolute h-full bg-primary/20 rounded-full" style={{ left: '0%', right: '0%' }} />
                    <div
                      className="absolute w-3 h-3 rounded-full bg-primary -top-0.5 border-2 border-background"
                      style={{ left: `${Math.min(Math.max(position, 5), 95)}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-[10px] text-muted-foreground">
                    <span>{price.marketHigh} (أعلى)</span>
                    <span>{price.marketLow} (أقل) {price.unit}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
