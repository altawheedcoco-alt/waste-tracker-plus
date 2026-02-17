import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell, RadialBarChart, RadialBar,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts';
import {
  Leaf, TreePine, Car, Droplets, Factory, Recycle, Award, Download,
  TrendingUp, TrendingDown, Fuel, FileText, Shield, Zap, Waves,
  BarChart3, Globe, Target, Sparkles,
} from 'lucide-react';
import {
  generateEntityReport,
  EntitySustainabilityReport,
  EntityType,
  LEVEL_CONFIG,
  ENTITY_TYPE_LABELS,
  WasteTypeAnalysis,
} from '@/lib/sustainabilityEngine';

const COLORS = ['#10B981', '#3B82F6', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#14B8A6', '#F97316'];

const UnifiedSustainabilityDashboard = () => {
  const { organization } = useAuth();
  const entityType = (organization?.organization_type as EntityType) || 'generator';
  
  const [period, setPeriod] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}`;
  });

  const periodDates = useMemo(() => {
    const year = parseInt(period);
    return {
      start: `${year}-01-01T00:00:00`,
      end: `${year}-12-31T23:59:59`,
    };
  }, [period]);

  const { data: report, isLoading } = useQuery({
    queryKey: ['sustainability-report', organization?.id, period],
    queryFn: () => generateEntityReport(
      organization!.id,
      entityType,
      periodDates.start,
      periodDates.end,
    ),
    enabled: !!organization?.id,
    staleTime: 10 * 60 * 1000,
  });

  const yearOptions = useMemo(() => {
    const years = [];
    const currentYear = new Date().getFullYear();
    for (let y = currentYear; y >= currentYear - 3; y--) {
      years.push({ value: String(y), label: String(y) });
    }
    return years;
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
            تقرير الاستدامة البيئية
          </h2>
          <p className="text-muted-foreground text-sm">
            {ENTITY_TYPE_LABELS[entityType]} — تحليل شامل وفق معايير GRI/SASB/IPCC
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
        <TabsList className="grid w-full grid-cols-2 sm:grid-cols-5">
          <TabsTrigger value="overview" className="gap-1"><BarChart3 className="h-3.5 w-3.5" />نظرة عامة</TabsTrigger>
          <TabsTrigger value="carbon" className="gap-1"><Factory className="h-3.5 w-3.5" />البصمة الكربونية</TabsTrigger>
          <TabsTrigger value="waste" className="gap-1"><Recycle className="h-3.5 w-3.5" />تحليل المخلفات</TabsTrigger>
          <TabsTrigger value="equivalents" className="gap-1"><TreePine className="h-3.5 w-3.5" />المكافئات البيئية</TabsTrigger>
          <TabsTrigger value="gri" className="gap-1"><Shield className="h-3.5 w-3.5" />مؤشرات ESG</TabsTrigger>
        </TabsList>

        {/* ─── Overview Tab ─── */}
        <TabsContent value="overview" className="space-y-4 mt-4">
          <OverviewTab report={report} levelConfig={levelConfig} entityType={entityType} />
        </TabsContent>

        {/* ─── Carbon Tab ─── */}
        <TabsContent value="carbon" className="space-y-4 mt-4">
          <CarbonTab report={report} />
        </TabsContent>

        {/* ─── Waste Tab ─── */}
        <TabsContent value="waste" className="space-y-4 mt-4">
          <WasteTab report={report} />
        </TabsContent>

        {/* ─── Equivalents Tab ─── */}
        <TabsContent value="equivalents" className="space-y-4 mt-4">
          <EquivalentsTab report={report} />
        </TabsContent>

        {/* ─── GRI/ESG Tab ─── */}
        <TabsContent value="gri" className="space-y-4 mt-4">
          <GRITab report={report} />
        </TabsContent>
      </Tabs>
    </div>
  );
};

// ─── Overview Tab ────────────────────────────────────────────────────────────

const OverviewTab = ({ report, levelConfig, entityType }: { report: EntitySustainabilityReport; levelConfig: typeof LEVEL_CONFIG.platinum; entityType: EntityType }) => {
  const scoreData = [{ name: 'Score', value: report.sustainabilityScore, fill: report.sustainabilityScore >= 70 ? '#10B981' : report.sustainabilityScore >= 40 ? '#F59E0B' : '#EF4444' }];

  return (
    <>
      {/* Score + KPI cards */}
      <div className="grid gap-4 md:grid-cols-5">
        {/* Score card */}
        <Card className="md:col-span-1 border-2 border-emerald-200 dark:border-emerald-800">
          <CardContent className="p-4 flex flex-col items-center justify-center h-full">
            <ResponsiveContainer width={120} height={120}>
              <RadialBarChart cx="50%" cy="50%" innerRadius="70%" outerRadius="100%" data={scoreData} startAngle={90} endAngle={-270}>
                <RadialBar dataKey="value" cornerRadius={10} />
              </RadialBarChart>
            </ResponsiveContainer>
            <div className="text-center -mt-2">
              <p className="text-3xl font-bold">{report.sustainabilityScore}</p>
              <p className="text-xs text-muted-foreground">نقاط الاستدامة</p>
              <Badge className={`mt-1 ${levelConfig.bg} ${levelConfig.color} text-xs`}>
                {levelConfig.icon} {levelConfig.label}
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* KPI cards */}
        <div className="md:col-span-4 grid gap-3 grid-cols-2 lg:grid-cols-4">
          <KPICard icon={Recycle} label="إجمالي المخلفات" value={`${report.totalWasteTons} طن`} color="blue" />
          <KPICard icon={Leaf} label="تم تدويره" value={`${report.totalRecycledTons} طن`} subValue={`${report.recyclingRate}%`} color="green" />
          <KPICard 
            icon={Factory} 
            label="صافي الكربون" 
            value={`${Math.abs(report.netCarbonImpact)} طن CO₂`} 
            subValue={report.netCarbonImpact <= 0 ? 'أثر إيجابي ✓' : 'أثر سلبي'} 
            color={report.netCarbonImpact <= 0 ? 'green' : 'red'} 
          />
          <KPICard icon={TreePine} label="أشجار معادلة" value={report.equivalents.treesPlanted.toLocaleString()} color="emerald" />
        </div>
      </div>

      {/* Monthly trend */}
      {report.monthlyTrend.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <TrendingUp className="h-5 w-5 text-primary" />
              الاتجاه الشهري
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={report.monthlyTrend}>
                <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                <XAxis dataKey="monthLabel" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
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

      {/* Entity-specific metrics */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Target className="h-5 w-5 text-primary" />
            مؤشرات {ENTITY_TYPE_LABELS[entityType]}
          </CardTitle>
        </CardHeader>
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
          label="صافي الأثر" 
          value={`${Math.abs(report.netCarbonImpact)} طن CO₂e`}
          subValue={report.netCarbonImpact <= 0 ? '↓ أثر إيجابي' : '↑ أثر سلبي'}
          color={report.netCarbonImpact <= 0 ? 'green' : 'red'}
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {/* Scope breakdown */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">توزيع الانبعاثات حسب النطاق</CardTitle>
            <CardDescription>GHG Protocol Scopes 1-3</CardDescription>
          </CardHeader>
          <CardContent>
            {scopeData.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie data={scopeData} cx="50%" cy="50%" innerRadius={50} outerRadius={90} paddingAngle={3} dataKey="value"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                    {scopeData.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-[250px] text-muted-foreground text-sm">لا توجد بيانات كافية</div>
            )}
          </CardContent>
        </Card>

        {/* Emissions by waste type */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">الانبعاثات حسب نوع المخلف</CardTitle>
          </CardHeader>
          <CardContent>
            {report.wasteBreakdown.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={report.wasteBreakdown} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                  <XAxis type="number" tick={{ fontSize: 10 }} />
                  <YAxis dataKey="wasteTypeAr" type="category" width={80} tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="totalEmissions" name="الانبعاثات" fill="#EF4444" radius={[0, 4, 4, 0]} />
                  <Bar dataKey="totalSavings" name="الوفورات" fill="#10B981" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-[250px] text-muted-foreground text-sm">لا توجد بيانات</div>
            )}
          </CardContent>
        </Card>
      </div>
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
          <CardHeader>
            <CardTitle className="text-base">توزيع المخلفات</CardTitle>
          </CardHeader>
          <CardContent>
            {pieData.length > 0 ? (
              <ResponsiveContainer width="100%" height={280}>
                <PieChart>
                  <Pie data={pieData} cx="50%" cy="50%" innerRadius={45} outerRadius={85} paddingAngle={2} dataKey="value"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                    {pieData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-[280px] text-muted-foreground text-sm">لا توجد بيانات</div>
            )}
          </CardContent>
        </Card>

        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">تحليل تفصيلي حسب نوع المخلف</CardTitle>
            <CardDescription>معدل الاسترداد والبصمة الكربونية لكل نوع</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {report.wasteBreakdown.map((w, i) => (
                <WasteTypeRow key={w.wasteType} analysis={w} color={COLORS[i % COLORS.length]} />
              ))}
              {report.wasteBreakdown.length === 0 && (
                <p className="text-center text-muted-foreground text-sm py-8">لا توجد بيانات كافية</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
};

const WasteTypeRow = ({ analysis, color }: { analysis: WasteTypeAnalysis; color: string }) => (
  <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors">
    <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: color }} />
    <div className="flex-1 min-w-0">
      <div className="flex items-center justify-between mb-1">
        <span className="font-medium text-sm">{analysis.wasteTypeAr}</span>
        <span className="text-sm font-bold">{analysis.totalTons} طن</span>
      </div>
      <Progress value={analysis.recoveryRate} className="h-2 mb-1" />
      <div className="flex items-center gap-4 text-xs text-muted-foreground">
        <span>استرداد: {analysis.recoveryRate}%</span>
        <span>انبعاثات: {analysis.totalEmissions} طن CO₂</span>
        <span>وفورات: {analysis.totalSavings} طن CO₂</span>
        <span className="text-emerald-600">🌳 {analysis.equivalents.treesPlanted} شجرة</span>
      </div>
    </div>
  </div>
);

// ─── Environmental Equivalents Tab ───────────────────────────────────────────

const EquivalentsTab = ({ report }: { report: EntitySustainabilityReport }) => {
  const equivalentCards = [
    { icon: TreePine, label: 'أشجار مزروعة', value: report.equivalents.treesPlanted.toLocaleString(), desc: 'شجرة تمتص نفس كمية CO₂ سنوياً', color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400' },
    { icon: Car, label: 'سيارات عن الطريق', value: report.equivalents.carsOffRoad.toLocaleString(), desc: 'سيارة معادلة انبعاثاتها سنوياً', color: 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-400' },
    { icon: Zap, label: 'طاقة منازل', value: report.equivalents.homesEnergy.toLocaleString(), desc: 'منزل معادل استهلاك طاقته سنوياً', color: 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-400' },
    { icon: Droplets, label: 'مياه محفوظة', value: `${(report.equivalents.waterSavedLiters / 1000).toLocaleString()} م³`, desc: 'متر مكعب من المياه تم توفيرها', color: 'bg-cyan-100 text-cyan-700 dark:bg-cyan-950 dark:text-cyan-400' },
    { icon: Recycle, label: 'محوّل عن المدافن', value: `${report.equivalents.landfillDiverted} طن`, desc: 'أطنان محوّلة عن المدافن والمحارق', color: 'bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-400' },
    { icon: Fuel, label: 'براميل نفط', value: report.equivalents.oilBarrelsSaved.toLocaleString(), desc: 'برميل نفط تم توفيره', color: 'bg-orange-100 text-orange-700 dark:bg-orange-950 dark:text-orange-400' },
    { icon: Waves, label: 'رحلات طيران', value: report.equivalents.flightsAvoided.toLocaleString(), desc: 'رحلة (القاهرة-الرياض) معادلة', color: 'bg-violet-100 text-violet-700 dark:bg-violet-950 dark:text-violet-400' },
    { icon: Sparkles, label: 'نقاط الاستدامة', value: `${report.sustainabilityScore}/100`, desc: `المستوى ${LEVEL_CONFIG[report.sustainabilityLevel].label}`, color: 'bg-pink-100 text-pink-700 dark:bg-pink-950 dark:text-pink-400' },
  ];

  return (
    <div className="grid gap-4 grid-cols-2 md:grid-cols-4">
      {equivalentCards.map((card, i) => (
        <Card key={i} className="hover:shadow-md transition-shadow">
          <CardContent className="p-4 text-center">
            <div className={`inline-flex p-3 rounded-full mb-3 ${card.color}`}>
              <card.icon className="h-6 w-6" />
            </div>
            <p className="text-2xl font-bold mb-1">{card.value}</p>
            <p className="font-medium text-sm">{card.label}</p>
            <p className="text-xs text-muted-foreground mt-1">{card.desc}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

// ─── GRI/ESG Indicators Tab ──────────────────────────────────────────────────

const GRITab = ({ report }: { report: EntitySustainabilityReport }) => {
  const categories = [...new Set(report.griIndicators.map(i => i.category))];
  const categoryLabels: Record<string, string> = {
    waste: 'إدارة النفايات', emissions: 'الانبعاثات', operations: 'العمليات',
    transport: 'النقل', recycling: 'التدوير', disposal: 'التخلص',
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Shield className="h-5 w-5 text-primary" />
            مؤشرات الاستدامة الدولية
          </CardTitle>
          <CardDescription>متوافق مع معايير GRI Standards, SASB, IPCC 2006</CardDescription>
        </CardHeader>
        <CardContent>
          {categories.map(cat => (
            <div key={cat} className="mb-6 last:mb-0">
              <h4 className="font-semibold text-sm mb-3 flex items-center gap-2">
                <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                {categoryLabels[cat] || cat}
              </h4>
              <div className="border rounded-lg overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-muted/50">
                      <th className="text-right p-2.5 font-medium">المعيار</th>
                      <th className="text-right p-2.5 font-medium">المؤشر</th>
                      <th className="text-right p-2.5 font-medium">القيمة</th>
                      <th className="text-right p-2.5 font-medium">الوحدة</th>
                      <th className="text-right p-2.5 font-medium">المصدر</th>
                    </tr>
                  </thead>
                  <tbody>
                    {report.griIndicators.filter(i => i.category === cat).map((ind, i) => (
                      <tr key={i} className="border-t hover:bg-muted/30">
                        <td className="p-2.5 font-mono text-xs text-primary">{ind.code}</td>
                        <td className="p-2.5">{ind.nameAr}</td>
                        <td className="p-2.5 font-bold">{typeof ind.value === 'number' ? ind.value.toLocaleString() : ind.value}</td>
                        <td className="p-2.5 text-muted-foreground">{ind.unit}</td>
                        <td className="p-2.5">
                          <Badge variant="outline" className="text-xs">{ind.standard}</Badge>
                        </td>
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

// ─── Helper Components ───────────────────────────────────────────────────────

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
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="space-y-1 min-w-0">
            <p className="text-xs text-muted-foreground">{label}</p>
            <p className="text-lg font-bold truncate">{value}</p>
            {subValue && <p className="text-xs text-muted-foreground">{subValue}</p>}
          </div>
          <div className={`p-2 rounded-full shrink-0 ${colorMap[color]}`}>
            <Icon className="h-4 w-4" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

const formatMetricLabel = (key: string): string => {
  const labels: Record<string, string> = {
    shipmentsCount: 'عدد الشحنات',
    wasteGeneratedTons: 'مخلفات متولدة (طن)',
    diversionRate: 'معدل التحويل %',
    wastePerShipment: 'طن/شحنة',
    totalDistanceKm: 'المسافة الكلية (كم)',
    emissionsPerKm: 'كجم CO₂/كم',
    fuelEfficiency: 'كفاءة الوقود',
    recoveryRate: 'معدل الاسترداد %',
    recycledOutput: 'إنتاج مُدوّر (طن)',
    processingEfficiency: 'كفاءة المعالجة %',
    safeDisposalRate: 'التخلص الآمن %',
    hazardousTreated: 'مخلفات خطرة (طن)',
    complianceRate: 'نسبة الامتثال %',
  };
  return labels[key] || key;
};

const DashboardSkeleton = () => (
  <div className="space-y-4">
    <Skeleton className="h-8 w-64" />
    <div className="grid gap-4 md:grid-cols-4">
      {[...Array(4)].map((_, i) => <Card key={i}><CardContent className="p-5"><Skeleton className="h-16 w-full" /></CardContent></Card>)}
    </div>
    <Card><CardContent className="p-6"><Skeleton className="h-[300px] w-full" /></CardContent></Card>
  </div>
);

const EmptyState = () => (
  <Card className="py-12">
    <CardContent className="text-center">
      <Leaf className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
      <h3 className="text-lg font-semibold mb-2">لا توجد بيانات كافية</h3>
      <p className="text-muted-foreground text-sm">أضف شحنات لعرض تحليل الاستدامة</p>
    </CardContent>
  </Card>
);

export default UnifiedSustainabilityDashboard;
