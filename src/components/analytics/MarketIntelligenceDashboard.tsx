import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  TrendingUp, TrendingDown, Minus, BarChart3, Activity, AlertTriangle
} from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar
} from 'recharts';

interface MarketData {
  material: string;
  avgPrice: number;
  trend: 'up' | 'stable' | 'down';
  changePercent: number;
  demandIndex: number;
  supplyIndex: number;
}

const MARKET_DATA: MarketData[] = [
  { material: 'HDPE حبيبات', avgPrice: 28, trend: 'up', changePercent: 12, demandIndex: 82, supplyIndex: 65 },
  { material: 'PET رقائق', avgPrice: 35, trend: 'up', changePercent: 8, demandIndex: 90, supplyIndex: 55 },
  { material: 'كرتون بالات', avgPrice: 8, trend: 'stable', changePercent: 1, demandIndex: 70, supplyIndex: 80 },
  { material: 'ألمنيوم سبائك', avgPrice: 120, trend: 'up', changePercent: 15, demandIndex: 88, supplyIndex: 40 },
  { material: 'زجاج كسر', avgPrice: 4, trend: 'down', changePercent: -5, demandIndex: 45, supplyIndex: 90 },
  { material: 'نحاس خردة', avgPrice: 180, trend: 'up', changePercent: 20, demandIndex: 95, supplyIndex: 30 },
];

const PRICE_HISTORY = [
  { month: 'أكتوبر', hdpe: 22, pet: 30, aluminum: 100 },
  { month: 'نوفمبر', hdpe: 24, pet: 31, aluminum: 105 },
  { month: 'ديسمبر', hdpe: 25, pet: 32, aluminum: 108 },
  { month: 'يناير', hdpe: 26, pet: 33, aluminum: 112 },
  { month: 'فبراير', hdpe: 27, pet: 34, aluminum: 118 },
  { month: 'مارس', hdpe: 28, pet: 35, aluminum: 120 },
  { month: 'أبريل*', hdpe: 30, pet: 37, aluminum: 125 },
];

const DEMAND_DATA = [
  { region: 'القاهرة', demand: 85 },
  { region: 'الإسكندرية', demand: 72 },
  { region: 'الدلتا', demand: 60 },
  { region: 'الصعيد', demand: 45 },
  { region: 'القناة', demand: 55 },
];

const TrendIcon = ({ trend }: { trend: string }) => {
  if (trend === 'up') return <TrendingUp className="h-3.5 w-3.5 text-emerald-600" />;
  if (trend === 'down') return <TrendingDown className="h-3.5 w-3.5 text-red-500" />;
  return <Minus className="h-3.5 w-3.5 text-muted-foreground" />;
};

