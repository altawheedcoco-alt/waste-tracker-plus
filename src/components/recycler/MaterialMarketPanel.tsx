import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  TrendingUp, TrendingDown, DollarSign, BarChart3,
  ArrowUpRight, ArrowDownRight, RefreshCw, Globe
} from 'lucide-react';

interface MaterialPrice {
  name: string;
  nameEn: string;
  priceEGP: number;
  change: number;
  trend: 'up' | 'down' | 'stable';
  unit: string;
  globalPriceEGP: number;
  demandLevel: 'high' | 'medium' | 'low';
}

const materialPrices: MaterialPrice[] = [
  { name: 'بلاستيك PET', nameEn: 'PET', priceEGP: 12500, change: 3.2, trend: 'up', unit: 'طن', globalPriceEGP: 42500, demandLevel: 'high' },
  { name: 'بلاستيك HDPE', nameEn: 'HDPE', priceEGP: 14000, change: -1.5, trend: 'down', unit: 'طن', globalPriceEGP: 46000, demandLevel: 'medium' },
  { name: 'حديد خردة', nameEn: 'Scrap Iron', priceEGP: 18000, change: 5.1, trend: 'up', unit: 'طن', globalPriceEGP: 19000, demandLevel: 'high' },
  { name: 'ألمنيوم خردة', nameEn: 'Scrap Aluminum', priceEGP: 75000, change: 2.8, trend: 'up', unit: 'طن', globalPriceEGP: 105000, demandLevel: 'high' },
  { name: 'نحاس خردة', nameEn: 'Scrap Copper', priceEGP: 320000, change: -0.5, trend: 'down', unit: 'طن', globalPriceEGP: 425000, demandLevel: 'medium' },
  { name: 'ورق وكرتون', nameEn: 'Paper/Cardboard', priceEGP: 5500, change: 1.2, trend: 'up', unit: 'طن', globalPriceEGP: 7500, demandLevel: 'low' },
  { name: 'زجاج مكسور', nameEn: 'Cullet Glass', priceEGP: 1800, change: 0, trend: 'stable', unit: 'طن', globalPriceEGP: 2250, demandLevel: 'low' },
  { name: 'إطارات مستعملة', nameEn: 'Used Tires', priceEGP: 3000, change: 4.0, trend: 'up', unit: 'طن', globalPriceEGP: 4000, demandLevel: 'medium' },
];

const demandLabels: Record<string, { label: string; color: string }> = {
  high: { label: 'طلب مرتفع', color: 'text-emerald-500' },
  medium: { label: 'طلب متوسط', color: 'text-amber-500' },
  low: { label: 'طلب منخفض', color: 'text-muted-foreground' },
};

const MaterialMarketPanel = () => {
  const [lastUpdate] = useState(new Date().toLocaleTimeString('ar-EG'));

  const topGainers = [...materialPrices].sort((a, b) => b.change - a.change).slice(0, 3);

  return (
    <div className="space-y-4">
      {/* Market Header */}
      <Card className="border-emerald-500/20">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <Badge variant="outline" className="text-[10px] gap-1">
              <RefreshCw className="w-3 h-3" />
              {lastUpdate}
            </Badge>
            <CardTitle className="flex items-center gap-2 text-base">
              <BarChart3 className="w-5 h-5 text-emerald-500" />
              بورصة المواد المُدوَّرة
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          {/* Top Movers */}
          <div className="flex gap-2 overflow-x-auto pb-2 mb-4">
            {topGainers.map((m) => (
              <div key={m.nameEn} className="flex-shrink-0 p-2 rounded-lg bg-emerald-500/5 border border-emerald-500/20 min-w-[120px]">
                <p className="text-[10px] font-bold">{m.name}</p>
                <div className="flex items-center gap-1">
                  <ArrowUpRight className="w-3 h-3 text-emerald-500" />
                  <span className="text-xs font-bold text-emerald-500">+{m.change}%</span>
                </div>
              </div>
            ))}
          </div>

          {/* Price List */}
          <div className="space-y-2">
            {materialPrices.map((m) => {
              const demand = demandLabels[m.demandLevel];
              return (
                <div key={m.nameEn} className="p-3 rounded-xl border bg-card hover:bg-muted/30 transition-colors">
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      {m.trend === 'up' ? (
                        <Badge variant="outline" className="text-emerald-500 border-emerald-500/30 bg-emerald-500/10 text-[10px] gap-0.5">
                          <ArrowUpRight className="w-3 h-3" />+{m.change}%
                        </Badge>
                      ) : m.trend === 'down' ? (
                        <Badge variant="outline" className="text-destructive border-destructive/30 bg-destructive/10 text-[10px] gap-0.5">
                          <ArrowDownRight className="w-3 h-3" />{m.change}%
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-muted-foreground text-[10px]">ثابت</Badge>
                      )}
                      <span className={`text-[10px] ${demand.color}`}>{demand.label}</span>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold">{m.name}</p>
                      <p className="text-[10px] text-muted-foreground">{m.nameEn}</p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                      <Globe className="w-3 h-3" />
                      {m.globalPriceEGP.toLocaleString()} ج.م (عالمي)
                    </div>
                    <div className="flex items-center gap-1">
                      <DollarSign className="w-4 h-4 text-emerald-500" />
                      <span className="text-base font-bold">{m.priceEGP.toLocaleString()}</span>
                      <span className="text-[10px] text-muted-foreground">ج.م/{m.unit}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default MaterialMarketPanel;
