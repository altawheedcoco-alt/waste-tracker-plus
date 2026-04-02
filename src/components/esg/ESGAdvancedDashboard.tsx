/**
 * ESG Advanced Dashboard — Interactive environmental impact analytics
 * with goal tracking, trend charts, and waste breakdown visualization.
 */
import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useEnvironmentalKPIs, type EnvironmentalKPIs } from '@/hooks/useEnvironmentalKPIs';
import { cn } from '@/lib/utils';
import {
  Leaf, TreePine, Car, Zap, Droplets, TrendingUp, TrendingDown,
  Recycle, Factory, Target, Award, Home, BarChart3, ChevronLeft
} from 'lucide-react';
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts';
import { useNavigate } from 'react-router-dom';

type Period = 'month' | 'quarter' | 'year' | 'all';

const CHART_COLORS = [
  'hsl(var(--chart-1, 142 71% 45%))',
  'hsl(var(--chart-2, 217 91% 60%))',
  'hsl(var(--chart-3, 47 96% 53%))',
  'hsl(var(--chart-4, 0 84% 60%))',
  'hsl(var(--chart-5, 262 83% 58%))',
];

const PIE_COLORS = ['#22c55e', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#ec4899', '#84cc16'];

// ESG goals (configurable per org in future)
const ESG_GOALS = {
  recyclingRate: 80,
  co2ReductionTons: 100,
  waterSavedM3: 500,
  energySavedKWh: 50000,
};

interface ESGAdvancedDashboardProps {
  embedded?: boolean;
}

const ESGAdvancedDashboard = ({ embedded = false }: ESGAdvancedDashboardProps) => {
  const [period, setPeriod] = useState<Period>('year');
  const { data: kpis, isLoading } = useEnvironmentalKPIs(period);
  const navigate = useNavigate();

  const periodLabels: Record<Period, string> = {
    month: 'هذا الشهر', quarter: 'هذا الربع', year: 'هذه السنة', all: 'الكل',
  };

  const esgScore = useMemo(() => {
    if (!kpis) return 0;
    const rateScore = Math.min(kpis.recyclingRate, 100) * 0.4;
    const co2Score = Math.min((kpis.co2SavedTons / ESG_GOALS.co2ReductionTons) * 100, 100) * 0.3;
    const diversityScore = Math.min(kpis.wasteByType.length * 15, 100) * 0.15;
    const trendScore = kpis.monthlyTrend.length > 1 ? 70 : 40;
    return Math.round(rateScore + co2Score + diversityScore * 0.15 + trendScore * 0.15);
  }, [kpis]);

  const esgGrade = esgScore >= 90 ? 'A+' : esgScore >= 80 ? 'A' : esgScore >= 70 ? 'B+' :
    esgScore >= 60 ? 'B' : esgScore >= 50 ? 'C' : 'D';

  const gradeColor = esgScore >= 80 ? 'text-emerald-600' : esgScore >= 60 ? 'text-amber-600' : 'text-red-600';

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-full" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[...Array(8)].map((_, i) => <Skeleton key={i} className="h-24" />)}
        </div>
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!kpis || kpis.totalWasteTons === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <Leaf className="h-12 w-12 mx-auto text-muted-foreground/40 mb-3" />
          <p className="text-muted-foreground">لا توجد بيانات بيئية كافية لعرض لوحة ESG</p>
          <p className="text-xs text-muted-foreground mt-1">ابدأ بتسجيل شحنات مخلفات لتفعيل التتبع البيئي</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header with period selector */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <Leaf className="h-5 w-5 text-emerald-600" />
          <h2 className="text-lg font-bold">لوحة ESG المتقدمة</h2>
          <Badge className={cn('text-xs', gradeColor)} variant="outline">
            تقييم {esgGrade}
          </Badge>
        </div>
        <div className="flex gap-1">
          {(['month', 'quarter', 'year', 'all'] as Period[]).map(p => (
            <Button
              key={p}
              variant={period === p ? 'default' : 'outline'}
              size="sm"
              className={cn('h-7 text-xs', period === p && 'bg-emerald-600 hover:bg-emerald-700')}
              onClick={() => setPeriod(p)}
            >
              {periodLabels[p]}
            </Button>
          ))}
        </div>
      </div>

      {/* ESG Score Card */}
      <Card className="border-emerald-200 dark:border-emerald-800 bg-gradient-to-l from-emerald-50/50 to-teal-50/50 dark:from-emerald-950/30 dark:to-teal-950/30">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <GoalProgress label="التدوير" value={kpis.recyclingRate} goal={ESG_GOALS.recyclingRate} icon={<Recycle className="h-3.5 w-3.5" />} />
              <GoalProgress label="CO₂" value={kpis.co2SavedTons} goal={ESG_GOALS.co2ReductionTons} unit="طن" icon={<Leaf className="h-3.5 w-3.5" />} />
              <GoalProgress label="المياه" value={kpis.waterSavedLiters / 1000} goal={ESG_GOALS.waterSavedM3} unit="م³" icon={<Droplets className="h-3.5 w-3.5" />} />
            </div>
            <div className="text-center">
              <div className={cn('text-4xl font-black', gradeColor)}>{esgGrade}</div>
              <p className="text-[10px] text-muted-foreground">نقاط ESG: {esgScore}/100</p>
              <Progress value={esgScore} className="h-1.5 w-20 mt-1" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* KPI Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <MetricCard icon={<Recycle className="h-4 w-4 text-emerald-600" />} label="مخلفات مُدوّرة" value={kpis.recycledTons} unit="طن" trend={kpis.monthlyTrend} />
        <MetricCard icon={<Leaf className="h-4 w-4 text-green-600" />} label="CO₂ تم توفيره" value={kpis.co2SavedTons} unit="طن" trend={kpis.monthlyTrend} field="co2" />
        <MetricCard icon={<TreePine className="h-4 w-4 text-green-700" />} label="مكافئ أشجار" value={kpis.treesEquivalent} unit="شجرة/سنة" />
        <MetricCard icon={<Car className="h-4 w-4 text-blue-600" />} label="سيارات من الطريق" value={kpis.carsOffRoad} unit="سيارة/سنة" />
        <MetricCard icon={<Droplets className="h-4 w-4 text-cyan-600" />} label="مياه تم توفيرها" value={kpis.waterSavedLiters / 1000} unit="م³" />
        <MetricCard icon={<Zap className="h-4 w-4 text-amber-500" />} label="طاقة تم توفيرها" value={kpis.energySavedKWh} unit="kWh" />
        <MetricCard icon={<Home className="h-4 w-4 text-purple-600" />} label="مكافئ منازل" value={kpis.homesEnergySaved} unit="منزل/سنة" />
        <MetricCard icon={<Factory className="h-4 w-4 text-orange-600" />} label="تحويل عن المدافن" value={kpis.landfillDivertedTons} unit="طن" />
      </div>

      {/* Charts Tabs */}
      <Tabs defaultValue="trend" dir="rtl">
        <TabsList className="w-full justify-start">
          <TabsTrigger value="trend" className="text-xs gap-1"><BarChart3 className="h-3.5 w-3.5" />الاتجاه الشهري</TabsTrigger>
          <TabsTrigger value="breakdown" className="text-xs gap-1"><Recycle className="h-3.5 w-3.5" />توزيع المخلفات</TabsTrigger>
          <TabsTrigger value="impact" className="text-xs gap-1"><Target className="h-3.5 w-3.5" />الأثر البيئي</TabsTrigger>
        </TabsList>

        <TabsContent value="trend">
          <TrendChart data={kpis.monthlyTrend} />
        </TabsContent>
        <TabsContent value="breakdown">
          <WasteBreakdownChart data={kpis.wasteByType} />
        </TabsContent>
        <TabsContent value="impact">
          <ImpactComparisonChart kpis={kpis} />
        </TabsContent>
      </Tabs>

      {/* Actions */}
      {!embedded && (
        <div className="flex gap-2 flex-wrap">
          <Button variant="outline" size="sm" className="text-xs" onClick={() => navigate('/dashboard/carbon-footprint')}>
            <ChevronLeft className="h-3.5 w-3.5 ml-1" />البصمة الكربونية التفصيلية
          </Button>
          <Button variant="outline" size="sm" className="text-xs" onClick={() => navigate('/dashboard/environmental-sustainability')}>
            <ChevronLeft className="h-3.5 w-3.5 ml-1" />تقرير الاستدامة الكامل
          </Button>
        </div>
      )}
    </div>
  );
};

