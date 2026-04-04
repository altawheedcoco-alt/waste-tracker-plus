import { useState, useMemo } from 'react';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DollarSign, TrendingUp, AlertCircle, Package, Zap, BarChart3 } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import BackButton from '@/components/navigation/BackButton';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

// Approximate market prices per ton (EGP)
const MARKET_PRICES: Record<string, number> = {
  'plastic': 8000,
  'بلاستيك': 8000,
  'paper': 4000,
  'ورق': 4000,
  'metal': 12000,
  'معادن': 12000,
  'حديد': 15000,
  'iron': 15000,
  'aluminum': 45000,
  'ألومنيوم': 45000,
  'glass': 1500,
  'زجاج': 1500,
  'organic': 500,
  'عضوي': 500,
  'wood': 2000,
  'خشب': 2000,
  'textile': 3000,
  'نسيج': 3000,
  'rubber': 5000,
  'مطاط': 5000,
  'electronic': 20000,
  'إلكتروني': 20000,
};

const CHART_COLORS = ['hsl(var(--primary))', 'hsl(var(--chart-2))', 'hsl(var(--chart-3))', 'hsl(var(--chart-4))', 'hsl(var(--chart-5))'];

const RevenueRadar = () => {
  const { profile } = useAuth();
  const orgId = profile?.organization_id;
  const [activeTab, setActiveTab] = useState('overview');

  const { data: shipments = [] } = useQuery({
    queryKey: ['revenue-radar-shipments', orgId],
    queryFn: async () => {
      if (!orgId) return [];
      const { data } = await supabase
        .from('shipments')
        .select('id, waste_type, weight_kg, status, created_at, amount')
        .or(`source_organization_id.eq.${orgId},destination_organization_id.eq.${orgId}`)
        .order('created_at', { ascending: false })
        .limit(1000);
      return data || [];
    },
    enabled: !!orgId,
  });

  const analysis = useMemo(() => {
    const wasteBreakdown: Record<string, { weight: number; count: number; actualRevenue: number; potentialRevenue: number }> = {};
    let totalActual = 0;
    let totalPotential = 0;
    let missedOpportunities = 0;

    for (const s of shipments as any[]) {
      const type = s.waste_type || 'غير مصنف';
      if (!wasteBreakdown[type]) {
        wasteBreakdown[type] = { weight: 0, count: 0, actualRevenue: 0, potentialRevenue: 0 };
      }
      const weightTon = (s.weight_kg || 0) / 1000;
      wasteBreakdown[type].weight += s.weight_kg || 0;
      wasteBreakdown[type].count += 1;
      wasteBreakdown[type].actualRevenue += s.amount || 0;

      // Find market price
      const price = Object.entries(MARKET_PRICES).find(([key]) =>
        type.toLowerCase().includes(key.toLowerCase())
      );
      const potential = price ? weightTon * price[1] : 0;
      wasteBreakdown[type].potentialRevenue += potential;

      totalActual += s.amount || 0;
      totalPotential += potential;

      if (potential > (s.amount || 0) * 1.2) {
        missedOpportunities++;
      }
    }

    const gap = totalPotential - totalActual;
    const gapPercent = totalPotential > 0 ? Math.round((gap / totalPotential) * 100) : 0;

    const topOpportunities = Object.entries(wasteBreakdown)
      .map(([type, data]) => ({
        type,
        ...data,
        gap: data.potentialRevenue - data.actualRevenue,
      }))
      .filter(o => o.gap > 0)
      .sort((a, b) => b.gap - a.gap)
      .slice(0, 5);

    const chartData = Object.entries(wasteBreakdown)
      .map(([type, data]) => ({
        name: type,
        فعلي: Math.round(data.actualRevenue),
        محتمل: Math.round(data.potentialRevenue),
      }))
      .filter(d => d.فعلي > 0 || d.محتمل > 0)
      .slice(0, 8);

    const pieData = Object.entries(wasteBreakdown)
      .map(([type, data]) => ({ name: type, value: Math.round(data.weight) }))
      .filter(d => d.value > 0)
      .sort((a, b) => b.value - a.value)
      .slice(0, 6);

    return { wasteBreakdown, totalActual, totalPotential, gap, gapPercent, missedOpportunities, topOpportunities, chartData, pieData };
  }, [shipments]);

  const formatCurrency = (v: number) => v.toLocaleString('ar-EG') + ' ج.م';

  return (
    <DashboardLayout>
      <div className="p-4 md:p-6 space-y-6 max-w-7xl mx-auto" dir="rtl">
        <div className="flex items-center gap-3">
          <BackButton />
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 text-primary-foreground">
              <DollarSign className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl md:text-2xl font-bold text-foreground">رادار الفلوس المنسية</h1>
              <p className="text-sm text-muted-foreground">اكتشف الإيرادات الضائعة من المخلفات القابلة للتدوير</p>
            </div>
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <KPICard icon={<DollarSign className="w-5 h-5" />} label="الإيراد الفعلي" value={formatCurrency(analysis.totalActual)} color="text-green-600 dark:text-green-400" />
          <KPICard icon={<TrendingUp className="w-5 h-5" />} label="الإيراد المحتمل" value={formatCurrency(analysis.totalPotential)} color="text-primary" />
          <KPICard icon={<AlertCircle className="w-5 h-5" />} label="الفجوة" value={formatCurrency(analysis.gap)} subtitle={`${analysis.gapPercent}% من المحتمل`} color="text-yellow-600 dark:text-yellow-400" />
          <KPICard icon={<Package className="w-5 h-5" />} label="فرص ضائعة" value={analysis.missedOpportunities.toString()} subtitle="شحنة بسعر أقل" color="text-destructive" />
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="w-full justify-start">
            <TabsTrigger value="overview">المقارنة</TabsTrigger>
            <TabsTrigger value="opportunities">الفرص</TabsTrigger>
            <TabsTrigger value="breakdown">التوزيع</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="mt-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <BarChart3 className="w-4 h-4 text-primary" />
                  الإيراد الفعلي vs المحتمل حسب نوع المخلفات
                </CardTitle>
              </CardHeader>
              <CardContent>
                {analysis.chartData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={analysis.chartData} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis type="number" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }} />
                      <YAxis dataKey="name" type="category" width={80} tick={{ fill: 'hsl(var(--foreground))', fontSize: 11 }} />
                      <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 8, color: 'hsl(var(--foreground))' }} />
                      <Bar dataKey="فعلي" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
                      <Bar dataKey="محتمل" fill="hsl(var(--chart-2))" radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="text-center py-12 text-muted-foreground">لا توجد بيانات كافية للتحليل</div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="opportunities" className="mt-4 space-y-3">
            {analysis.topOpportunities.length > 0 ? analysis.topOpportunities.map((opp, i) => (
              <Card key={opp.type} className="hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-bold text-primary">
                        {i + 1}
                      </div>
                      <div>
                        <h3 className="font-semibold text-sm text-foreground">{opp.type}</h3>
                        <p className="text-xs text-muted-foreground">{opp.count} شحنة — {(opp.weight / 1000).toFixed(1)} طن</p>
                      </div>
                    </div>
                    <div className="text-left">
                      <Badge variant="secondary" className="mb-1">
                        <Zap className="w-3 h-3 ml-1" />
                        فجوة: {formatCurrency(opp.gap)}
                      </Badge>
                      <p className="text-xs text-muted-foreground">فعلي: {formatCurrency(opp.actualRevenue)} | محتمل: {formatCurrency(opp.potentialRevenue)}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )) : (
              <Card><CardContent className="p-8 text-center text-muted-foreground">لا توجد فرص ضائعة — أداء ممتاز! 🎉</CardContent></Card>
            )}
          </TabsContent>

          <TabsContent value="breakdown" className="mt-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">توزيع المخلفات حسب الوزن</CardTitle>
              </CardHeader>
              <CardContent>
                {analysis.pieData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie data={analysis.pieData} cx="50%" cy="50%" outerRadius={100} label={({ name, value }) => `${name}: ${(value / 1000).toFixed(1)}ط`} dataKey="value">
                        {analysis.pieData.map((_, i) => (
                          <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 8, color: 'hsl(var(--foreground))' }} />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="text-center py-12 text-muted-foreground">لا توجد بيانات</div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
};

const KPICard = ({ icon, label, value, subtitle, color }: { icon: React.ReactNode; label: string; value: string; subtitle?: string; color: string }) => (
  <Card>
    <CardContent className="p-4">
      <div className={`mb-2 ${color}`}>{icon}</div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className={`text-lg font-bold ${color}`}>{value}</p>
      {subtitle && <p className="text-xs text-muted-foreground">{subtitle}</p>}
    </CardContent>
  </Card>
);

export default RevenueRadar;
