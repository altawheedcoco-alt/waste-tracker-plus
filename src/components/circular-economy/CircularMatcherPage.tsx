/**
 * CircularMatcherPage — مطابق الاقتصاد الدائري المتقدم
 * ربط مخرجات صناعية بمدخلات مصانع أخرى (Industrial Symbiosis)
 */
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import {
  Recycle, Factory, ArrowRight, Leaf, MapPin, TrendingUp,
  Search, Star, Sparkles, Network, GitCompareArrows,
  CheckCircle2, DollarSign, Truck, Building2, Zap
} from 'lucide-react';
import {
  ResponsiveContainer, PieChart, Pie, Cell, Tooltip,
  BarChart, Bar, XAxis, YAxis, Sankey
} from 'recharts';

interface SymbiosisMatch {
  id: string;
  outputOrg: string;
  outputMaterial: string;
  outputTonsPerMonth: number;
  inputOrg: string;
  inputNeed: string;
  inputTonsPerMonth: number;
  matchScore: number;
  distanceKm: number;
  co2SavingsPerTon: number;
  costSavingsPercent: number;
  status: 'proposed' | 'active' | 'completed';
  governorate: string;
}

const DEMO_MATCHES: SymbiosisMatch[] = [
  { id: 'SM-001', outputOrg: 'مصنع تعبئة مياه النيل', outputMaterial: 'بلاستيك PET تالف', outputTonsPerMonth: 8, inputOrg: 'مصنع ألياف صناعية', inputNeed: 'PET خام', inputTonsPerMonth: 12, matchScore: 95, distanceKm: 15, co2SavingsPerTon: 1.4, costSavingsPercent: 35, status: 'active', governorate: 'القاهرة' },
  { id: 'SM-002', outputOrg: 'مطبعة الأهرام', outputMaterial: 'قصاصات ورق مختلط', outputTonsPerMonth: 5, inputOrg: 'مصنع كرتون الدلتا', inputNeed: 'لب ورقي', inputTonsPerMonth: 20, matchScore: 88, distanceKm: 45, co2SavingsPerTon: 0.9, costSavingsPercent: 28, status: 'active', governorate: 'الجيزة' },
  { id: 'SM-003', outputOrg: 'مصنع أدوات منزلية', outputMaterial: 'خردة ألمنيوم', outputTonsPerMonth: 2, inputOrg: 'مسبك المعادن المتحدة', inputNeed: 'ألمنيوم خام', inputTonsPerMonth: 5, matchScore: 92, distanceKm: 22, co2SavingsPerTon: 9.0, costSavingsPercent: 40, status: 'proposed', governorate: 'الشرقية' },
  { id: 'SM-004', outputOrg: 'مصنع مشروبات غازية', outputMaterial: 'كسر زجاج', outputTonsPerMonth: 10, inputOrg: 'مصنع زجاج التعمير', inputNeed: 'كسر زجاج نظيف', inputTonsPerMonth: 15, matchScore: 85, distanceKm: 60, co2SavingsPerTon: 0.3, costSavingsPercent: 20, status: 'completed', governorate: 'الإسكندرية' },
  { id: 'SM-005', outputOrg: 'مصنع إطارات', outputMaterial: 'إطارات تالفة', outputTonsPerMonth: 3, inputOrg: 'مصنع أرضيات مطاطية', inputNeed: 'حبيبات مطاط', inputTonsPerMonth: 4, matchScore: 78, distanceKm: 35, co2SavingsPerTon: 1.8, costSavingsPercent: 45, status: 'proposed', governorate: 'القليوبية' },
];

const FLOW_DATA = [
  { name: 'بلاستيك', value: 35, fill: '#3b82f6' },
  { name: 'ورق', value: 22, fill: '#f59e0b' },
  { name: 'معادن', value: 18, fill: '#8b5cf6' },
  { name: 'زجاج', value: 15, fill: '#10b981' },
  { name: 'مطاط', value: 10, fill: '#ef4444' },
];

