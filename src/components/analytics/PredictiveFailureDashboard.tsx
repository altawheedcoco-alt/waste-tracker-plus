import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  AlertTriangle, Truck, Settings, Thermometer, Activity,
  TrendingUp, Shield, Clock, Wrench
} from 'lucide-react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer
} from 'recharts';

interface AssetHealth {
  id: string;
  name: string;
  type: 'vehicle' | 'equipment';
  health_score: number;
  predicted_failure_days: number;
  risk_level: 'low' | 'medium' | 'high' | 'critical';
  key_indicators: { name: string; value: number; threshold: number }[];
  recommendation: string;
}

const DEMO_ASSETS: AssetHealth[] = [
  {
    id: '1', name: 'شاحنة ن-١٢٣٤', type: 'vehicle', health_score: 45,
    predicted_failure_days: 12, risk_level: 'high',
    key_indicators: [
      { name: 'حرارة المحرك', value: 105, threshold: 95 },
      { name: 'ضغط الزيت', value: 28, threshold: 35 },
      { name: 'اهتزاز المحرك', value: 8.2, threshold: 7 },
    ],
    recommendation: 'فحص عاجل للمحرك - احتمال عطل خلال 12 يوم',
  },
  {
    id: '2', name: 'كسارة بلاستيك #3', type: 'equipment', health_score: 62,
    predicted_failure_days: 28, risk_level: 'medium',
    key_indicators: [
      { name: 'حدة الشفرات', value: 55, threshold: 70 },
      { name: 'سرعة الدوران', value: 1350, threshold: 1500 },
    ],
    recommendation: 'استبدال الشفرات خلال 4 أسابيع',
  },
  {
    id: '3', name: 'شاحنة ن-٥٦٧٨', type: 'vehicle', health_score: 88,
    predicted_failure_days: 90, risk_level: 'low',
    key_indicators: [
      { name: 'حرارة المحرك', value: 82, threshold: 95 },
      { name: 'ضغط الزيت', value: 42, threshold: 35 },
    ],
    recommendation: 'حالة ممتازة - صيانة روتينية بعد 3 أشهر',
  },
];

const HEALTH_TREND = [
  { day: 'قبل 30 يوم', truck1: 72, truck2: 85, crusher: 80 },
  { day: 'قبل 25 يوم', truck1: 68, truck2: 84, crusher: 78 },
  { day: 'قبل 20 يوم', truck1: 63, truck2: 86, crusher: 75 },
  { day: 'قبل 15 يوم', truck1: 58, truck2: 87, crusher: 70 },
  { day: 'قبل 10 يوم', truck1: 52, truck2: 88, crusher: 66 },
  { day: 'اليوم', truck1: 45, truck2: 88, crusher: 62 },
];

const RISK_COLORS = {
  low: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400',
  medium: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400',
  high: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
  critical: 'bg-red-200 text-red-900 dark:bg-red-900/50 dark:text-red-300',
};

const RISK_LABELS = { low: 'منخفض', medium: 'متوسط', high: 'مرتفع', critical: 'حرج' };