// --- Sub-components ---

const GoalProgress = ({ label, value, goal, unit, icon }: { label: string; value: number; goal: number; unit?: string; icon: React.ReactNode }) => {
  const pct = Math.min(Math.round((value / goal) * 100), 100);
  const achieved = pct >= 100;
  return (
    <div className="text-center min-w-[60px]">
      <div className="flex items-center justify-center gap-1 text-muted-foreground mb-0.5">{icon}<span className="text-[10px]">{label}</span></div>
      <div className="text-sm font-bold">{value.toLocaleString('ar-EG', { maximumFractionDigits: 1 })}{unit ? <span className="text-[9px] font-normal text-muted-foreground mr-0.5">{unit}</span> : '%'}</div>
      <Progress value={pct} className={cn('h-1 w-16 mx-auto', achieved && '[&>div]:bg-emerald-500')} />
      <p className="text-[9px] text-muted-foreground">{achieved ? <span className="text-emerald-600">✓ تم التحقيق</span> : `${pct}% من الهدف`}</p>
    </div>
  );
};

const MetricCard = ({ icon, label, value, unit, trend, field }: {
  icon: React.ReactNode; label: string; value: number; unit: string;
  trend?: EnvironmentalKPIs['monthlyTrend']; field?: 'co2';
}) => {
  const trendPct = useMemo(() => {
    if (!trend || trend.length < 2) return null;
    const last = trend[trend.length - 1];
    const prev = trend[trend.length - 2];
    const lastVal = field === 'co2' ? last.co2 : last.tons;
    const prevVal = field === 'co2' ? prev.co2 : prev.tons;
    if (prevVal === 0) return null;
    return Math.round(((lastVal - prevVal) / prevVal) * 100);
  }, [trend, field]);

  return (
    <Card className="border-border/50">
      <CardContent className="p-3 text-center">
        <div className="flex items-center justify-center mb-1">{icon}</div>
        <div className="text-lg font-bold">{value.toLocaleString('ar-EG', { maximumFractionDigits: 1 })}</div>
        <p className="text-[10px] text-muted-foreground">{unit}</p>
        <p className="text-[9px] text-muted-foreground mt-0.5">{label}</p>
        {trendPct !== null && (
          <Badge variant="outline" className={cn('text-[8px] h-4 mt-1', trendPct >= 0 ? 'text-emerald-600 border-emerald-300' : 'text-red-600 border-red-300')}>
            {trendPct >= 0 ? <TrendingUp className="h-2.5 w-2.5 ml-0.5" /> : <TrendingDown className="h-2.5 w-2.5 ml-0.5" />}
            {Math.abs(trendPct)}%
          </Badge>
        )}
      </CardContent>
    </Card>
  );
};

