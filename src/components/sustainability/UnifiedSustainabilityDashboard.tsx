import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { Tooltip as UITooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell, RadialBarChart, RadialBar,
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts';
import {
  Leaf, TreePine, Car, Droplets, Factory, Recycle, Award, Download,
  TrendingUp, TrendingDown, Fuel, Shield, Zap, Waves,
  BarChart3, Globe, Target, Sparkles, CheckCircle, XCircle, AlertCircle,
  Coins, Building2, Smartphone, TreeDeciduous, Palmtree,
} from 'lucide-react';
import {
  generateEntityReport,
  EntitySustainabilityReport,
  EntityType,
  LEVEL_CONFIG,
  ENTITY_TYPE_LABELS,
  SCORE_AXIS_LABELS,
  WasteTypeAnalysis,
  SDGAlignment,
  RegulatoryCompliance,
  ScoreBreakdown,
} from '@/lib/sustainabilityEngine';

const COLORS = ['#10B981', '#3B82F6', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#14B8A6', '#F97316'];

const UnifiedSustainabilityDashboard = () => {
  const { organization } = useAuth();
  const entityType = (organization?.organization_type as EntityType) || 'generator';

  const [period, setPeriod] = useState(() => `${new Date().getFullYear()}`);

  const periodDates = useMemo(() => {
    const year = parseInt(period);
    return { start: `${year}-01-01T00:00:00`, end: `${year}-12-31T23:59:59` };
  }, [period]);

  const { data: report, isLoading } = useQuery({
    queryKey: ['sustainability-report', organization?.id, period],
    queryFn: () => generateEntityReport(organization!.id, entityType, periodDates.start, periodDates.end),
    enabled: !!organization?.id,
    staleTime: 10 * 60 * 1000,
  });

  const yearOptions = useMemo(() => {
    const y = new Date().getFullYear();
    return [y, y - 1, y - 2, y - 3].map(v => ({ value: String(v), label: String(v) }));
  }, []);

  if (isLoading) return <DashboardSkeleton />;
  if (!report) return <EmptyState />;

  const levelConfig = LEVEL_CONFIG[report.sustainabilityLevel];

  return (
    <div className="space-y-6" dir="rtl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Globe className="h-6 w-6 text-emerald-600" />
            تقرير الاستدامة البيئية الشامل
          </h2>
          <p className="text-muted-foreground text-sm">
            {ENTITY_TYPE_LABELS[entityType]} — GRI · SASB · ISO 14001 · اتفاقية بازل · القانون المصري
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={period} onValueChange={setPeriod}>
            <SelectTrigger className="w-[120px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              {yearOptions.map(y => <SelectItem key={y.value} value={y.value}>{y.label}</SelectItem>)}
            </SelectContent>
          </Select>
          <Badge className={`${levelConfig.bg} ${levelConfig.color} ${levelConfig.border} border text-sm px-3 py-1`}>
            {levelConfig.icon} {levelConfig.label}
          </Badge>
        </div>
      </div>

      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="flex flex-wrap h-auto gap-1">
          <TabsTrigger value="overview" className="gap-1 text-xs"><BarChart3 className="h-3 w-3" />نظرة عامة</TabsTrigger>
          <TabsTrigger value="carbon" className="gap-1 text-xs"><Factory className="h-3 w-3" />البصمة الكربونية</TabsTrigger>
          <TabsTrigger value="waste" className="gap-1 text-xs"><Recycle className="h-3 w-3" />تحليل المخلفات</TabsTrigger>
          <TabsTrigger value="circular" className="gap-1 text-xs"><Coins className="h-3 w-3" />الاقتصاد الدائري</TabsTrigger>
          <TabsTrigger value="sdg" className="gap-1 text-xs"><Globe className="h-3 w-3" />أهداف التنمية</TabsTrigger>
          <TabsTrigger value="compliance" className="gap-1 text-xs"><Shield className="h-3 w-3" />الامتثال التنظيمي</TabsTrigger>
          <TabsTrigger value="equivalents" className="gap-1 text-xs"><TreePine className="h-3 w-3" />المكافئات البيئية</TabsTrigger>
          <TabsTrigger value="gri" className="gap-1 text-xs"><Award className="h-3 w-3" />مؤشرات ESG</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4 mt-4"><OverviewTab report={report} levelConfig={levelConfig} entityType={entityType} /></TabsContent>
        <TabsContent value="carbon" className="space-y-4 mt-4"><CarbonTab report={report} /></TabsContent>
        <TabsContent value="waste" className="space-y-4 mt-4"><WasteTab report={report} /></TabsContent>
        <TabsContent value="circular" className="space-y-4 mt-4"><CircularEconomyTab report={report} /></TabsContent>
        <TabsContent value="sdg" className="space-y-4 mt-4"><SDGTab report={report} /></TabsContent>
        <TabsContent value="compliance" className="space-y-4 mt-4"><ComplianceTab report={report} /></TabsContent>
        <TabsContent value="equivalents" className="space-y-4 mt-4"><EquivalentsTab report={report} /></TabsContent>
        <TabsContent value="gri" className="space-y-4 mt-4"><GRITab report={report} /></TabsContent>
      </Tabs>
    </div>
  );
};

// ─── Overview Tab ────────────────────────────────────────────────────────────

const OverviewTab = ({ report, levelConfig, entityType }: { report: EntitySustainabilityReport; levelConfig: typeof LEVEL_CONFIG.platinum; entityType: EntityType }) => {
  const radarData = Object.entries(report.scoreBreakdown).map(([key, axis]) => ({
    axis: SCORE_AXIS_LABELS[key as keyof ScoreBreakdown] || key,
    value: Math.round((axis.score / axis.maxScore) * 100),
    fullMark: 100,
  }));

  return (
    <>
      <div className="grid gap-4 md:grid-cols-6">
        {/* Score radar */}
        <Card className="md:col-span-2 border-2 border-emerald-200 dark:border-emerald-800">
          <CardContent className="p-4 flex flex-col items-center">
            <ResponsiveContainer width="100%" height={200}>
              <RadarChart data={radarData}>
                <PolarGrid className="opacity-30" />
                <PolarAngleAxis dataKey="axis" tick={{ fontSize: 9 }} />
                <PolarRadiusAxis angle={90} domain={[0, 100]} tick={false} />
                <Radar dataKey="value" stroke="#10B981" fill="#10B981" fillOpacity={0.3} />
              </RadarChart>
            </ResponsiveContainer>
            <div className="text-center">
              <p className="text-4xl font-bold">{report.sustainabilityScore}</p>
              <p className="text-xs text-muted-foreground">نقاط الاستدامة (7 محاور)</p>
              <Badge className={`mt-1 ${levelConfig.bg} ${levelConfig.color} text-xs`}>
                {levelConfig.icon} {levelConfig.label}
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* KPI cards */}
        <div className="md:col-span-4 grid gap-3 grid-cols-2 lg:grid-cols-3">
          <KPICard icon={Recycle} label="إجمالي المخلفات" value={`${report.totalWasteTons} طن`} color="blue" />
          <KPICard icon={Leaf} label="تم تدويره" value={`${report.totalRecycledTons} طن`} subValue={`${report.recyclingRate}%`} color="green" />
          <KPICard
            icon={Factory} label="صافي الكربون"
            value={`${Math.abs(report.netCarbonImpact)} طن CO₂`}
            subValue={report.netCarbonImpact <= 0 ? 'أثر إيجابي ✓' : 'أثر سلبي'}
            color={report.netCarbonImpact <= 0 ? 'green' : 'red'}
          />
          <KPICard icon={Coins} label="أرصدة كربون" value={`${report.carbonCreditsEarned}`} subValue={`${report.carbonCreditsValue.toLocaleString()} ج.م`} color="amber" />
          <KPICard icon={TreePine} label="أشجار معادلة" value={report.equivalents.treesPlanted.toLocaleString()} color="emerald" />
          <KPICard icon={Globe} label="مؤشر الدورانية" value={`${(report.circularEconomy.materialCircularityIndex * 100).toFixed(0)}%`} subValue="MCI" color="blue" />
        </div>
      </div>

      {/* Score breakdown */}
      <Card>
        <CardHeader><CardTitle className="text-base flex items-center gap-2"><Target className="h-5 w-5 text-primary" />تفصيل النقاط (7 محاور)</CardTitle></CardHeader>
        <CardContent>
          <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
            {Object.entries(report.scoreBreakdown).map(([key, axis]) => (
              <div key={key} className="bg-muted/30 rounded-lg p-3">
                <div className="flex justify-between text-xs mb-1">
                  <span className="font-medium">{SCORE_AXIS_LABELS[key as keyof ScoreBreakdown]}</span>
                  <span className="font-bold">{axis.score.toFixed(1)}/{axis.maxScore}</span>
                </div>
                <Progress value={(axis.score / axis.maxScore) * 100} className="h-2" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Monthly trend */}
      {report.monthlyTrend.length > 0 && (
        <Card>
          <CardHeader><CardTitle className="text-base flex items-center gap-2"><TrendingUp className="h-5 w-5 text-primary" />الاتجاه الشهري</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={280}>
              <AreaChart data={report.monthlyTrend}>
                <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                <XAxis dataKey="monthLabel" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip />
                <Legend />
                <Area type="monotone" dataKey="waste" name="المخلفات (طن)" stroke="#3B82F6" fill="#3B82F6" fillOpacity={0.1} />
                <Area type="monotone" dataKey="recycled" name="المُدوّر (طن)" stroke="#10B981" fill="#10B981" fillOpacity={0.1} />
                <Area type="monotone" dataKey="savings" name="وفورات CO₂" stroke="#F59E0B" fill="#F59E0B" fillOpacity={0.1} />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* Entity metrics */}
      <Card>
        <CardHeader><CardTitle className="text-base flex items-center gap-2"><Target className="h-5 w-5 text-primary" />مؤشرات {ENTITY_TYPE_LABELS[entityType]}</CardTitle></CardHeader>
        <CardContent>
          <div className="grid gap-3 grid-cols-2 sm:grid-cols-3 lg:grid-cols-4">
            {Object.entries(report.entityMetrics).map(([key, value]) => (
              <div key={key} className="bg-muted/50 rounded-lg p-3 text-center">
                <p className="text-xs text-muted-foreground mb-1">{formatMetricLabel(key)}</p>
                <p className="text-lg font-bold">{typeof value === 'number' ? value.toLocaleString() : value}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </>
  );
};

// ─── Carbon Tab ──────────────────────────────────────────────────────────────

const CarbonTab = ({ report }: { report: EntitySustainabilityReport }) => {
  const scopeData = [
    { name: 'النطاق 1 (مباشر)', value: report.scope1Emissions, fill: '#EF4444' },
    { name: 'النطاق 2 (كهرباء)', value: report.scope2Emissions, fill: '#F59E0B' },
    { name: 'النطاق 3 (سلسلة القيمة)', value: report.scope3Emissions, fill: '#8B5CF6' },
  ].filter(s => s.value > 0);

  return (
    <>
      <div className="grid gap-4 md:grid-cols-4">
        <KPICard icon={Factory} label="إجمالي الانبعاثات" value={`${report.totalEmissions} طن CO₂e`} color="red" />
        <KPICard icon={Leaf} label="الوفورات البيئية" value={`${report.totalSavings} طن CO₂e`} color="green" />
        <KPICard icon={Zap} label="كثافة الكربون" value={`${report.carbonIntensity} طن/طن`} color="amber" />
        <KPICard
          icon={report.netCarbonImpact <= 0 ? TrendingDown : TrendingUp}
          label="صافي الأثر" value={`${Math.abs(report.netCarbonImpact)} طن CO₂e`}
          subValue={report.netCarbonImpact <= 0 ? '↓ أثر إيجابي' : '↑ أثر سلبي'}
          color={report.netCarbonImpact <= 0 ? 'green' : 'red'}
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader><CardTitle className="text-base">توزيع الانبعاثات حسب النطاق</CardTitle><CardDescription>GHG Protocol Scopes 1-3</CardDescription></CardHeader>
          <CardContent>
            {scopeData.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <PieChart><Pie data={scopeData} cx="50%" cy="50%" innerRadius={50} outerRadius={90} paddingAngle={3} dataKey="value"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                  {scopeData.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
                </Pie><Tooltip /></PieChart>
              </ResponsiveContainer>
            ) : <NoData />}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base">الانبعاثات حسب نوع المخلف</CardTitle></CardHeader>
          <CardContent>
            {report.wasteBreakdown.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={report.wasteBreakdown} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                  <XAxis type="number" tick={{ fontSize: 10 }} /><YAxis dataKey="wasteTypeAr" type="category" width={80} tick={{ fontSize: 11 }} />
                  <Tooltip /><Legend />
                  <Bar dataKey="totalEmissions" name="الانبعاثات" fill="#EF4444" radius={[0, 4, 4, 0]} />
                  <Bar dataKey="totalSavings" name="الوفورات" fill="#10B981" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : <NoData />}
          </CardContent>
        </Card>
      </div>

      {/* Carbon Credits */}
      <Card>
        <CardHeader><CardTitle className="text-base flex items-center gap-2"><Coins className="h-5 w-5 text-amber-600" />أرصدة الكربون المُكتسبة</CardTitle></CardHeader>
        <CardContent>
          <div className="grid gap-4 grid-cols-2 md:grid-cols-4">
            <div className="bg-emerald-50 dark:bg-emerald-950/30 rounded-lg p-4 text-center">
              <p className="text-3xl font-bold text-emerald-700 dark:text-emerald-400">{report.carbonCreditsEarned}</p>
              <p className="text-xs text-muted-foreground mt-1">رصيد كربوني (طن CO₂e)</p>
            </div>
            <div className="bg-amber-50 dark:bg-amber-950/30 rounded-lg p-4 text-center">
              <p className="text-3xl font-bold text-amber-700 dark:text-amber-400">{report.carbonCreditsValue.toLocaleString()}</p>
              <p className="text-xs text-muted-foreground mt-1">القيمة التقديرية (ج.م)</p>
            </div>
            <div className="bg-blue-50 dark:bg-blue-950/30 rounded-lg p-4 text-center">
              <p className="text-3xl font-bold text-blue-700 dark:text-blue-400">{(Math.round(report.carbonCreditsEarned * 30 * 50)).toLocaleString()}</p>
              <p className="text-xs text-muted-foreground mt-1">المكافئ بالجنيه المصري (ج.م)</p>
            </div>
            <div className="bg-violet-50 dark:bg-violet-950/30 rounded-lg p-4 text-center">
              <p className="text-lg font-mono font-bold text-violet-700 dark:text-violet-400">{report.certificateHash}</p>
              <p className="text-xs text-muted-foreground mt-1">رمز التحقق</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </>
  );
};

// ─── Waste Analysis Tab ──────────────────────────────────────────────────────

const WasteTab = ({ report }: { report: EntitySustainabilityReport }) => {
  const pieData = report.wasteBreakdown.map(w => ({ name: w.wasteTypeAr, value: w.totalTons }));

  return (
    <>
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="md:col-span-1">
          <CardHeader><CardTitle className="text-base">توزيع المخلفات</CardTitle></CardHeader>
          <CardContent>
            {pieData.length > 0 ? (
              <ResponsiveContainer width="100%" height={280}>
                <PieChart><Pie data={pieData} cx="50%" cy="50%" innerRadius={45} outerRadius={85} paddingAngle={2} dataKey="value"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                  {pieData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie><Tooltip /></PieChart>
              </ResponsiveContainer>
            ) : <NoData />}
          </CardContent>
        </Card>

        <Card className="md:col-span-2">
          <CardHeader><CardTitle className="text-base">تحليل تفصيلي حسب نوع المخلف</CardTitle><CardDescription>معدل الاسترداد · بازل · مؤشر الدورانية</CardDescription></CardHeader>
          <CardContent>
            <div className="space-y-3">
              {report.wasteBreakdown.map((w, i) => <WasteTypeRow key={w.wasteType} analysis={w} color={COLORS[i % COLORS.length]} />)}
              {report.wasteBreakdown.length === 0 && <p className="text-center text-muted-foreground text-sm py-8">لا توجد بيانات</p>}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Waste Hierarchy */}
      <Card>
        <CardHeader><CardTitle className="text-base">هرم إدارة النفايات (Waste Hierarchy)</CardTitle><CardDescription>التوزيع وفق الأولويات الأوروبية: الوقاية ← إعادة الاستخدام ← التدوير ← الاسترداد ← التخلص</CardDescription></CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[
              { key: 'prevention', label: 'الوقاية والتقليل', pct: report.wasteHierarchy.prevention, color: 'bg-emerald-500', icon: '🛡️' },
              { key: 'reuse', label: 'إعادة الاستخدام', pct: report.wasteHierarchy.reuse, color: 'bg-green-500', icon: '🔄' },
              { key: 'recycling', label: 'إعادة التدوير', pct: report.wasteHierarchy.recycling, color: 'bg-blue-500', icon: '♻️' },
              { key: 'recovery', label: 'استرداد الطاقة', pct: report.wasteHierarchy.recovery, color: 'bg-amber-500', icon: '⚡' },
              { key: 'disposal', label: 'التخلص النهائي', pct: report.wasteHierarchy.disposal, color: 'bg-red-500', icon: '🗑️' },
            ].map(level => (
              <div key={level.key} className="flex items-center gap-3">
                <span className="text-lg w-8">{level.icon}</span>
                <span className="text-sm w-32 font-medium">{level.label}</span>
                <div className="flex-1">
                  <div className="w-full bg-muted rounded-full h-4 relative overflow-hidden">
                    <div className={`h-full ${level.color} rounded-full transition-all`} style={{ width: `${Math.min(100, level.pct)}%` }} />
                  </div>
                </div>
                <span className="text-sm font-bold w-14 text-left">{level.pct}%</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </>
  );
};

const WasteTypeRow = ({ analysis, color }: { analysis: WasteTypeAnalysis; color: string }) => (
  <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors">
    <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: color }} />
    <div className="flex-1 min-w-0">
      <div className="flex items-center justify-between mb-1 gap-2">
        <div className="flex items-center gap-2">
          <span className="font-medium text-sm">{analysis.wasteTypeAr}</span>
          <Badge variant="outline" className="text-[10px] h-5">{analysis.baselCode}</Badge>
          {analysis.hazardLevel === 'hazardous' && <Badge variant="destructive" className="text-[10px] h-5">خطر</Badge>}
        </div>
        <span className="text-sm font-bold">{analysis.totalTons} طن</span>
      </div>
      <Progress value={analysis.recoveryRate} className="h-2 mb-1" />
      <div className="flex items-center gap-3 text-xs text-muted-foreground flex-wrap">
        <span>استرداد: {analysis.recoveryRate}%</span>
        <span>MCI: {(analysis.materialCircularityIndex * 100).toFixed(0)}%</span>
        <span>انبعاثات: {analysis.totalEmissions} CO₂</span>
        <span className="text-emerald-600">🌳 {analysis.equivalents.treesPlanted}</span>
      </div>
    </div>
  </div>
);

// ─── Circular Economy Tab ────────────────────────────────────────────────────

const CircularEconomyTab = ({ report }: { report: EntitySustainabilityReport }) => {
  const ce = report.circularEconomy;
  const mciPct = Math.round(ce.materialCircularityIndex * 100);

  const flowData = [
    { name: 'حلقة مغلقة', value: ce.closedLoopRate, fill: '#10B981' },
    { name: 'تدوير تنازلي', value: ce.downcyclingRate, fill: '#F59E0B' },
    { name: 'تدوير صاعد', value: ce.upcyclingRate, fill: '#3B82F6' },
    { name: 'تخلص', value: Math.max(0, 100 - ce.closedLoopRate - ce.downcyclingRate - ce.upcyclingRate), fill: '#EF4444' },
  ].filter(d => d.value > 0);

  return (
    <>
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="border-2 border-emerald-200 dark:border-emerald-800">
          <CardContent className="p-4 text-center">
            <div className="relative inline-flex items-center justify-center w-28 h-28">
              <svg className="w-28 h-28 -rotate-90">
                <circle cx="56" cy="56" r="46" fill="none" stroke="currentColor" className="text-muted/20" strokeWidth="8" />
                <circle cx="56" cy="56" r="46" fill="none" stroke="#10B981" strokeWidth="8"
                  strokeDasharray={`${mciPct * 2.89} 289`} strokeLinecap="round" />
              </svg>
              <span className="absolute text-2xl font-bold">{mciPct}%</span>
            </div>
            <p className="text-sm font-medium mt-2">مؤشر الدورانية المادية</p>
            <p className="text-xs text-muted-foreground">Ellen MacArthur Foundation MCI</p>
          </CardContent>
        </Card>

        <KPICard icon={Recycle} label="تحويل نفايات ← موارد" value={`${ce.wasteToResource}%`} color="green" />
        <KPICard icon={Leaf} label="مواد خام مُتجنّبة" value={`${ce.virginMaterialDisplacement} طن`} color="emerald" />
        <KPICard icon={Coins} label="قيمة اقتصادية مُسترجعة" value={`${(ce.economicValueRecovered / 1000).toFixed(0)}K ج.م`} color="amber" />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader><CardTitle className="text-base">تدفق المواد الدائري</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart><Pie data={flowData} cx="50%" cy="50%" innerRadius={50} outerRadius={90} paddingAngle={3} dataKey="value"
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                {flowData.map((d, i) => <Cell key={i} fill={d.fill} />)}
              </Pie><Tooltip /></PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base">مؤشرات الاقتصاد الدائري</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            {[
              { label: 'إنتاجية الموارد', value: ce.resourceProductivity, unit: 'ج.م/طن', max: 20000 },
              { label: 'معدل الحلقة المغلقة', value: ce.closedLoopRate, unit: '%', max: 100 },
              { label: 'معدل التدوير الصاعد', value: ce.upcyclingRate, unit: '%', max: 100 },
              { label: 'إزاحة المواد الخام', value: ce.virginMaterialDisplacement, unit: 'طن', max: Math.max(10, ce.virginMaterialDisplacement * 2) },
            ].map(m => (
              <div key={m.label}>
                <div className="flex justify-between text-sm mb-1"><span>{m.label}</span><span className="font-bold">{m.value} {m.unit}</span></div>
                <Progress value={(m.value / m.max) * 100} className="h-2" />
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </>
  );
};

// ─── SDG Tab ─────────────────────────────────────────────────────────────────

const SDGTab = ({ report }: { report: EntitySustainabilityReport }) => {
  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2"><Globe className="h-5 w-5 text-primary" />محاذاة أهداف التنمية المستدامة (SDGs)</CardTitle>
          <CardDescription>الأمم المتحدة — أجندة 2030</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 grid-cols-2 md:grid-cols-4">
            {report.sdgAlignment.map(sdg => (
              <div key={sdg.sdg} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-2xl">{sdg.icon}</span>
                  <div>
                    <p className="text-xs font-bold text-primary">SDG {sdg.sdg}</p>
                    <p className="text-xs font-medium">{sdg.nameAr}</p>
                  </div>
                </div>
                <Progress value={sdg.score} className="h-2 mb-2" />
                <p className="text-xs text-muted-foreground">{sdg.contribution}</p>
                <div className="mt-2 space-y-1">
                  {sdg.indicators.map((ind, i) => (
                    <div key={i} className="flex justify-between text-[10px]">
                      <span className="text-muted-foreground">{ind.name}</span>
                      <span className="font-bold">{ind.value}</span>
                    </div>
                  ))}
                </div>
                <div className="text-left mt-2">
                  <Badge variant={sdg.score >= 60 ? 'default' : sdg.score >= 30 ? 'secondary' : 'outline'} className="text-[10px]">
                    {sdg.score}%
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </>
  );
};

// ─── Compliance Tab ──────────────────────────────────────────────────────────

const ComplianceTab = ({ report }: { report: EntitySustainabilityReport }) => {
  const statusConfig = {
    compliant: { label: 'ممتثل', icon: CheckCircle, color: 'text-emerald-600', bg: 'bg-emerald-50 dark:bg-emerald-950/30' },
    partial: { label: 'جزئي', icon: AlertCircle, color: 'text-amber-600', bg: 'bg-amber-50 dark:bg-amber-950/30' },
    'non-compliant': { label: 'غير ممتثل', icon: XCircle, color: 'text-red-600', bg: 'bg-red-50 dark:bg-red-950/30' },
  };

  return (
    <div className="space-y-4">
      {report.regulatoryCompliance.map((reg, i) => {
        const status = statusConfig[reg.status];
        const StatusIcon = status.icon;
        return (
          <Card key={i}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <StatusIcon className={`h-6 w-6 ${status.color}`} />
                  <div>
                    <CardTitle className="text-base">{reg.frameworkAr}</CardTitle>
                    <CardDescription>{reg.framework}</CardDescription>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge className={`${status.bg} ${status.color} border-0`}>{status.label}</Badge>
                  <span className="text-lg font-bold">{reg.score}%</span>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid gap-2 grid-cols-1 sm:grid-cols-2">
                {reg.requirements.map((req, j) => (
                  <div key={j} className={`flex items-start gap-2 p-2.5 rounded-lg ${req.met ? 'bg-emerald-50/50 dark:bg-emerald-950/20' : 'bg-red-50/50 dark:bg-red-950/20'}`}>
                    {req.met ? <CheckCircle className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" /> : <XCircle className="h-4 w-4 text-red-500 shrink-0 mt-0.5" />}
                    <div>
                      <p className="text-sm font-medium">{req.name}</p>
                      <p className="text-xs text-muted-foreground">{req.detail}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};

// ─── Equivalents Tab ─────────────────────────────────────────────────────────

const EquivalentsTab = ({ report }: { report: EntitySustainabilityReport }) => {
  const cards = [
    { icon: TreePine, label: 'أشجار مزروعة', value: report.equivalents.treesPlanted.toLocaleString(), desc: 'شجرة تمتص نفس CO₂ سنوياً', color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400' },
    { icon: Car, label: 'سيارات عن الطريق', value: report.equivalents.carsOffRoad.toLocaleString(), desc: 'سيارة سنوياً', color: 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-400' },
    { icon: Zap, label: 'طاقة منازل', value: report.equivalents.homesEnergy.toLocaleString(), desc: 'منزل سنوياً', color: 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-400' },
    { icon: Droplets, label: 'مياه محفوظة', value: `${(report.equivalents.waterSavedLiters / 1000).toLocaleString()} م³`, desc: 'متر مكعب مياه', color: 'bg-cyan-100 text-cyan-700 dark:bg-cyan-950 dark:text-cyan-400' },
    { icon: Recycle, label: 'محوّل عن المدافن', value: `${report.equivalents.landfillDiverted} طن`, desc: 'أطنان عن المدافن', color: 'bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-400' },
    { icon: Fuel, label: 'براميل نفط', value: report.equivalents.oilBarrelsSaved.toLocaleString(), desc: 'برميل نفط موفر', color: 'bg-orange-100 text-orange-700 dark:bg-orange-950 dark:text-orange-400' },
    { icon: Waves, label: 'رحلات طيران', value: report.equivalents.flightsAvoided.toLocaleString(), desc: 'رحلة القاهرة-الرياض', color: 'bg-violet-100 text-violet-700 dark:bg-violet-950 dark:text-violet-400' },
    { icon: Smartphone, label: 'شحن هاتف', value: report.equivalents.phoneCharges.toLocaleString(), desc: 'عملية شحن كاملة', color: 'bg-pink-100 text-pink-700 dark:bg-pink-950 dark:text-pink-400' },
    // Egyptian-specific
    { icon: Palmtree, label: 'فدان ري نيلي', value: report.equivalents.nileFeddan.toLocaleString(), desc: 'فدان ري سنوي كامل', color: 'bg-teal-100 text-teal-700 dark:bg-teal-950 dark:text-teal-400' },
    { icon: Building2, label: 'منازل مصرية', value: report.equivalents.egyptianHouseholds.toLocaleString(), desc: 'أسرة مصرية سنوياً', color: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-400' },
    { icon: TreeDeciduous, label: 'تشجير صحراوي', value: `${(report.equivalents.desertSqMeters / 1000).toFixed(1)}K م²`, desc: 'متر مربع تخضير', color: 'bg-lime-100 text-lime-700 dark:bg-lime-950 dark:text-lime-400' },
    { icon: Sparkles, label: 'نقاط الاستدامة', value: `${report.sustainabilityScore}/100`, desc: `المستوى ${LEVEL_CONFIG[report.sustainabilityLevel].label}`, color: 'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-400' },
  ];

  return (
    <div className="grid gap-4 grid-cols-2 md:grid-cols-4">
      {cards.map((card, i) => (
        <Card key={i} className="hover:shadow-md transition-shadow">
          <CardContent className="p-4 text-center">
            <div className={`inline-flex p-3 rounded-full mb-3 ${card.color}`}><card.icon className="h-6 w-6" /></div>
            <p className="text-2xl font-bold mb-1">{card.value}</p>
            <p className="font-medium text-sm">{card.label}</p>
            <p className="text-xs text-muted-foreground mt-1">{card.desc}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

// ─── GRI/ESG Tab ─────────────────────────────────────────────────────────────

const GRITab = ({ report }: { report: EntitySustainabilityReport }) => {
  const categories = [...new Set(report.griIndicators.map(i => i.category))];
  const categoryLabels: Record<string, string> = {
    waste: 'إدارة النفايات (GRI 306)', emissions: 'الانبعاثات (GRI 305)', water: 'المياه (GRI 303)',
    energy: 'الطاقة (GRI 302)', operations: 'العمليات (SASB)', circular: 'الاقتصاد الدائري',
    transport: 'النقل', recycling: 'التدوير', disposal: 'التخلص', generation: 'التوليد',
    regulatory: 'الامتثال التنظيمي',
  };

  const standardColors: Record<string, string> = {
    GRI: 'bg-blue-100 text-blue-700', SASB: 'bg-violet-100 text-violet-700',
    IPCC: 'bg-emerald-100 text-emerald-700', ISO14001: 'bg-cyan-100 text-cyan-700',
    Basel: 'bg-amber-100 text-amber-700', EgyptLaw: 'bg-red-100 text-red-700',
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base"><Shield className="h-5 w-5 text-primary" />مؤشرات الاستدامة الدولية والمحلية</CardTitle>
          <CardDescription>GRI Standards 2021 · SASB · IPCC 2006 · ISO 14001 · اتفاقية بازل · القانون المصري</CardDescription>
        </CardHeader>
        <CardContent>
          {categories.map(cat => (
            <div key={cat} className="mb-6 last:mb-0">
              <h4 className="font-semibold text-sm mb-3 flex items-center gap-2">
                <div className="h-1.5 w-1.5 rounded-full bg-primary" />{categoryLabels[cat] || cat}
              </h4>
              <div className="border rounded-lg overflow-hidden">
                <table className="w-full text-sm">
                  <thead><tr className="bg-muted/50">
                    <th className="text-right p-2.5 font-medium">الكود</th>
                    <th className="text-right p-2.5 font-medium">المؤشر</th>
                    <th className="text-right p-2.5 font-medium">القيمة</th>
                    <th className="text-right p-2.5 font-medium">الوحدة</th>
                    <th className="text-right p-2.5 font-medium">المعيار</th>
                  </tr></thead>
                  <tbody>
                    {report.griIndicators.filter(i => i.category === cat).map((ind, i) => (
                      <tr key={i} className="border-t hover:bg-muted/30">
                        <td className="p-2.5 font-mono text-xs text-primary">{ind.code}</td>
                        <td className="p-2.5">{ind.nameAr}</td>
                        <td className="p-2.5 font-bold">{typeof ind.value === 'number' ? ind.value.toLocaleString() : ind.value}</td>
                        <td className="p-2.5 text-muted-foreground">{ind.unit}</td>
                        <td className="p-2.5"><Badge variant="outline" className={`text-[10px] ${standardColors[ind.standard] || ''}`}>{ind.standard}</Badge></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

const KPICard = ({ icon: Icon, label, value, subValue, color }: {
  icon: any; label: string; value: string; subValue?: string;
  color: 'blue' | 'green' | 'red' | 'amber' | 'emerald';
}) => {
  const colorMap = {
    blue: 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-400',
    green: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400',
    red: 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-400',
    amber: 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-400',
    emerald: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400',
  };
  return (
    <Card><CardContent className="p-4">
      <div className="flex items-center justify-between">
        <div className="space-y-1 min-w-0">
          <p className="text-xs text-muted-foreground">{label}</p>
          <p className="text-lg font-bold truncate">{value}</p>
          {subValue && <p className="text-xs text-muted-foreground">{subValue}</p>}
        </div>
        <div className={`p-2 rounded-full shrink-0 ${colorMap[color]}`}><Icon className="h-4 w-4" /></div>
      </div>
    </CardContent></Card>
  );
};

const formatMetricLabel = (key: string): string => {
  const labels: Record<string, string> = {
    shipmentsCount: 'عدد الشحنات', wasteGeneratedTons: 'مخلفات متولدة (طن)',
    diversionRate: 'معدل التحويل %', wastePerShipment: 'طن/شحنة',
    totalDistanceKm: 'المسافة الكلية (كم)', emissionsPerKm: 'كجم CO₂/كم',
    fuelEfficiency: 'كفاءة الوقود', recoveryRate: 'معدل الاسترداد %',
    recycledOutput: 'إنتاج مُدوّر (طن)', processingEfficiency: 'كفاءة المعالجة %',
    safeDisposalRate: 'التخلص الآمن %', hazardousTreated: 'مخلفات خطرة (طن)',
    complianceRate: 'نسبة الامتثال %',
  };
  return labels[key] || key;
};

const NoData = () => <div className="flex items-center justify-center h-[250px] text-muted-foreground text-sm">لا توجد بيانات كافية</div>;

const DashboardSkeleton = () => (
  <div className="space-y-4">
    <Skeleton className="h-8 w-64" />
    <div className="grid gap-4 md:grid-cols-4">{[...Array(4)].map((_, i) => <Card key={i}><CardContent className="p-5"><Skeleton className="h-16 w-full" /></CardContent></Card>)}</div>
    <Card><CardContent className="p-6"><Skeleton className="h-[300px] w-full" /></CardContent></Card>
  </div>
);

const EmptyState = () => (
  <Card className="py-12"><CardContent className="text-center">
    <Leaf className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
    <h3 className="text-lg font-semibold mb-2">لا توجد بيانات كافية</h3>
    <p className="text-muted-foreground text-sm">أضف شحنات لعرض تحليل الاستدامة الشامل</p>
  </CardContent></Card>
);

export default UnifiedSustainabilityDashboard;