const MONTHLY_SYMBIOSIS = [
  { month: 'يناير', matches: 12, tons: 45 },
  { month: 'فبراير', matches: 15, tons: 58 },
  { month: 'مارس', matches: 18, tons: 72 },
  { month: 'أبريل', matches: 22, tons: 85 },
];

const STATUS_CONFIG = {
  proposed: { label: 'مقترح', color: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400' },
  active: { label: 'نشط', color: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400' },
  completed: { label: 'مكتمل', color: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400' },
};

const CircularMatcherPage = () => {
  const [searchMaterial, setSearchMaterial] = useState('');

  const totalTonsMatched = DEMO_MATCHES.reduce((s, m) => s + Math.min(m.outputTonsPerMonth, m.inputTonsPerMonth), 0);
  const totalCO2Saved = DEMO_MATCHES.reduce((s, m) => s + m.co2SavingsPerTon * Math.min(m.outputTonsPerMonth, m.inputTonsPerMonth), 0);
  const activeMatches = DEMO_MATCHES.filter(m => m.status === 'active').length;
  const avgScore = Math.round(DEMO_MATCHES.reduce((s, m) => s + m.matchScore, 0) / DEMO_MATCHES.length);

  return (
    <div className="space-y-4" dir="rtl">
      {/* Header */}
      <div>
        <h1 className="text-xl font-black flex items-center gap-2">
          <GitCompareArrows className="h-6 w-6 text-primary" />
          مطابق الاقتصاد الدائري
        </h1>
        <p className="text-xs text-muted-foreground">Industrial Symbiosis Matcher • ربط المخرجات بالمدخلات الصناعية</p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <KPICard icon={<Network className="h-4 w-4" />} value={DEMO_MATCHES.length} label="مطابقة إجمالية" color="text-primary" />
        <KPICard icon={<Recycle className="h-4 w-4" />} value={`${totalTonsMatched} طن/شهر`} label="مواد مُعاد توجيهها" color="text-emerald-600" />
        <KPICard icon={<Leaf className="h-4 w-4" />} value={`${totalCO2Saved.toFixed(1)} طن`} label="CO₂ تم توفيره/شهر" color="text-green-600" />
        <KPICard icon={<Star className="h-4 w-4" />} value={`${avgScore}%`} label="متوسط التوافق" color="text-amber-600" />
      </div>

      <Tabs defaultValue="matches" dir="rtl">
        <TabsList className="w-full grid grid-cols-4">
          <TabsTrigger value="matches" className="text-xs">المطابقات</TabsTrigger>
          <TabsTrigger value="find" className="text-xs">ابحث عن مطابقة</TabsTrigger>
          <TabsTrigger value="network" className="text-xs">شبكة التعايش</TabsTrigger>
          <TabsTrigger value="impact" className="text-xs">الأثر</TabsTrigger>
        </TabsList>

        {/* Matches Tab */}
        <TabsContent value="matches" className="space-y-3 mt-3">
          {DEMO_MATCHES.map(match => {
            const cfg = STATUS_CONFIG[match.status];
            const matchedTons = Math.min(match.outputTonsPerMonth, match.inputTonsPerMonth);
            return (
              <Card key={match.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-[9px] h-5">{match.id}</Badge>
                      <Badge className={`text-[9px] h-5 ${cfg.color}`}>{cfg.label}</Badge>
                    </div>
                    <div className="flex items-center gap-1">
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-black text-primary">
                        {match.matchScore}%
                      </div>
                    </div>
                  </div>

                  {/* Flow visualization */}
                  <div className="flex items-center gap-2 mb-3">
                    <div className="flex-1 p-2 rounded-lg bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 text-center">
                      <Factory className="h-4 w-4 mx-auto mb-1 text-red-600" />
                      <p className="text-[10px] font-semibold truncate">{match.outputOrg}</p>
                      <p className="text-[9px] text-muted-foreground">{match.outputMaterial}</p>
                      <p className="text-[10px] font-bold text-red-600">{match.outputTonsPerMonth} طن/شهر</p>
                    </div>
                    <div className="flex flex-col items-center shrink-0">
                      <ArrowRight className="h-5 w-5 text-primary" />
                      <span className="text-[9px] text-muted-foreground">{match.distanceKm} كم</span>
                    </div>
                    <div className="flex-1 p-2 rounded-lg bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800 text-center">
                      <Building2 className="h-4 w-4 mx-auto mb-1 text-emerald-600" />
                      <p className="text-[10px] font-semibold truncate">{match.inputOrg}</p>
                      <p className="text-[9px] text-muted-foreground">{match.inputNeed}</p>
                      <p className="text-[10px] font-bold text-emerald-600">{match.inputTonsPerMonth} طن/شهر</p>
                    </div>
                  </div>

                  {/* Savings strip */}
                  <div className="flex items-center gap-3 text-[10px] flex-wrap">
                    <span className="flex items-center gap-1 text-emerald-600">
                      <Leaf className="h-3 w-3" />
                      {(match.co2SavingsPerTon * matchedTons).toFixed(1)} طن CO₂/شهر
                    </span>
                    <span className="flex items-center gap-1 text-blue-600">
                      <DollarSign className="h-3 w-3" />
                      توفير {match.costSavingsPercent}%
                    </span>
                    <span className="flex items-center gap-1 text-muted-foreground">
                      <MapPin className="h-3 w-3" />
                      {match.governorate}
                    </span>
                  </div>

                  {match.status === 'proposed' && (
                    <div className="flex gap-2 mt-3">
                      <Button size="sm" className="flex-1 h-7 text-[10px]">قبول المطابقة</Button>
                      <Button size="sm" variant="outline" className="h-7 text-[10px]">تفاوض</Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </TabsContent>

        {/* Find Match Tab */}
        <TabsContent value="find" className="space-y-4 mt-3">
          <Card>
            <CardHeader className="pb-3 px-4 pt-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-primary" />
                ابحث عن مطابقة ذكية (AI)
              </CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-4 space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs">نوع المادة</Label>
                  <Select>
                    <SelectTrigger className="h-9 text-xs"><SelectValue placeholder="اختر نوع المادة" /></SelectTrigger>
                    <SelectContent>
                      {['بلاستيك PET', 'بلاستيك HDPE', 'حديد خردة', 'ألمنيوم', 'ورق وكرتون', 'زجاج', 'مطاط', 'مخلفات إلكترونية'].map(t => (
                        <SelectItem key={t} value={t}>{t}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs">الكمية (طن/شهر)</Label>
                  <Input type="number" placeholder="0" className="h-9 text-xs" />
                </div>
                <div>
                  <Label className="text-xs">المحافظة</Label>
                  <Select>
                    <SelectTrigger className="h-9 text-xs"><SelectValue placeholder="اختر المحافظة" /></SelectTrigger>
                    <SelectContent>
                      {['القاهرة', 'الجيزة', 'الإسكندرية', 'الشرقية', 'الدقهلية', 'القليوبية'].map(g => (
                        <SelectItem key={g} value={g}>{g}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs">أقصى مسافة</Label>
                  <Select>
                    <SelectTrigger className="h-9 text-xs"><SelectValue placeholder="المسافة" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="25">25 كم</SelectItem>
                      <SelectItem value="50">50 كم</SelectItem>
                      <SelectItem value="100">100 كم</SelectItem>
                      <SelectItem value="200">200 كم</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <Button className="w-full">
                <Search className="h-4 w-4 ml-2" />
                ابحث عن أفضل مطابقة (AI)
              </Button>
            </CardContent>
          </Card>

          <Card className="border-dashed border-muted-foreground/30">
            <CardContent className="p-8 text-center text-muted-foreground">
              <GitCompareArrows className="h-10 w-10 mx-auto mb-3 opacity-30" />
              <p className="text-sm font-semibold">أدخل بيانات المادة للبحث عن أفضل المطابقات</p>
              <p className="text-xs mt-1">النظام يستخدم الذكاء الاصطناعي لمطابقة مخرجاتك مع مدخلات المصانع القريبة</p>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Network Tab */}
        <TabsContent value="network" className="space-y-4 mt-3">
          <Card>
            <CardContent className="p-4">
              <p className="text-sm font-semibold mb-3">توزيع المواد في شبكة التعايش</p>
              <div className="h-[220px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={FLOW_DATA} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={45} outerRadius={80} paddingAngle={3}>
                      {FLOW_DATA.map((entry, i) => (
                        <Cell key={i} fill={entry.fill} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(v: number) => [`${v}%`, 'الحصة']} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="flex items-center justify-center gap-3 flex-wrap text-[10px]">
                {FLOW_DATA.map(d => (
                  <span key={d.name} className="flex items-center gap-1">
                    <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: d.fill }} />
                    {d.name}: {d.value}%
                  </span>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <p className="text-sm font-semibold mb-3">المطابقات والأطنان الشهرية</p>
              <div className="h-[200px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={MONTHLY_SYMBIOSIS}>
                    <XAxis dataKey="month" tick={{ fontSize: 10 }} />
                    <YAxis tick={{ fontSize: 10 }} />
                    <Tooltip />
                    <Bar dataKey="tons" fill="hsl(var(--primary))" name="أطنان" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="matches" fill="#10b981" name="مطابقات" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Network nodes */}
          <div className="grid grid-cols-2 gap-3">
            <Card>
              <CardContent className="p-3 text-center">
                <Factory className="h-5 w-5 mx-auto mb-1 text-red-500" />
                <div className="text-lg font-bold">18</div>
                <p className="text-[10px] text-muted-foreground">مصنع مُنتج</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-3 text-center">
                <Building2 className="h-5 w-5 mx-auto mb-1 text-emerald-600" />
                <div className="text-lg font-bold">12</div>
                <p className="text-[10px] text-muted-foreground">مصنع مُستقبل</p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Impact Tab */}
        <TabsContent value="impact" className="space-y-4 mt-3">
          <div className="grid grid-cols-2 gap-3">
            <Card className="bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800">
              <CardContent className="p-3 text-center">
                <Leaf className="h-5 w-5 mx-auto mb-1 text-emerald-600" />
                <div className="text-xl font-bold text-emerald-700 dark:text-emerald-400">{totalCO2Saved.toFixed(0)}</div>
                <p className="text-[10px] text-muted-foreground">طن CO₂ يتم توفيرها شهرياً</p>
              </CardContent>
            </Card>
            <Card className="bg-blue-50/50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800">
              <CardContent className="p-3 text-center">
                <DollarSign className="h-5 w-5 mx-auto mb-1 text-blue-600" />
                <div className="text-xl font-bold text-blue-700 dark:text-blue-400">32%</div>
                <p className="text-[10px] text-muted-foreground">متوسط التوفير المالي</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-3 text-center">
                <Truck className="h-5 w-5 mx-auto mb-1 text-amber-600" />
                <div className="text-lg font-bold">35 كم</div>
                <p className="text-[10px] text-muted-foreground">متوسط مسافة التوصيل</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-3 text-center">
                <Zap className="h-5 w-5 mx-auto mb-1 text-purple-600" />
                <div className="text-lg font-bold">94%</div>
                <p className="text-[10px] text-muted-foreground">معدل نجاح المطابقات</p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader className="pb-2 px-4 pt-3">
              <CardTitle className="text-sm">SDG 12: الاستهلاك والإنتاج المسؤولان</CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-3">
              <Progress value={78} className="h-3 mb-2" />
              <p className="text-xs text-muted-foreground">
                شبكة التعايش الصناعي ساهمت في تحويل {totalTonsMatched} طن شهرياً من المكبات إلى خطوط إنتاج جديدة،
                مما يوفر {totalCO2Saved.toFixed(1)} طن CO₂ ويدعم الاقتصاد الدائري.
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

const KPICard = ({ icon, value, label, color }: { icon: React.ReactNode; value: string | number; label: string; color: string }) => (
  <Card>
    <CardContent className="p-3 text-center">
      <div className={`flex justify-center mb-1 ${color}`}>{icon}</div>
      <div className="text-sm font-bold">{value}</div>
      <p className="text-[10px] text-muted-foreground">{label}</p>
    </CardContent>
  </Card>
);

export default CircularMatcherPage;
