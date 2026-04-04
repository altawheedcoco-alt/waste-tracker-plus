/**
 * IoT Fill-Level Prediction Dashboard
 * رادار التنبؤ بامتلاء الحاويات مع محاكاة بيانات IoT
 */
import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Radio, Trash2, MapPin, Clock, TrendingUp, AlertTriangle,
  Thermometer, Weight, Battery, Wifi, RefreshCw, Route,
  BarChart3, Zap, Bell, CheckCircle2, XCircle
} from 'lucide-react';
import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip,
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell
} from 'recharts';

// Simulated IoT container data
const generateContainers = () => {
  const locations = [
    'المعادي - شارع 9', 'مدينة نصر - عباس العقاد', 'الزمالك - 26 يوليو',
    'المهندسين - شهاب', 'حلوان - المنطقة الصناعية', 'العبور - المنطقة أ',
    '6 أكتوبر - الحي 12', 'التجمع الخامس - التسعين', 'شبرا - المظلات',
    'الدقي - التحرير', 'مصر الجديدة - كوربة', 'العاشر - الصناعية',
  ];
  const types = ['بلاستيك', 'ورق', 'معادن', 'زجاج', 'عضوي', 'عام'];

  return locations.map((loc, i) => {
    const fillLevel = Math.round(Math.random() * 100);
    const temp = 20 + Math.round(Math.random() * 25);
    const battery = 20 + Math.round(Math.random() * 80);
    const lastCollected = Math.floor(Math.random() * 72);
    const avgFillRatePerHour = 0.5 + Math.random() * 3;
    const hoursToFull = fillLevel < 100 ? Math.round((100 - fillLevel) / avgFillRatePerHour) : 0;

    return {
      id: `CNT-${String(i + 1).padStart(3, '0')}`,
      location: loc,
      wasteType: types[i % types.length],
      fillLevel,
      temperature: temp,
      battery,
      signal: Math.random() > 0.1 ? 'good' : 'weak',
      lastUpdate: `منذ ${Math.floor(Math.random() * 60)} دقيقة`,
      lastCollectedHoursAgo: lastCollected,
      avgFillRatePerHour: Math.round(avgFillRatePerHour * 10) / 10,
      predictedFullHours: hoursToFull,
      weightKg: Math.round(fillLevel * 0.8 * (1 + Math.random())),
      alerts: fillLevel > 85 ? ['امتلاء وشيك'] : temp > 40 ? ['حرارة مرتفعة'] : [],
      status: fillLevel > 90 ? 'critical' : fillLevel > 70 ? 'warning' : 'normal',
    };
  });
};

// Simulated prediction data (24h forecast)
const generatePredictionData = () => {
  let val = 45;
  return Array.from({ length: 24 }, (_, i) => {
    val = Math.min(100, val + (Math.random() * 4 - 0.5));
    return {
      hour: `${String(i).padStart(2, '0')}:00`,
      actual: i < 12 ? Math.round(val) : null,
      predicted: Math.round(val + (i >= 12 ? Math.random() * 5 : 0)),
    };
  });
};

const STATUS_CONFIG = {
  critical: { color: 'text-red-600 bg-red-50 border-red-200 dark:bg-red-950/30 dark:border-red-800', label: 'حرج', icon: XCircle },
  warning: { color: 'text-amber-600 bg-amber-50 border-amber-200 dark:bg-amber-950/30 dark:border-amber-800', label: 'تحذير', icon: AlertTriangle },
  normal: { color: 'text-emerald-600 bg-emerald-50 border-emerald-200 dark:bg-emerald-950/30 dark:border-emerald-800', label: 'طبيعي', icon: CheckCircle2 },
};

const FILL_COLOR = (level: number) =>
  level > 90 ? 'bg-red-500' : level > 70 ? 'bg-amber-500' : level > 40 ? 'bg-blue-500' : 'bg-emerald-500';