const PredictiveFailureDashboard = () => {
  const atRisk = DEMO_ASSETS.filter(a => a.risk_level === 'high' || a.risk_level === 'critical');

  return (
    <div className="space-y-4" dir="rtl">
      {/* Alert */}
      {atRisk.length > 0 && (
        <Card className="border-red-200 bg-red-50/50 dark:border-red-800 dark:bg-red-950/20">
          <CardContent className="p-3">
            <div className="flex items-center gap-2 mb-1">
              <AlertTriangle className="h-4 w-4 text-red-600" />
              <span className="text-xs font-semibold">{atRisk.length} أصل في خطر عطل وشيك</span>
            </div>
            {atRisk.map(a => (
              <p key={a.id} className="text-[10px] text-red-700 dark:text-red-400">
                • <strong>{a.name}</strong>: عطل متوقع خلال {a.predicted_failure_days} يوم
              </p>
            ))}
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-3 gap-3">
        <Card>
          <CardContent className="p-3 text-center">
            <Activity className="h-4 w-4 mx-auto mb-1 text-primary" />
            <div className="text-lg font-bold">{DEMO_ASSETS.length}</div>
            <p className="text-[10px] text-muted-foreground">أصل مراقب</p>
          </CardContent>
        </Card>
        <Card className={atRisk.length > 0 ? 'border-red-200 dark:border-red-800' : ''}>
          <CardContent className="p-3 text-center">
            <AlertTriangle className="h-4 w-4 mx-auto mb-1 text-red-500" />
            <div className="text-lg font-bold">{atRisk.length}</div>
            <p className="text-[10px] text-muted-foreground">في خطر</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 text-center">
            <Shield className="h-4 w-4 mx-auto mb-1 text-emerald-600" />
            <div className="text-lg font-bold">{Math.round(DEMO_ASSETS.reduce((s, a) => s + a.health_score, 0) / DEMO_ASSETS.length)}%</div>
            <p className="text-[10px] text-muted-foreground">صحة عامة</p>
          </CardContent>
        </Card>
      </div>

      {/* Health Trend */}
      <Card>
        <CardHeader className="pb-0 px-4 pt-3">
          <CardTitle className="text-sm">اتجاه صحة الأصول</CardTitle>
        </CardHeader>
        <CardContent className="px-2 pb-3">
          <ResponsiveContainer width="100%" height={180}>
            <LineChart data={HEALTH_TREND}>
              <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
              <XAxis dataKey="day" tick={{ fontSize: 9 }} />
              <YAxis domain={[0, 100]} tick={{ fontSize: 9 }} />
              <Tooltip contentStyle={{ fontSize: 11 }} />
              <Line type="monotone" dataKey="truck1" name="ن-١٢٣٤" stroke="hsl(var(--destructive))" strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="crusher" name="كسارة #3" stroke="hsl(var(--primary))" strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="truck2" name="ن-٥٦٧٨" stroke="hsl(var(--accent-foreground))" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Assets */}
      <div className="space-y-3">
        {DEMO_ASSETS.map(asset => (
          <Card key={asset.id} className={asset.risk_level === 'high' || asset.risk_level === 'critical' ? 'border-red-200 dark:border-red-800' : ''}>
            <CardContent className="p-4">
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2">
                  {asset.type === 'vehicle' ? <Truck className="h-4 w-4 text-muted-foreground" /> : <Settings className="h-4 w-4 text-muted-foreground" />}
                  <div>
                    <span className="text-sm font-semibold">{asset.name}</span>
                    <p className="text-[10px] text-muted-foreground">عطل متوقع خلال {asset.predicted_failure_days} يوم</p>
                  </div>
                </div>
                <Badge className={RISK_COLORS[asset.risk_level] + ' text-[9px] h-5'}>
                  {RISK_LABELS[asset.risk_level]}
                </Badge>
              </div>

              <div className="mb-2">
                <div className="flex justify-between text-[10px] mb-1">
                  <span>مؤشر الصحة</span>
                  <span className="font-bold">{asset.health_score}%</span>
                </div>
                <Progress value={asset.health_score} className="h-2" />
              </div>

              {asset.key_indicators.map((ind, i) => {
                const isAlert = asset.type === 'vehicle'
                  ? (ind.name === 'ضغط الزيت' ? ind.value < ind.threshold : ind.value > ind.threshold)
                  : ind.value < ind.threshold;
                return (
                  <div key={i} className="flex justify-between text-[10px] py-1 border-b border-border/30 last:border-0">
                    <span>{ind.name}</span>
                    <span className={isAlert ? 'text-red-500 font-bold' : 'text-emerald-600'}>
                      {ind.value} <span className="text-muted-foreground font-normal">(حد: {ind.threshold})</span>
                    </span>
                  </div>
                );
              })}

              <div className="mt-2 p-2 bg-muted/50 rounded text-[10px] flex items-start gap-1.5">
                <Wrench className="h-3 w-3 text-primary shrink-0 mt-0.5" />
                {asset.recommendation}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default PredictiveFailureDashboard;