const TrendChart = ({ data }: { data: EnvironmentalKPIs['monthlyTrend'] }) => {
  if (data.length === 0) return <Card><CardContent className="py-8 text-center text-sm text-muted-foreground">لا توجد بيانات شهرية كافية</CardContent></Card>;

  const formatted = data.map(d => ({
    ...d,
    monthLabel: d.month.substring(5), // MM
    tons: Math.round(d.tons * 100) / 100,
    co2: Math.round(d.co2 * 100) / 100,
  }));

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center gap-1.5">
          <BarChart3 className="h-4 w-4 text-emerald-600" />الاتجاه الشهري
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={250}>
          <AreaChart data={formatted}>
            <defs>
              <linearGradient id="gradTons" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="gradCO2" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
            <XAxis dataKey="monthLabel" tick={{ fontSize: 10 }} />
            <YAxis tick={{ fontSize: 10 }} />
            <Tooltip contentStyle={{ fontSize: 11, direction: 'rtl' }} />
            <Legend wrapperStyle={{ fontSize: 11 }} />
            <Area type="monotone" dataKey="tons" name="طن مخلفات" stroke="#22c55e" fill="url(#gradTons)" strokeWidth={2} />
            <Area type="monotone" dataKey="co2" name="طن CO₂" stroke="#3b82f6" fill="url(#gradCO2)" strokeWidth={2} />
          </AreaChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};

const WasteBreakdownChart = ({ data }: { data: EnvironmentalKPIs['wasteByType'] }) => {
  if (data.length === 0) return <Card><CardContent className="py-8 text-center text-sm text-muted-foreground">لا توجد بيانات</CardContent></Card>;

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center gap-1.5">
          <Recycle className="h-4 w-4 text-emerald-600" />توزيع المخلفات حسب النوع
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie data={data} dataKey="tons" nameKey="type" cx="50%" cy="50%" outerRadius={80} label={({ type, tons }) => `${type}: ${tons}`} labelLine={false}>
                {data.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
              </Pie>
              <Tooltip contentStyle={{ fontSize: 11, direction: 'rtl' }} />
            </PieChart>
          </ResponsiveContainer>
          <div className="space-y-2">
            {data.map((w, i) => (
              <div key={w.type} className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: PIE_COLORS[i % PIE_COLORS.length] }} />
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between text-xs">
                    <span className="font-medium truncate">{w.type}</span>
                    <span className="text-muted-foreground">{w.tons} طن</span>
                  </div>
                  <Progress value={(w.tons / (data[0]?.tons || 1)) * 100} className="h-1 mt-0.5" />
                </div>
                <Badge variant="outline" className="text-[9px] h-4 shrink-0">{w.co2} CO₂</Badge>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

const ImpactComparisonChart = ({ kpis }: { kpis: EnvironmentalKPIs }) => {
  const data = [
    { name: 'أشجار مكافئة', value: kpis.treesEquivalent, color: '#22c55e' },
    { name: 'سيارات', value: kpis.carsOffRoad, color: '#3b82f6' },
    { name: 'منازل', value: kpis.homesEnergySaved, color: '#8b5cf6' },
    { name: 'طاقة (MWh)', value: Math.round(kpis.energySavedKWh / 1000), color: '#f59e0b' },
    { name: 'مياه (م³)', value: Math.round(kpis.waterSavedLiters / 1000), color: '#06b6d4' },
  ];

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center gap-1.5">
          <Target className="h-4 w-4 text-emerald-600" />مقارنة الأثر البيئي
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={250}>
          <BarChart data={data} layout="vertical">
            <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
            <XAxis type="number" tick={{ fontSize: 10 }} />
            <YAxis type="category" dataKey="name" tick={{ fontSize: 10 }} width={80} />
            <Tooltip contentStyle={{ fontSize: 11, direction: 'rtl' }} />
            <Bar dataKey="value" name="القيمة" radius={[0, 4, 4, 0]}>
              {data.map((d, i) => <Cell key={i} fill={d.color} />)}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};

export default ESGAdvancedDashboard;