const MarketIntelligenceDashboard = () => {
  const alerts = MARKET_DATA.filter(m => Math.abs(m.changePercent) >= 15);

  return (
    <div className="space-y-4" dir="rtl">
      {/* Alerts */}
      {alerts.length > 0 && (
        <Card className="border-amber-200 bg-amber-50/50 dark:border-amber-800 dark:bg-amber-950/20">
          <CardContent className="p-3">
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle className="h-4 w-4 text-amber-600" />
              <span className="text-sm font-semibold">تنبيهات السوق</span>
            </div>
            {alerts.map(a => (
              <div key={a.material} className="text-xs flex items-center gap-2 mb-1">
                <TrendIcon trend={a.trend} />
                <span><strong>{a.material}</strong>: تغيير {a.changePercent > 0 ? '+' : ''}{a.changePercent}% —
                  {a.trend === 'up' ? ' ارتفاع قوي في السعر' : ' انخفاض ملحوظ'}
                </span>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Price Table */}
      <Card>
        <CardHeader className="pb-2 px-4 pt-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <BarChart3 className="h-4 w-4 text-primary" />
            أسعار المواد الثانوية
          </CardTitle>
        </CardHeader>
        <CardContent className="px-4 pb-3">
          <div className="space-y-2">
            {MARKET_DATA.map(m => (
              <div key={m.material} className="flex items-center justify-between py-2 border-b border-border/50 last:border-0">
                <div className="flex items-center gap-2">
                  <TrendIcon trend={m.trend} />
                  <span className="text-sm font-medium">{m.material}</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-left">
                    <span className="text-sm font-bold">{m.avgPrice} ج.م</span>
                    <span className="text-[10px] text-muted-foreground">/كجم</span>
                  </div>
                  <Badge
                    variant="outline"
                    className={`text-[9px] h-5 ${
                      m.changePercent > 0 ? 'text-emerald-600 border-emerald-300' :
                      m.changePercent < 0 ? 'text-red-500 border-red-300' :
                      'text-muted-foreground'
                    }`}
                  >
                    {m.changePercent > 0 ? '+' : ''}{m.changePercent}%
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Price Trends Chart */}
      <Card>
        <CardHeader className="pb-2 px-4 pt-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <Activity className="h-4 w-4 text-primary" />
            اتجاهات الأسعار (6 أشهر + توقع)
          </CardTitle>
        </CardHeader>
        <CardContent className="px-2 pb-3">
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={PRICE_HISTORY}>
              <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
              <XAxis dataKey="month" tick={{ fontSize: 10 }} />
              <YAxis tick={{ fontSize: 10 }} />
              <Tooltip contentStyle={{ fontSize: 11 }} />
              <Area type="monotone" dataKey="hdpe" name="HDPE" stroke="hsl(var(--primary))" fill="hsl(var(--primary)/0.1)" strokeWidth={2} />
              <Area type="monotone" dataKey="pet" name="PET" stroke="hsl(var(--accent-foreground))" fill="hsl(var(--accent)/0.1)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Demand by Region */}
      <Card>
        <CardHeader className="pb-2 px-4 pt-3">
          <CardTitle className="text-sm">مؤشر الطلب حسب المنطقة</CardTitle>
        </CardHeader>
        <CardContent className="px-2 pb-3">
          <ResponsiveContainer width="100%" height={160}>
            <BarChart data={DEMAND_DATA} layout="vertical">
              <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 10 }} />
              <YAxis type="category" dataKey="region" tick={{ fontSize: 10 }} width={60} />
              <Tooltip contentStyle={{ fontSize: 11 }} />
              <Bar dataKey="demand" name="مؤشر الطلب" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Supply vs Demand */}
      <Card>
        <CardHeader className="pb-2 px-4 pt-3">
          <CardTitle className="text-sm">فجوة العرض والطلب</CardTitle>
        </CardHeader>
        <CardContent className="px-4 pb-3 space-y-2">
          {MARKET_DATA.map(m => {
            const gap = m.demandIndex - m.supplyIndex;
            return (
              <div key={m.material}>
                <div className="flex justify-between text-xs mb-1">
                  <span>{m.material}</span>
                  <span className={gap > 20 ? 'text-red-500 font-bold' : gap < -10 ? 'text-emerald-600' : 'text-muted-foreground'}>
                    {gap > 0 ? `نقص ${gap}%` : gap < 0 ? `فائض ${Math.abs(gap)}%` : 'متوازن'}
                  </span>
                </div>
                <div className="flex gap-1 h-2">
                  <div className="bg-blue-500 rounded-r" style={{ width: `${m.supplyIndex}%` }} title="العرض" />
                  <div className="bg-amber-500 rounded-l" style={{ width: `${m.demandIndex}%` }} title="الطلب" />
                </div>
              </div>
            );
          })}
          <div className="flex gap-4 justify-center text-[9px] text-muted-foreground mt-2">
            <span className="flex items-center gap-1"><span className="w-2 h-2 bg-blue-500 rounded" /> العرض</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 bg-amber-500 rounded" /> الطلب</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default MarketIntelligenceDashboard;
