import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Users, Brain, Zap, Heart, AlertTriangle, CheckCircle2, TrendingUp, ShieldAlert } from 'lucide-react';
import { useHealthHistory } from '@/hooks/useHealthHistory';
import { cn } from '@/lib/utils';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const TeamHealthTab = () => {
  const { teamStats } = useHealthHistory();
  const data = teamStats.data || [];

  const stats = useMemo(() => {
    if (!data.length) return null;

    const withStress = data.filter(d => d.stress !== undefined && d.stress !== null);
    const withEnergy = data.filter(d => d.energy !== undefined && d.energy !== null);
    const withHR = data.filter(d => d.heart_rate !== undefined && d.heart_rate !== null);

    const avgStress = withStress.length ? Math.round(withStress.reduce((a, d) => a + (d.stress || 0), 0) / withStress.length) : 0;
    const avgEnergy = withEnergy.length ? Math.round(withEnergy.reduce((a, d) => a + (d.energy || 0), 0) / withEnergy.length) : 0;
    const avgHR = withHR.length ? Math.round(withHR.reduce((a, d) => a + (d.heart_rate || 0), 0) / withHR.length) : 0;
    const highStressCount = withStress.filter(d => (d.stress || 0) > 70).length;
    const totalMeasurements = data.length;

    // Group by day
    const byDay: Record<string, { stress: number[]; energy: number[] }> = {};
    data.forEach(d => {
      const day = new Date(d.measured_at!).toLocaleDateString('ar-EG', { weekday: 'short' });
      if (!byDay[day]) byDay[day] = { stress: [], energy: [] };
      if (d.stress) byDay[day].stress.push(d.stress);
      if (d.energy) byDay[day].energy.push(d.energy);
    });

    const chartData = Object.entries(byDay).map(([day, vals]) => ({
      day,
      stress: Math.round(vals.stress.reduce((a, b) => a + b, 0) / (vals.stress.length || 1)),
      energy: Math.round(vals.energy.reduce((a, b) => a + b, 0) / (vals.energy.length || 1)),
    })).reverse().slice(0, 7);

    return { avgStress, avgEnergy, avgHR, highStressCount, totalMeasurements, chartData };
  }, [data]);

  if (!stats) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <Users className="h-12 w-12 text-muted-foreground/30 mx-auto mb-3" />
          <p className="text-sm font-medium text-muted-foreground">لا توجد بيانات صحية للفريق</p>
          <p className="text-[10px] text-muted-foreground mt-1">سيظهر هنا ملخص مجهول الهوية لصحة الفريق عند توفر قياسات</p>
        </CardContent>
      </Card>
    );
  }

  const teamLevel = stats.avgStress > 60 ? 'critical' : stats.avgStress > 40 ? 'moderate' : 'healthy';
  const levelConfig = {
    healthy: { label: 'الفريق بصحة جيدة', color: 'text-primary', bg: 'bg-primary/10', icon: CheckCircle2 },
    moderate: { label: 'مستوى توتر متوسط', color: 'text-secondary-foreground', bg: 'bg-secondary/30', icon: TrendingUp },
    critical: { label: '⚠️ تنبيه: إجهاد مرتفع', color: 'text-destructive', bg: 'bg-destructive/10', icon: ShieldAlert },
  }[teamLevel];

  return (
    <div className="space-y-4">
      {/* Team Status Hero */}
      <Card className={cn('border-0', levelConfig.bg)}>
        <CardContent className="p-4 flex items-center gap-3">
          <levelConfig.icon className={cn('h-8 w-8', levelConfig.color)} />
          <div>
            <p className={cn('text-sm font-bold', levelConfig.color)}>{levelConfig.label}</p>
            <p className="text-[10px] text-muted-foreground">{stats.totalMeasurements} قياس خلال الأسبوع</p>
          </div>
        </CardContent>
      </Card>

      {/* KPIs */}
      <div className="grid grid-cols-4 gap-2">
        {[
          { icon: Brain, label: 'التوتر', value: `${stats.avgStress}%`, color: stats.avgStress > 60 ? 'text-destructive' : 'text-primary' },
          { icon: Zap, label: 'الطاقة', value: `${stats.avgEnergy}%`, color: 'text-primary' },
          { icon: Heart, label: 'النبض', value: `${stats.avgHR}`, color: 'text-destructive' },
          { icon: AlertTriangle, label: 'إجهاد عالٍ', value: `${stats.highStressCount}`, color: 'text-orange-500' },
        ].map(m => (
          <Card key={m.label} className="border-0 shadow-sm">
            <CardContent className="p-2 text-center">
              <m.icon className={cn('h-3.5 w-3.5 mx-auto mb-0.5', m.color)} />
              <p className="text-lg font-bold">{m.value}</p>
              <p className="text-[8px] text-muted-foreground">{m.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Chart */}
      {stats.chartData.length > 1 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs flex items-center gap-2">
              <Users className="h-3.5 w-3.5" />
              مؤشرات الفريق الأسبوعية (مجهولة الهوية)
            </CardTitle>
          </CardHeader>
          <CardContent className="p-2">
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={stats.chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="day" tick={{ fontSize: 9 }} />
                <YAxis tick={{ fontSize: 9 }} />
                <Tooltip contentStyle={{ fontSize: 11, direction: 'rtl' }} />
                <Bar dataKey="stress" name="التوتر" fill="hsl(var(--destructive))" radius={[4, 4, 0, 0]} />
                <Bar dataKey="energy" name="الطاقة" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* Recommendations */}
      {teamLevel === 'critical' && (
        <Card className="border-destructive/20">
          <CardContent className="p-4 space-y-2">
            <p className="text-xs font-bold text-destructive flex items-center gap-1">
              <ShieldAlert className="h-4 w-4" />توصيات عاجلة
            </p>
            <ul className="space-y-1 text-[11px] text-muted-foreground">
              <li>• منح العاملين استراحات إضافية هذا الأسبوع</li>
              <li>• مراجعة جدول الورديات وتقليل الضغط</li>
              <li>• تفعيل جلسات التنفس الجماعي الصباحية</li>
            </ul>
          </CardContent>
        </Card>
      )}

      <p className="text-[9px] text-muted-foreground text-center">
        🔒 جميع البيانات مجهولة الهوية — لا يمكن ربطها بموظف محدد
      </p>
    </div>
  );
};

export default TeamHealthTab;