const IoTFillPredictionDashboard = () => {
  const [selectedContainer, setSelectedContainer] = useState<string | null>(null);
  const containers = useMemo(() => generateContainers(), []);
  const predictionData = useMemo(() => generatePredictionData(), []);

  const critical = containers.filter(c => c.status === 'critical').length;
  const warning = containers.filter(c => c.status === 'warning').length;
  const avgFill = Math.round(containers.reduce((s, c) => s + c.fillLevel, 0) / containers.length);
  const totalWeight = containers.reduce((s, c) => s + c.weightKg, 0);

  const fillDistribution = [
    { name: '0-25%', value: containers.filter(c => c.fillLevel <= 25).length, fill: '#10b981' },
    { name: '26-50%', value: containers.filter(c => c.fillLevel > 25 && c.fillLevel <= 50).length, fill: '#3b82f6' },
    { name: '51-75%', value: containers.filter(c => c.fillLevel > 50 && c.fillLevel <= 75).length, fill: '#f59e0b' },
    { name: '76-100%', value: containers.filter(c => c.fillLevel > 75).length, fill: '#ef4444' },
  ];

  const collectionSchedule = containers
    .filter(c => c.predictedFullHours <= 12)
    .sort((a, b) => a.predictedFullHours - b.predictedFullHours);

  const selected = containers.find(c => c.id === selectedContainer);

  return (
    <div className="space-y-4" dir="rtl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-black flex items-center gap-2">
            <Radio className="h-6 w-6 text-primary animate-pulse" />
            رادار التنبؤ بالامتلاء
          </h1>
          <p className="text-xs text-muted-foreground">IoT Fill-Level Prediction • LoRaWAN / NB-IoT</p>
        </div>
        <Button size="sm" variant="outline" className="text-xs">
          <RefreshCw className="h-3.5 w-3.5 ml-1" />
          تحديث البيانات
        </Button>
      </div>

      {/* KPI Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <KPIBox icon={<Trash2 className="h-4 w-4" />} value={containers.length} label="حاوية متصلة" color="text-primary" />
        <KPIBox icon={<AlertTriangle className="h-4 w-4" />} value={`${critical} حرج / ${warning} تحذير`} label="تنبيهات نشطة" color="text-red-600" />
        <KPIBox icon={<BarChart3 className="h-4 w-4" />} value={`${avgFill}%`} label="متوسط الامتلاء" color="text-amber-600" />
        <KPIBox icon={<Weight className="h-4 w-4" />} value={`${(totalWeight / 1000).toFixed(1)} طن`} label="إجمالي الوزن التقديري" color="text-blue-600" />
      </div>

      <Tabs defaultValue="live" dir="rtl">
        <TabsList className="w-full grid grid-cols-4">
          <TabsTrigger value="live" className="text-xs">الحاويات الحية</TabsTrigger>
          <TabsTrigger value="prediction" className="text-xs">التنبؤ</TabsTrigger>
          <TabsTrigger value="schedule" className="text-xs">جدولة الجمع</TabsTrigger>
          <TabsTrigger value="analytics" className="text-xs">تحليلات</TabsTrigger>
        </TabsList>

        {/* Live Containers */}
        <TabsContent value="live" className="space-y-3 mt-3">
          {containers.map(c => {
            const cfg = STATUS_CONFIG[c.status as keyof typeof STATUS_CONFIG];
            return (
              <Card
                key={c.id}
                className={`cursor-pointer transition-all hover:shadow-md ${selectedContainer === c.id ? 'ring-2 ring-primary' : ''} ${cfg.color}`}
                onClick={() => setSelectedContainer(selectedContainer === c.id ? null : c.id)}
              >
                <CardContent className="p-3">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-[9px] h-5">{c.id}</Badge>
                      <span className="text-xs font-semibold">{c.location}</span>
                    </div>
                    <Badge className={`text-[9px] h-5 ${
                      c.status === 'critical' ? 'bg-red-600' : c.status === 'warning' ? 'bg-amber-500' : 'bg-emerald-600'
                    } text-white`}>
                      {cfg.label}
                    </Badge>
                  </div>

                  <div className="flex items-center gap-3 mb-2">
                    <div className="flex-1">
                      <div className="flex justify-between text-[10px] text-muted-foreground mb-1">
                        <span>{c.wasteType}</span>
                        <span className="font-bold text-foreground">{c.fillLevel}%</span>
                      </div>
                      <div className="h-3 bg-muted/50 rounded-full overflow-hidden">
                        <div className={`h-full ${FILL_COLOR(c.fillLevel)} rounded-full transition-all`} style={{ width: `${c.fillLevel}%` }} />
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 text-[10px] text-muted-foreground flex-wrap">
                    <span className="flex items-center gap-1"><Thermometer className="h-3 w-3" />{c.temperature}°C</span>
                    <span className="flex items-center gap-1"><Battery className="h-3 w-3" />{c.battery}%</span>
                    <span className="flex items-center gap-1"><Weight className="h-3 w-3" />{c.weightKg} كجم</span>
                    <span className="flex items-center gap-1"><Wifi className="h-3 w-3" />{c.signal === 'good' ? 'قوي' : 'ضعيف'}</span>
                    <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{c.lastUpdate}</span>
                  </div>

                  {c.predictedFullHours > 0 && c.predictedFullHours <= 24 && (
                    <p className="text-[10px] font-semibold text-amber-600 mt-1.5">
                      ⏱️ متوقع الامتلاء خلال {c.predictedFullHours} ساعة ({c.avgFillRatePerHour}%/ساعة)
                    </p>
                  )}

                  {c.alerts.length > 0 && (
                    <div className="flex gap-1 mt-1.5">
                      {c.alerts.map((a, i) => (
                        <Badge key={i} variant="destructive" className="text-[9px] h-4">{a}</Badge>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </TabsContent>

        {/* Prediction Tab */}
        <TabsContent value="prediction" className="space-y-4 mt-3">
          <Card>
            <CardContent className="p-4">
              <p className="text-sm font-semibold mb-3">التنبؤ بمستوى الامتلاء (24 ساعة)</p>
              <div className="h-[250px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={predictionData}>
                    <XAxis dataKey="hour" tick={{ fontSize: 10 }} />
                    <YAxis domain={[0, 100]} tick={{ fontSize: 10 }} />
                    <Tooltip />
                    <Line type="monotone" dataKey="actual" stroke="hsl(var(--primary))" strokeWidth={2} dot={false} name="فعلي" connectNulls={false} />
                    <Line type="monotone" dataKey="predicted" stroke="#f59e0b" strokeWidth={2} strokeDasharray="5 5" dot={false} name="متوقع" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
              <div className="flex items-center justify-center gap-4 mt-2 text-[10px]">
                <span className="flex items-center gap-1"><div className="w-3 h-0.5 bg-primary" /> فعلي</span>
                <span className="flex items-center gap-1"><div className="w-3 h-0.5 bg-amber-500 border-dashed" /> متوقع (AI)</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <p className="text-sm font-semibold mb-3">دقة التنبؤ حسب الأسبوع</p>
              <div className="h-[200px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={[
                    { week: 'أسبوع 1', accuracy: 92 },
                    { week: 'أسبوع 2', accuracy: 88 },
                    { week: 'أسبوع 3', accuracy: 94 },
                    { week: 'أسبوع 4', accuracy: 91 },
                  ]}>
                    <XAxis dataKey="week" tick={{ fontSize: 10 }} />
                    <YAxis domain={[80, 100]} tick={{ fontSize: 10 }} />
                    <Tooltip formatter={(v: number) => [`${v}%`, 'الدقة']} />
                    <Bar dataKey="accuracy" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Schedule Tab */}
        <TabsContent value="schedule" className="space-y-3 mt-3">
          <Card className="border-amber-200 dark:border-amber-800">
            <CardHeader className="pb-2 px-4 pt-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <Route className="h-4 w-4 text-amber-600" />
                جدول الجمع المقترح (AI)
                <Badge variant="outline" className="text-[9px] h-5">{collectionSchedule.length} حاوية</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-3 space-y-2">
              {collectionSchedule.length > 0 ? collectionSchedule.map((c, i) => (
                <div key={c.id} className="flex items-center justify-between p-2 rounded-lg bg-muted/30 border border-border/50">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary">{i + 1}</div>
                    <div>
                      <p className="text-xs font-semibold">{c.location}</p>
                      <p className="text-[10px] text-muted-foreground">{c.id} • {c.wasteType}</p>
                    </div>
                  </div>
                  <div className="text-left">
                    <p className="text-xs font-bold text-amber-600">{c.predictedFullHours}h</p>
                    <p className="text-[9px] text-muted-foreground">{c.fillLevel}%</p>
                  </div>
                </div>
              )) : (
                <div className="text-center py-6 text-muted-foreground">
                  <CheckCircle2 className="h-8 w-8 mx-auto mb-2 opacity-30" />
                  <p className="text-xs">لا توجد حاويات تحتاج جمع عاجل</p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <p className="text-sm font-semibold mb-2">تحسين المسار المقترح</p>
              <div className="grid grid-cols-3 gap-3 text-center">
                <div className="p-2 rounded-lg bg-emerald-50 dark:bg-emerald-950/30">
                  <p className="text-lg font-bold text-emerald-600">32%</p>
                  <p className="text-[9px] text-muted-foreground">توفير مسافة</p>
                </div>
                <div className="p-2 rounded-lg bg-blue-50 dark:bg-blue-950/30">
                  <p className="text-lg font-bold text-blue-600">2.5h</p>
                  <p className="text-[9px] text-muted-foreground">وقت الجولة</p>
                </div>
                <div className="p-2 rounded-lg bg-amber-50 dark:bg-amber-950/30">
                  <p className="text-lg font-bold text-amber-600">18L</p>
                  <p className="text-[9px] text-muted-foreground">وقود متوقع</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Analytics Tab */}
        <TabsContent value="analytics" className="space-y-4 mt-3">
          <Card>
            <CardContent className="p-4">
              <p className="text-sm font-semibold mb-3">توزيع مستويات الامتلاء</p>
              <div className="h-[200px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={fillDistribution} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={45} outerRadius={75} paddingAngle={3}>
                      {fillDistribution.map((entry, i) => (
                        <Cell key={i} fill={entry.fill} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="flex items-center justify-center gap-3 flex-wrap text-[10px]">
                {fillDistribution.map(d => (
                  <span key={d.name} className="flex items-center gap-1">
                    <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: d.fill }} />
                    {d.name}: {d.value}
                  </span>
                ))}
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-2 gap-3">
            <Card>
              <CardContent className="p-3 text-center">
                <Zap className="h-5 w-5 mx-auto mb-1 text-amber-500" />
                <div className="text-lg font-bold">87%</div>
                <p className="text-[10px] text-muted-foreground">كفاءة الجمع</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-3 text-center">
                <Bell className="h-5 w-5 mx-auto mb-1 text-red-500" />
                <div className="text-lg font-bold">{containers.reduce((s, c) => s + c.alerts.length, 0)}</div>
                <p className="text-[10px] text-muted-foreground">تنبيهات اليوم</p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

const KPIBox = ({ icon, value, label, color }: { icon: React.ReactNode; value: string | number; label: string; color: string }) => (
  <Card>
    <CardContent className="p-3 text-center">
      <div className={`flex justify-center mb-1 ${color}`}>{icon}</div>
      <div className="text-sm font-bold">{value}</div>
      <p className="text-[10px] text-muted-foreground">{label}</p>
    </CardContent>
  </Card>
);

export default IoTFillPredictionDashboard;
