import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, TrendingDown, Heart, Brain, Zap, Activity, BarChart3, Flame, AlertTriangle } from 'lucide-react';
import { useHealthHistory } from '@/hooks/useHealthHistory';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { cn } from '@/lib/utils';

const HealthHistoryTab = () => {
  const { measurements } = useHealthHistory();
  const data = measurements.data || [];

  const chartData = useMemo(() => {
    const last30 = data.slice(0, 30).reverse();
    return last30.map(m => ({
      date: new Date(m.measured_at).toLocaleDateString('ar-EG', { month: 'short', day: 'numeric' }),
      stress: m.stress || 0,
      energy: m.energy || 0,
      heartRate: m.heart_rate || 0,
    }));
  }, [data]);

  const averages = useMemo(() => {
    if (!data.length) return { stress: 0, energy: 0, hr: 0, prod: 0 };
    const recent = data.slice(0, 10);
    return {
      stress: Math.round(recent.reduce((a, m) => a + (m.stress || 0), 0) / recent.length),
      energy: Math.round(recent.reduce((a, m) => a + (m.energy || 0), 0) / recent.length),
      hr: Math.round(recent.reduce((a, m) => a + (m.heart_rate || 0), 0) / recent.length),
      prod: Math.round(recent.reduce((a, m) => a + (m.productivity || 0), 0) / recent.length),
    };
  }, [data]);

  const trend = useMemo(() => {
    if (data.length < 5) return 'stable';
    const recent5 = data.slice(0, 5).map(m => m.stress || 0);
    const older5 = data.slice(5, 10).map(m => m.stress || 0);
    const avgR = recent5.reduce((a, b) => a + b, 0) / recent5.length;
    const avgO = older5.length ? older5.reduce((a, b) => a + b, 0) / older5.length : avgR;
    return avgR < avgO - 5 ? 'improving' : avgR > avgO + 5 ? 'declining' : 'stable';
  }, [data]);

  // Daily comparison: today vs yesterday
  const dailyComparison = useMemo(() => {
    if (!data.length) return null;
    const today = new Date().toDateString();
    const yesterday = new Date(Date.now() - 86400000).toDateString();
    const todayData = data.filter(m => new Date(m.measured_at).toDateString() === today);
    const yesterdayData = data.filter(m => new Date(m.measured_at).toDateString() === yesterday);
    if (!todayData.length || !yesterdayData.length) return null;
    const avg = (arr: typeof data, key: 'stress' | 'energy') =>
      arr.reduce((a, m) => a + (m[key] || 0), 0) / arr.length;
    const stressChange = Math.round(avg(todayData, 'stress') - avg(yesterdayData, 'stress'));
    const energyChange = Math.round(avg(todayData, 'energy') - avg(yesterdayData, 'energy'));
    return { stressChange, energyChange };
  }, [data]);

  // Streak: consecutive days with measurements
  const streak = useMemo(() => {
    if (!data.length) return 0;
    const days = new Set(data.map(m => new Date(m.measured_at).toDateString()));
    let count = 0;
    const d = new Date();
    while (days.has(d.toDateString())) {
      count++;
      d.setDate(d.getDate() - 1);
    }
    return count;
  }, [data]);

  // 3-day decline alert
  const declineAlert = useMemo(() => {
    if (data.length < 6) return false;
    const dayGroups: Record<string, number[]> = {};
    data.forEach(m => {
      const day = new Date(m.measured_at).toDateString();
      if (!dayGroups[day]) dayGroups[day] = [];
      dayGroups[day].push(m.stress || 0);
    });
    const sortedDays = Object.keys(dayGroups).sort((a, b) => new Date(b).getTime() - new Date(a).getTime());
    if (sortedDays.length < 3) return false;
    const avgs = sortedDays.slice(0, 3).map(d => dayGroups[d].reduce((a, b) => a + b, 0) / dayGroups[d].length);
    return avgs[0] > avgs[1] && avgs[1] > avgs[2] && avgs[0] - avgs[2] > 10;
  }, [data]);

  if (!data.length) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <BarChart3 className="h-12 w-12 text-muted-foreground/30 mx-auto mb-3" />
          <p className="text-sm font-medium text-muted-foreground">لا توجد قياسات بعد</p>
          <p className="text-[10px] text-muted-foreground mt-1">قم بإجراء فحص من أي تبويب وستظهر النتائج هنا</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Streak + Trend */}
      <div className="flex items-center justify-center gap-2 flex-wrap">
        {streak > 0 && (
          <Badge className="bg-accent/10 text-accent-foreground gap-1">
            <Flame className="h-3 w-3" />{streak} يوم متتالي 🔥
          </Badge>
        )}
        {trend === 'improving' && <Badge className="bg-primary/10 text-primary gap-1"><TrendingDown className="h-3 w-3" />حالتك تتحسن!</Badge>}
        {trend === 'declining' && <Badge variant="destructive" className="gap-1"><TrendingUp className="h-3 w-3" />انتبه — مؤشراتك تتراجع</Badge>}
        {trend === 'stable' && <Badge variant="outline" className="gap-1">حالتك مستقرة</Badge>}
      </div>

      {/* 3-day decline alert */}
      {declineAlert && (
        <Card className="border-destructive/30 bg-destructive/5">
          <CardContent className="p-3 flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-destructive shrink-0" />
            <p className="text-xs text-destructive">⚠️ مؤشر التوتر يرتفع منذ 3 أيام — خذ استراحة أو استشر المدرب الصحي</p>
          </CardContent>
        </Card>
      )}

      {/* Daily comparison */}
      {dailyComparison && (
        <Card>
          <CardContent className="p-3">
            <p className="text-[10px] text-muted-foreground mb-2 font-medium">مقارنة اليوم بالأمس</p>
            <div className="flex gap-4 justify-center">
              <div className="text-center">
                <p className="text-xs text-muted-foreground">التوتر</p>
                <p className={cn('text-sm font-bold', dailyComparison.stressChange > 0 ? 'text-destructive' : 'text-primary')}>
                  {dailyComparison.stressChange > 0 ? '↑' : '↓'}{Math.abs(dailyComparison.stressChange)}%
                </p>
              </div>
              <div className="text-center">
                <p className="text-xs text-muted-foreground">الطاقة</p>
                <p className={cn('text-sm font-bold', dailyComparison.energyChange > 0 ? 'text-primary' : 'text-destructive')}>
                  {dailyComparison.energyChange > 0 ? '↑' : '↓'}{Math.abs(dailyComparison.energyChange)}%
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Averages */}
      <div className="grid grid-cols-4 gap-2">
        {[
          { icon: Heart, label: 'النبض', value: averages.hr, unit: 'bpm', color: 'text-destructive' },
          { icon: Brain, label: 'التوتر', value: averages.stress, unit: '%', color: averages.stress > 60 ? 'text-destructive' : 'text-primary' },
          { icon: Zap, label: 'الطاقة', value: averages.energy, unit: '%', color: 'text-primary' },
          { icon: Activity, label: 'الإنتاج', value: averages.prod, unit: '%', color: 'text-accent-foreground' },
        ].map(m => (
          <Card key={m.label} className="border-0 shadow-sm">
            <CardContent className="p-2 text-center">
              <m.icon className={cn('h-4 w-4 mx-auto mb-0.5', m.color)} />
              <p className="text-lg font-bold">{m.value}<span className="text-[8px] text-muted-foreground">{m.unit}</span></p>
              <p className="text-[9px] text-muted-foreground">{m.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Chart */}
      {chartData.length > 1 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs">تطور المؤشرات</CardTitle>
          </CardHeader>
          <CardContent className="p-2">
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="date" tick={{ fontSize: 9 }} />
                <YAxis tick={{ fontSize: 9 }} />
                <Tooltip contentStyle={{ fontSize: 11, direction: 'rtl' }} />
                <Line type="monotone" dataKey="stress" name="التوتر" stroke="hsl(var(--destructive))" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="energy" name="الطاقة" stroke="hsl(var(--primary))" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* Recent measurements */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-xs">آخر القياسات ({data.length})</CardTitle>
        </CardHeader>
        <CardContent className="p-2 space-y-1 max-h-48 overflow-y-auto">
          {data.slice(0, 15).map(m => (
            <div key={m.id} className="flex items-center justify-between p-2 bg-muted/30 rounded-lg">
              <div>
                <Badge variant="outline" className="text-[9px]">{m.measurement_type}</Badge>
                <span className="text-[10px] text-muted-foreground mr-2">
                  {new Date(m.measured_at).toLocaleString('ar-EG', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
              <div className="flex gap-2 text-[10px]">
                {m.heart_rate && <span>❤️{m.heart_rate}</span>}
                {m.stress !== undefined && <span>😰{m.stress}%</span>}
                {m.energy !== undefined && <span>⚡{m.energy}%</span>}
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
};

export default HealthHistoryTab;
