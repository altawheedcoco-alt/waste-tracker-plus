import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { DollarSign, TrendingUp, TrendingDown, Fuel, User, Wrench } from 'lucide-react';

const shipments = [
  { id: 'SH-3001', revenue: 5000, fuel: 1200, driver: 800, maintenance: 300, depreciation: 200, netProfit: 2500 },
  { id: 'SH-3002', revenue: 3000, fuel: 800, driver: 600, maintenance: 150, depreciation: 150, netProfit: 1300 },
  { id: 'SH-3003', revenue: 8000, fuel: 2500, driver: 1000, maintenance: 500, depreciation: 300, netProfit: 3700 },
  { id: 'SH-3004', revenue: 2000, fuel: 1800, driver: 600, maintenance: 200, depreciation: 150, netProfit: -750 },
];

export default function PerShipmentProfitability() {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <DollarSign className="w-5 h-5 text-primary" />
          ربحية كل شحنة
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {shipments.map(s => {
          const profitable = s.netProfit > 0;
          const margin = Math.round((s.netProfit / s.revenue) * 100);
          return (
            <div key={s.id} className={`p-2.5 rounded-lg border ${!profitable ? 'border-red-200 bg-red-50/50' : ''}`}>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-sm font-semibold">{s.id}</span>
                <Badge variant="outline" className={`text-[10px] ${profitable ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                  {profitable ? '+' : ''}{s.netProfit.toLocaleString()} ج.م ({margin}%)
                </Badge>
              </div>
              <div className="grid grid-cols-5 gap-1 text-center text-[9px]">
                <div><p className="text-green-600 font-bold">{s.revenue.toLocaleString()}</p><p className="text-muted-foreground">إيراد</p></div>
                <div><p className="text-red-600">{s.fuel.toLocaleString()}</p><p className="text-muted-foreground">وقود</p></div>
                <div><p className="text-red-600">{s.driver.toLocaleString()}</p><p className="text-muted-foreground">سائق</p></div>
                <div><p className="text-red-600">{s.maintenance.toLocaleString()}</p><p className="text-muted-foreground">صيانة</p></div>
                <div><p className="text-red-600">{s.depreciation.toLocaleString()}</p><p className="text-muted-foreground">إهلاك</p></div>
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
