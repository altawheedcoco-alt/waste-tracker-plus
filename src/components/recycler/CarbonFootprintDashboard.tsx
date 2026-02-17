import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Factory, Leaf, TreePine, Car, TrendingDown, TrendingUp,
  Recycle, RefreshCw, Loader2, Award, FileText, Printer
} from 'lucide-react';
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts';
import { useRecyclerCarbon } from '@/hooks/useRecyclerCarbon';
import { cn } from '@/lib/utils';
import CarbonCertificateView from './CarbonCertificateView';

const COLORS = ['#10B981', '#3B82F6', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899'];
const WASTE_LABELS: Record<string, string> = {
  plastic: 'بلاستيك', paper: 'ورق', metal: 'معادن', glass: 'زجاج',
  electronic: 'إلكترونيات', organic: 'عضوية', chemical: 'كيميائية',
  medical: 'طبية', construction: 'بناء', other: 'أخرى',
};

const CarbonFootprintDashboard = () => {
  const { productCarbon, facilityCarbon, calculateAll, issueCertificate, summary } = useRecyclerCarbon();
  const [selectedCert, setSelectedCert] = useState<{ data: any; type: 'product' | 'facility' } | null>(null);
  const [activeTab, setActiveTab] = useState('overview');

  const products = productCarbon.data || [];
  const facilities = facilityCarbon.data || [];
  const isLoading = productCarbon.isLoading || facilityCarbon.isLoading;

  // Waste type distribution
  const wasteMap: Record<string, number> = {};
  products.forEach((p: any) => {
    const t = p.waste_type || 'other';
    wasteMap[t] = (wasteMap[t] || 0) + (p.input_weight_tons || 0);
  });
  const wasteDistribution = Object.entries(wasteMap).map(([k, v]) => ({
    name: WASTE_LABELS[k] || k, value: parseFloat(v.toFixed(2)),
  }));

  // Monthly trend from facility records
  const monthlyTrend = facilities.slice(0, 12).reverse().map((f: any) => ({
    name: new Date(f.period_start).toLocaleDateString('ar-SA', { month: 'short', year: 'numeric' }),
    emissions: parseFloat((f.total_emissions || 0).toFixed(2)),
    savings: parseFloat((f.total_recycling_savings || 0).toFixed(2)),
    score: f.sustainability_score || 0,
  }));

  // KPI cards
  const kpis = [
    { title: 'إجمالي الانبعاثات', value: `${summary.totalEmissions.toFixed(2)} طن`, icon: Factory, color: 'text-red-500', bg: 'bg-red-500/10' },
    { title: 'الوفورات البيئية', value: `${summary.totalSavings.toFixed(2)} طن`, icon: Leaf, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
    { title: 'أشجار مُعادلة', value: `${summary.totalTrees}`, icon: TreePine, color: 'text-green-500', bg: 'bg-green-500/10' },
    { title: 'صافي الأثر', value: `${summary.netImpact.toFixed(2)} طن`, icon: summary.netImpact <= 0 ? TrendingDown : TrendingUp, color: summary.netImpact <= 0 ? 'text-emerald-500' : 'text-red-500', bg: summary.netImpact <= 0 ? 'bg-emerald-500/10' : 'bg-red-500/10' },
  ];

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="grid gap-4 md:grid-cols-4">{[...Array(4)].map((_, i) => <Card key={i}><CardContent className="p-5"><Skeleton className="h-16 w-full" /></CardContent></Card>)}</div>
        <Card><CardContent className="p-6"><Skeleton className="h-[300px] w-full" /></CardContent></Card>
      </div>
    );
  }

  if (selectedCert) {
    return (
      <CarbonCertificateView
        data={selectedCert.data}
        type={selectedCert.type}
        onBack={() => setSelectedCert(null)}
        onIssue={() => {
          issueCertificate.mutate({ id: selectedCert.data.id, type: selectedCert.type });
        }}
      />
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Leaf className="w-6 h-6 text-emerald-500" />
            البصمة الكربونية للمنشأة والمنتجات
          </h2>
          <p className="text-sm text-muted-foreground">تحليل شامل لانبعاثات CO₂ والوفورات البيئية</p>
        </div>
        <Button onClick={() => calculateAll.mutate()} disabled={calculateAll.isPending}>
          {calculateAll.isPending ? <Loader2 className="w-4 h-4 animate-spin ml-2" /> : <RefreshCw className="w-4 h-4 ml-2" />}
          حساب البصمة الكربونية
        </Button>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-3 grid-cols-2 md:grid-cols-4">
        {kpis.map((kpi, i) => (
          <Card key={i}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">{kpi.title}</p>
                  <p className="text-lg font-bold">{kpi.value}</p>
                </div>
                <div className={cn("p-2 rounded-full", kpi.bg)}>
                  <kpi.icon className={cn("h-4 w-4", kpi.color)} />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} dir="rtl">
        <TabsList className="w-full flex gap-1 bg-muted/50 p-1 h-auto flex-wrap">
          <TabsTrigger value="overview" className="gap-1 text-xs"><Factory className="w-3.5 h-3.5" />نظرة عامة</TabsTrigger>
          <TabsTrigger value="products" className="gap-1 text-xs"><Recycle className="w-3.5 h-3.5" />بصمة المنتجات</TabsTrigger>
          <TabsTrigger value="facility" className="gap-1 text-xs"><Award className="w-3.5 h-3.5" />بصمة المنشأة</TabsTrigger>
        </TabsList>

        {/* Overview */}
        <TabsContent value="overview" className="space-y-4 mt-4">
          <div className="grid gap-4 md:grid-cols-3">
            {/* Emissions Trend */}
            <Card className="md:col-span-2">
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2"><Factory className="w-4 h-4 text-primary" />اتجاه الانبعاثات والوفورات</CardTitle>
                <CardDescription>مقارنة شهرية</CardDescription>
              </CardHeader>
              <CardContent>
                {monthlyTrend.length > 0 ? (
                  <ResponsiveContainer width="100%" height={280}>
                    <AreaChart data={monthlyTrend}>
                      <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                      <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                      <YAxis tick={{ fontSize: 10 }} />
                      <Tooltip />
                      <Legend />
                      <Area type="monotone" dataKey="emissions" name="الانبعاثات" stroke="#EF4444" fill="#EF4444" fillOpacity={0.15} strokeWidth={2} />
                      <Area type="monotone" dataKey="savings" name="الوفورات" stroke="#10B981" fill="#10B981" fillOpacity={0.15} strokeWidth={2} />
                    </AreaChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-[280px] text-muted-foreground text-sm">اضغط "حساب البصمة الكربونية" لبدء التحليل</div>
                )}
              </CardContent>
            </Card>

            {/* Waste Distribution */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2"><Recycle className="w-4 h-4 text-primary" />توزيع المخلفات</CardTitle>
              </CardHeader>
              <CardContent>
                {wasteDistribution.length > 0 ? (
                  <ResponsiveContainer width="100%" height={280}>
                    <PieChart>
                      <Pie data={wasteDistribution} cx="50%" cy="50%" innerRadius={45} outerRadius={85} paddingAngle={3} dataKey="value"
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                        {wasteDistribution.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-[280px] text-muted-foreground text-sm">لا توجد بيانات</div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Products */}
        <TabsContent value="products" className="space-y-3 mt-4">
          {products.length === 0 ? (
            <Card><CardContent className="py-12 text-center text-muted-foreground">
              <Leaf className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p>لا توجد بيانات بصمة كربونية للمنتجات بعد</p>
              <Button className="mt-3" variant="outline" onClick={() => calculateAll.mutate()} disabled={calculateAll.isPending}>حساب البصمة</Button>
            </CardContent></Card>
          ) : (
            products.map((p: any) => (
              <Card key={p.id}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <div className="flex-1 min-w-[200px]">
                      <p className="font-medium text-sm">{p.product_name}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        المدخلات: {p.input_weight_tons} طن → المخرجات: {p.output_weight_tons} طن | المسافة: {p.distance_km} كم
                      </p>
                      <div className="flex gap-3 mt-2 text-xs">
                        <span className="text-red-500">انبعاثات: {p.total_emissions} طن CO₂</span>
                        <span className="text-emerald-500">وفورات: {p.recycling_savings} طن CO₂</span>
                        <span className="text-green-600">🌳 {p.trees_equivalent} شجرة</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {p.certificate_issued ? (
                        <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600 text-xs">شهادة صادرة</Badge>
                      ) : (
                        <Badge variant="outline" className="text-xs">قيد الانتظار</Badge>
                      )}
                      <Button size="sm" variant="outline" onClick={() => setSelectedCert({ data: p, type: 'product' })}>
                        <FileText className="w-3.5 h-3.5 ml-1" />
                        شهادة
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        {/* Facility */}
        <TabsContent value="facility" className="space-y-3 mt-4">
          {facilities.length === 0 ? (
            <Card><CardContent className="py-12 text-center text-muted-foreground">
              <Factory className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p>لا توجد بيانات بصمة كربونية للمنشأة بعد</p>
            </CardContent></Card>
          ) : (
            facilities.map((f: any) => (
              <Card key={f.id}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <div className="flex-1 min-w-[200px]">
                      <p className="font-medium text-sm">
                        الفترة: {new Date(f.period_start).toLocaleDateString('ar-SA')} - {new Date(f.period_end).toLocaleDateString('ar-SA')}
                      </p>
                      <div className="flex gap-4 mt-2 text-xs flex-wrap">
                        <span>شحنات: {f.shipments_count}</span>
                        <span>مدخلات: {f.total_input_tons} طن</span>
                        <span className="text-red-500">انبعاثات: {f.total_emissions} طن</span>
                        <span className="text-emerald-500">وفورات: {f.total_recycling_savings} طن</span>
                        <span className="text-green-600">🌳 {f.total_trees_equivalent} شجرة</span>
                      </div>
                      <div className="mt-2">
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-muted-foreground">نقاط الاستدامة:</span>
                          <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden max-w-[150px]">
                            <div className="h-full rounded-full transition-all" style={{
                              width: `${f.sustainability_score}%`,
                              backgroundColor: f.sustainability_score >= 70 ? '#10B981' : f.sustainability_score >= 40 ? '#F59E0B' : '#EF4444',
                            }} />
                          </div>
                          <span className="text-xs font-bold">{f.sustainability_score}/100</span>
                        </div>
                      </div>
                    </div>
                    <Button size="sm" variant="outline" onClick={() => setSelectedCert({ data: f, type: 'facility' })}>
                      <FileText className="w-3.5 h-3.5 ml-1" />
                      شهادة المنشأة
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default CarbonFootprintDashboard;
