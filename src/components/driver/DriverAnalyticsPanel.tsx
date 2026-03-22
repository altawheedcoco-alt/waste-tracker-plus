/**
 * لوحة تحليلات أداء السائق مع رسوم بيانية ورؤى ذكية + تحليل AI
 */
import { lazy, Suspense } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  BarChart3, TrendingUp, TrendingDown, Star,
  Package, Banknote, Clock, Target, Lightbulb, Zap,
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, AreaChart, Area,
} from 'recharts';
import { useDriverAnalytics } from '@/hooks/useDriverAnalytics';
import { motion } from 'framer-motion';

const DriverAIInsights = lazy(() => import('@/components/driver/DriverAIInsights'));

interface DriverAnalyticsPanelProps {
  driverId: string;
  driverType?: string;
}

const COLORS = [
  'hsl(var(--primary))',
  'hsl(var(--chart-2, 160 60% 45%))',
  'hsl(var(--chart-3, 30 80% 55%))',
  'hsl(var(--chart-4, 280 65% 60%))',
  'hsl(var(--chart-5, 340 75% 55%))',
  'hsl(var(--muted-foreground))',
];

const StatCard = ({ icon: Icon, label, value, subtext, trend }: {
  icon: typeof Star; label: string; value: string; subtext?: string;
  trend?: 'up' | 'down' | 'neutral';
}) => (
  <motion.div
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    className="p-3 rounded-xl bg-card border border-border/50 text-center"
  >
    <Icon className="w-4 h-4 mx-auto mb-1 text-primary" />
    <p className="text-lg font-bold">{value}</p>
    <p className="text-[10px] text-muted-foreground">{label}</p>
    {subtext && (
      <div className="flex items-center justify-center gap-0.5 mt-0.5">
        {trend === 'up' && <TrendingUp className="w-3 h-3 text-emerald-500" />}
        {trend === 'down' && <TrendingDown className="w-3 h-3 text-destructive" />}
        <span className="text-[9px] text-muted-foreground">{subtext}</span>
      </div>
    )}
  </motion.div>
);

/** رؤى ذكية بناءً على البيانات */
function generateInsights(data: ReturnType<typeof useDriverAnalytics>['data']) {
  if (!data) return [];
  const insights: { icon: typeof Lightbulb; text: string; type: 'tip' | 'warning' | 'success' }[] = [];

  if (data.completionRate >= 0.9) {
    insights.push({ icon: Zap, text: `معدل إتمام ممتاز ${(data.completionRate * 100).toFixed(0)}% — استمر!`, type: 'success' });
  } else if (data.completionRate < 0.7 && data.totalTrips > 5) {
    insights.push({ icon: Target, text: 'معدل الإتمام أقل من 70% — حاول تقليل الإلغاءات لتحسين سمعتك', type: 'warning' });
  }

  if (data.peakHours.length > 0) {
    const peak = data.peakHours.reduce((a, b) => b.count > a.count ? b : a);
    insights.push({ icon: Clock, text: `أكثر ساعاتك نشاطاً: ${peak.hour}:00 — ركّز توفرك في هذا الوقت`, type: 'tip' });
  }

  if (data.avgRating >= 4.5 && data.totalRatings >= 10) {
    insights.push({ icon: Star, text: `تقييمك ${data.avgRating}/5 يؤهلك لعروض مميزة وأولوية في التوزيع`, type: 'success' });
  }

  if (data.wasteTypeBreakdown.length > 0) {
    const top = data.wasteTypeBreakdown[0];
    insights.push({ icon: Lightbulb, text: `تخصصك الأبرز: "${top.type}" (${top.count} شحنة) — اعتبره نقطة قوتك`, type: 'tip' });
  }

  return insights;
}

const INSIGHT_COLORS = {
  tip: 'border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-950',
  warning: 'border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950',
  success: 'border-emerald-200 bg-emerald-50 dark:border-emerald-800 dark:bg-emerald-950',
};

