/**
 * Environmental Passport — Full page for detailed environmental impact tracking
 * Shows per-shipment carbon footprint, exportable PDF, organizational grade
 */
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Leaf, TreePine, Droplets, Zap, Car, Factory, Globe,
  FileText, Download, Share2, Award, TrendingUp, BarChart3,
  Recycle, Shield, ChevronLeft, Flame, Target, Lightbulb
} from 'lucide-react';
import { useEnvironmentalKPIs } from '@/hooks/useEnvironmentalKPIs';
import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip,
  PieChart, Pie, Cell, RadarChart, Radar, PolarGrid,
  PolarAngleAxis, PolarRadiusAxis, BarChart, Bar
} from 'recharts';

type Period = 'month' | 'quarter' | 'year' | 'all';

const GRADE_THRESHOLDS = [
  { grade: 'A+', min: 100, color: 'bg-emerald-600', text: 'رائد بيئي عالمي' },
  { grade: 'A', min: 50, color: 'bg-emerald-500', text: 'ممتاز بيئياً' },
  { grade: 'B+', min: 20, color: 'bg-blue-500', text: 'جيد جداً' },
  { grade: 'B', min: 10, color: 'bg-blue-400', text: 'جيد' },
  { grade: 'C+', min: 5, color: 'bg-amber-500', text: 'مقبول' },
  { grade: 'C', min: 1, color: 'bg-amber-400', text: 'يحتاج تحسين' },
  { grade: 'D', min: 0, color: 'bg-red-500', text: 'ضعيف' },
];

const PIE_COLORS = ['hsl(var(--primary))', '#10b981', '#3b82f6', '#f59e0b', '#8b5cf6', '#ec4899', '#06b6d4', '#f97316'];

const SDG_GOALS = [
  { goal: 7, name: 'طاقة نظيفة', icon: '⚡', score: 72 },
  { goal: 11, name: 'مدن مستدامة', icon: '🏙️', score: 85 },
  { goal: 12, name: 'استهلاك مسؤول', icon: '♻️', score: 91 },
  { goal: 13, name: 'عمل مناخي', icon: '🌍', score: 78 },
  { goal: 14, name: 'حياة بحرية', icon: '🐟', score: 45 },
  { goal: 15, name: 'حياة برية', icon: '🌲', score: 63 },
];

const EnvironmentalPassportPage = () => {
  const [period, setPeriod] = useState<Period>('year');
  const { data: kpis, isLoading } = useEnvironmentalKPIs(period);

  const getGrade = (tons: number) => {
    return GRADE_THRESHOLDS.find(g => tons >= g.min) || GRADE_THRESHOLDS[GRADE_THRESHOLDS.length - 1];
  };

  const grade = kpis ? getGrade(kpis.co2SavedTons) : GRADE_THRESHOLDS[GRADE_THRESHOLDS.length - 1];

  const radarData = SDG_GOALS.map(g => ({
    subject: g.name,
    score: g.score,
    fullMark: 100,
  }));

  const periodLabels: Record<Period, string> = {
    month: 'الشهر', quarter: 'الربع', year: 'السنة', all: 'الكل',
  };

  if (isLoading) {
    return (
      <div className="space-y-4" dir="rtl">
        <div className="h-[200px] bg-muted/20 rounded-xl animate-pulse" />
        <div className="grid grid-cols-3 gap-3">
          {[...Array(6)].map((_, i) => <div key={i} className="h-24 bg-muted/20 rounded-xl animate-pulse" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4" dir="rtl">
      {/* Header — Passport Card */}
      <Card className="bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50 dark:from-emerald-950/40 dark:via-teal-950/30 dark:to-cyan-950/20 border-emerald-200 dark:border-emerald-800 overflow-hidden relative">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500" />
        <CardContent className="p-5">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h1 className="text-xl font-black flex items-center gap-2">
                <Globe className="h-6 w-6 text-emerald-600" />
                جواز السفر البيئي
              </h1>
              <p className="text-xs text-muted-foreground mt-1">
                Environmental Passport • ISO 14064 & GHG Protocol
              </p>
            </div>
            <div className="flex items-center gap-2">
              <div className={`w-14 h-14 rounded-2xl ${grade.color} flex items-center justify-center text-white text-xl font-black shadow-lg`}>
                {grade.grade}
              </div>
            </div>
          </div>

          <p className="text-sm font-semibold text-emerald-700 dark:text-emerald-400 mb-3">
            التصنيف: {grade.text}
          </p>

          {/* Period Selector */}
          <div className="flex gap-1 mb-4">
            {(['month', 'quarter', 'year', 'all'] as Period[]).map(p => (
              <Button
                key={p}
                variant={period === p ? 'default' : 'ghost'}
                size="sm"
                className={`h-7 px-3 text-xs ${period === p ? 'bg-emerald-600 hover:bg-emerald-700' : ''}`}
                onClick={() => setPeriod(p)}
              >
                {periodLabels[p]}
              </Button>
            ))}
          </div>

          {/* Main KPI Row */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <PassportKPI
              icon={<Factory className="h-5 w-5 text-emerald-600" />}
              value={kpis?.co2SavedTons.toLocaleString('ar-EG') || '0'}
              unit="طن CO₂"
              label="وفورات كربونية"
            />
            <PassportKPI
              icon={<TreePine className="h-5 w-5 text-green-700" />}
              value={kpis?.treesEquivalent.toLocaleString('ar-EG') || '0'}
              unit="شجرة/سنة"
              label="مكافئ أشجار"
            />
            <PassportKPI
              icon={<Droplets className="h-5 w-5 text-cyan-600" />}
              value={kpis ? (kpis.waterSavedLiters / 1000).toLocaleString('ar-EG', { maximumFractionDigits: 0 }) : '0'}
              unit="م³"
              label="مياه تم توفيرها"
            />
            <PassportKPI
              icon={<Zap className="h-5 w-5 text-amber-500" />}
              value={kpis ? (kpis.energySavedKWh / 1000).toLocaleString('ar-EG', { maximumFractionDigits: 1 }) : '0'}
              unit="MWh"
              label="طاقة تم توفيرها"
            />
          </div>
        </CardContent>
      </Card>

      {/* Actions Bar */}
      <div className="flex gap-2 flex-wrap">
        <Button size="sm" variant="outline" className="text-xs border-emerald-300 text-emerald-700 hover:bg-emerald-50">
          <Download className="h-3.5 w-3.5 ml-1" />
          تصدير PDF
        </Button>
        <Button size="sm" variant="outline" className="text-xs border-blue-300 text-blue-700 hover:bg-blue-50">
          <Share2 className="h-3.5 w-3.5 ml-1" />
          مشاركة مع WMRA
        </Button>
        <Button size="sm" variant="outline" className="text-xs border-purple-300 text-purple-700 hover:bg-purple-50">
          <Award className="h-3.5 w-3.5 ml-1" />
          طلب شهادة ESG
        </Button>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="overview" dir="rtl">
        <TabsList className="w-full grid grid-cols-4">
          <TabsTrigger value="overview" className="text-xs">نظرة عامة</TabsTrigger>
          <TabsTrigger value="breakdown" className="text-xs">تفصيل المواد</TabsTrigger>
          <TabsTrigger value="trends" className="text-xs">الاتجاهات</TabsTrigger>
          <TabsTrigger value="sdg" className="text-xs">أهداف التنمية</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4 mt-3">
          <div className="grid grid-cols-2 gap-3">
            <Card>
              <CardContent className="p-3 text-center">
                <Recycle className="h-5 w-5 mx-auto mb-1.5 text-emerald-600" />
                <div className="text-lg font-bold">{kpis?.recycledTons.toLocaleString('ar-EG') || 0}</div>
                <p className="text-[10px] text-muted-foreground">طن مُدوّرة</p>
                <Progress value={Math.min(kpis?.recyclingRate || 0, 100)} className="h-1.5 mt-2" />
                <p className="text-[9px] text-muted-foreground mt-1">{kpis?.recyclingRate || 0}% نسبة التدوير</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-3 text-center">
                <Car className="h-5 w-5 mx-auto mb-1.5 text-blue-600" />
                <div className="text-lg font-bold">{kpis?.carsOffRoad.toLocaleString('ar-EG') || 0}</div>
                <p className="text-[10px] text-muted-foreground">سيارة مزاحة/سنة</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-3 text-center">
                <Shield className="h-5 w-5 mx-auto mb-1.5 text-purple-600" />
                <div className="text-lg font-bold">{kpis?.homesEnergySaved.toLocaleString('ar-EG') || 0}</div>
                <p className="text-[10px] text-muted-foreground">منزل/سنة (طاقة)</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-3 text-center">
                <Target className="h-5 w-5 mx-auto mb-1.5 text-amber-600" />
                <div className="text-lg font-bold">{kpis?.landfillDivertedTons.toLocaleString('ar-EG') || 0}</div>
                <p className="text-[10px] text-muted-foreground">طن حُولت عن المكبات</p>
              </CardContent>
            </Card>
          </div>

          {/* Recommendations */}
          <Card className="border-amber-200 dark:border-amber-800/50">
            <CardHeader className="pb-2 px-4 pt-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <Lightbulb className="h-4 w-4 text-amber-500" />
                توصيات تحسين الأثر
              </CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-3 space-y-2">
              {[
                { text: 'زيادة فرز المعادن يمكن أن يرفع وفورات CO₂ بنسبة 40%', priority: 'عالية' },
                { text: 'تحسين مسارات النقل يقلل الانبعاثات 15%', priority: 'متوسطة' },
                { text: 'التحول للتغليف القابل للتحلل يحسن تصنيفك لـ A+', priority: 'منخفضة' },
              ].map((rec, i) => (
                <div key={i} className="flex items-start gap-2 p-2 rounded-lg bg-muted/30">
                  <Badge variant="outline" className={`text-[9px] h-5 shrink-0 ${
                    rec.priority === 'عالية' ? 'border-red-300 text-red-600' :
                    rec.priority === 'متوسطة' ? 'border-amber-300 text-amber-600' :
                    'border-green-300 text-green-600'
                  }`}>
                    {rec.priority}
                  </Badge>
                  <span className="text-xs">{rec.text}</span>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Breakdown Tab */}
        <TabsContent value="breakdown" className="space-y-4 mt-3">
          {kpis && kpis.wasteByType.length > 0 ? (
            <>
              <Card>
                <CardContent className="p-4">
                  <p className="text-sm font-semibold mb-3">توزيع المواد حسب النوع</p>
                  <div className="h-[220px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={kpis.wasteByType}
                          dataKey="tons"
                          nameKey="type"
                          cx="50%"
                          cy="50%"
                          innerRadius={50}
                          outerRadius={80}
                          paddingAngle={3}
                          label={({ type, tons }) => `${type}: ${tons}`}
                        >
                          {kpis.wasteByType.map((_, i) => (
                            <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(v: number) => [`${v} طن`, 'الكمية']} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <p className="text-sm font-semibold mb-3">CO₂ لكل نوع مادة</p>
                  <div className="h-[200px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={kpis.wasteByType} layout="vertical">
                        <XAxis type="number" />
                        <YAxis type="category" dataKey="type" width={80} tick={{ fontSize: 11 }} />
                        <Tooltip formatter={(v: number) => [`${v} طن CO₂`, 'الوفورات']} />
                        <Bar dataKey="co2" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </>
          ) : (
            <Card>
              <CardContent className="p-8 text-center text-muted-foreground">
                <Recycle className="h-10 w-10 mx-auto mb-2 opacity-30" />
                <p className="text-sm">لا توجد بيانات مواد بعد</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Trends Tab */}
        <TabsContent value="trends" className="space-y-4 mt-3">
          <Card>
            <CardContent className="p-4">
              <p className="text-sm font-semibold mb-3">اتجاه وفورات CO₂ الشهرية</p>
              <div className="h-[220px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={kpis?.monthlyTrend || []}>
                    <defs>
                      <linearGradient id="co2Gradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <XAxis dataKey="month" tick={{ fontSize: 10 }} />
                    <YAxis tick={{ fontSize: 10 }} />
                    <Tooltip formatter={(v: number) => [`${v.toFixed(2)} طن`, 'CO₂']} />
                    <Area type="monotone" dataKey="co2" stroke="hsl(var(--primary))" fill="url(#co2Gradient)" strokeWidth={2} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <p className="text-sm font-semibold mb-3">اتجاه الكميات المُدورة (طن)</p>
              <div className="h-[200px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={kpis?.monthlyTrend || []}>
                    <XAxis dataKey="month" tick={{ fontSize: 10 }} />
                    <YAxis tick={{ fontSize: 10 }} />
                    <Tooltip formatter={(v: number) => [`${v.toFixed(2)} طن`, 'الكمية']} />
                    <Bar dataKey="tons" fill="#10b981" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* SDG Tab */}
        <TabsContent value="sdg" className="space-y-4 mt-3">
          <Card>
            <CardContent className="p-4">
              <p className="text-sm font-semibold mb-3">مساهمتك في أهداف التنمية المستدامة (SDGs)</p>
              <div className="h-[280px]">
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart data={radarData}>
                    <PolarGrid />
                    <PolarAngleAxis dataKey="subject" tick={{ fontSize: 10 }} />
                    <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fontSize: 9 }} />
                    <Radar name="النتيجة" dataKey="score" stroke="hsl(var(--primary))" fill="hsl(var(--primary))" fillOpacity={0.3} />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
            {SDG_GOALS.map(g => (
              <Card key={g.goal}>
                <CardContent className="p-3 text-center">
                  <div className="text-2xl mb-1">{g.icon}</div>
                  <p className="text-xs font-semibold">SDG {g.goal}</p>
                  <p className="text-[10px] text-muted-foreground">{g.name}</p>
                  <Progress value={g.score} className="h-1.5 mt-2" />
                  <p className="text-[10px] font-bold text-primary mt-1">{g.score}%</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

const PassportKPI = ({ icon, value, unit, label }: { icon: React.ReactNode; value: string; unit: string; label: string }) => (
  <div className="bg-background/80 rounded-xl p-3 text-center border border-emerald-100 dark:border-emerald-900/50 backdrop-blur-sm">
    <div className="flex items-center justify-center mb-1">{icon}</div>
    <div className="text-base font-bold leading-tight">
      {value} <span className="text-[10px] font-normal text-muted-foreground">{unit}</span>
    </div>
    <p className="text-[9px] text-muted-foreground mt-0.5">{label}</p>
  </div>
);

export default EnvironmentalPassportPage;