const DriverAnalyticsPanel = ({ driverId, driverType }: DriverAnalyticsPanelProps) => {
  const { data, isLoading } = useDriverAnalytics(driverId);

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-24 w-full rounded-xl" />
        <Skeleton className="h-48 w-full rounded-xl" />
        <Skeleton className="h-32 w-full rounded-xl" />
      </div>
    );
  }

  if (!data || data.totalTrips === 0) {
    return (
      <Card className="border-dashed">
        <CardContent className="p-8 text-center">
          <BarChart3 className="h-12 w-12 mx-auto mb-3 text-muted-foreground/30" />
          <h3 className="font-semibold text-sm mb-1">لا توجد بيانات كافية</h3>
          <p className="text-xs text-muted-foreground">ستظهر التحليلات بعد إتمام أولى رحلاتك</p>
        </CardContent>
      </Card>
    );
  }

  const insights = generateInsights(data);
  const monthLabels = data.monthlyTrends.map(m => {
    const [, month] = m.month.split('-');
    const months = ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'];
    return { ...m, monthLabel: months[parseInt(month) - 1] || month };
  });

  return (
    <div className="space-y-4">
      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        <StatCard icon={Package} label="إجمالي الرحلات" value={String(data.totalTrips)} />
        <StatCard
          icon={Target}
          label="معدل الإتمام"
          value={`${(data.completionRate * 100).toFixed(0)}%`}
          trend={data.completionRate >= 0.8 ? 'up' : 'down'}
        />
        <StatCard icon={Banknote} label="إجمالي الأرباح" value={`${data.totalEarnings.toLocaleString()} ج.م`} />
        <StatCard
          icon={Star}
          label="التقييم"
          value={data.avgRating > 0 ? `${data.avgRating}/5` : '—'}
          subtext={data.totalRatings > 0 ? `${data.totalRatings} تقييم` : undefined}
        />
      </div>

      {/* Monthly Trends Chart */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-primary" />
            اتجاه الرحلات (6 أشهر)
          </CardTitle>
        </CardHeader>
        <CardContent className="pb-3">
          <ResponsiveContainer width="100%" height={180}>
            <AreaChart data={monthLabels}>
              <defs>
                <linearGradient id="tripGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                  <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="monthLabel" tick={{ fontSize: 10 }} />
              <YAxis tick={{ fontSize: 10 }} width={30} />
              <Tooltip
                contentStyle={{ fontSize: 11, borderRadius: 8 }}
                formatter={(v: number) => [v, 'رحلة']}
              />
              <Area
                type="monotone"
                dataKey="trips"
                stroke="hsl(var(--primary))"
                fill="url(#tripGrad)"
                strokeWidth={2}
              />
            </AreaChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Waste Type & Peak Hours side by side */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {/* Waste type distribution */}
        {data.wasteTypeBreakdown.length > 0 && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">توزيع أنواع النفايات</CardTitle>
            </CardHeader>
            <CardContent className="pb-3">
              <ResponsiveContainer width="100%" height={160}>
                <PieChart>
                  <Pie
                    data={data.wasteTypeBreakdown}
                    dataKey="count"
                    nameKey="type"
                    cx="50%"
                    cy="50%"
                    outerRadius={60}
                    innerRadius={30}
                    paddingAngle={3}
                    label={({ type }) => type}
                  >
                    {data.wasteTypeBreakdown.map((_, i) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(v: number) => [v, 'شحنة']} />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}

        {/* Peak hours */}
        {data.peakHours.length > 0 && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <Clock className="w-4 h-4 text-muted-foreground" />
                ساعات الذروة
              </CardTitle>
            </CardHeader>
            <CardContent className="pb-3">
              <ResponsiveContainer width="100%" height={160}>
                <BarChart data={data.peakHours}>
                  <XAxis dataKey="hour" tick={{ fontSize: 9 }} tickFormatter={(h) => `${h}:00`} />
                  <YAxis tick={{ fontSize: 9 }} width={25} />
                  <Tooltip formatter={(v: number) => [v, 'شحنة']} labelFormatter={(h) => `الساعة ${h}:00`} />
                  <Bar dataKey="count" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}
      </div>

      {/* AI Insights */}
      {insights.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Lightbulb className="w-4 h-4 text-amber-500" />
              رؤى ذكية
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 pb-3">
            {insights.map((insight, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.1 }}
                className={`flex items-start gap-2 p-2.5 rounded-lg border ${INSIGHT_COLORS[insight.type]}`}
              >
                <insight.icon className="w-4 h-4 shrink-0 mt-0.5" />
                <p className="text-xs leading-relaxed">{insight.text}</p>
              </motion.div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default DriverAnalyticsPanel;
