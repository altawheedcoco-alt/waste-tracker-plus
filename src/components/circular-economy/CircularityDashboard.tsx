import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import {
  BarChart3, Recycle, Leaf, TrendingUp, Droplets, Zap,
  ArrowUpRight, Globe, Factory, TreePine, Target
} from 'lucide-react';
import {
  ResponsiveContainer, RadarChart, Radar, PolarGrid, PolarAngleAxis,
  PolarRadiusAxis, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid,
  PieChart, Pie, Cell, BarChart, Bar, Legend
} from 'recharts';

const COLORS = ['hsl(var(--primary))', '#10b981', '#f59e0b', '#3b82f6', '#8b5cf6', '#ef4444'];

const CircularityDashboard = () => {
  const { data: kpis } = useQuery({
    queryKey: ['circularity-kpis'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('circularity_kpis')
        .select('*')
        .order('period_month', { ascending: false })
        .limit(12);
      if (error) throw error;
      return data || [];
    },
  });

  const { data: dppCount } = useQuery({
    queryKey: ['dpp-count'],
    queryFn: async () => {
      const { count } = await supabase
        .from('digital_product_passports')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'active');
      return count || 0;
    },
  });

  const { data: symbiosisCount } = useQuery({
    queryKey: ['symbiosis-count'],
    queryFn: async () => {
      const { count } = await supabase
        .from('symbiosis_matches')
        .select('*', { count: 'exact', head: true })
        .in('status', ['active', 'accepted']);
      return count || 0;
    },
  });

  const latest = kpis?.[0];
  const avgMCI = kpis?.length ? kpis.reduce((s, k) => s + Number(k.mci_score || 0), 0) / kpis.length : 0;

  // Generate demo data if no real data
  const radarData = [
    { axis: 'معدل التدوير', value: Number(latest?.recycling_rate || 65), max: 100 },
    { axis: 'تحويل النفايات', value: Number(latest?.waste_diversion_rate || 72), max: 100 },
    { axis: 'مؤشر MCI', value: Math.round(avgMCI * 100) || 58, max: 100 },
    { axis: 'التكافل الصناعي', value: Math.min((symbiosisCount || 0) * 10, 100) || 30, max: 100 },
    { axis: 'جوازات DPP', value: Math.min((dppCount || 0) * 5, 100) || 25, max: 100 },
    { axis: 'الاسترداد الاقتصادي', value: Number(latest?.recovery_rate || 55), max: 100 },
  ];

  const trendData = (kpis || []).reverse().map(k => ({
    month: k.period_month?.slice(5) || '',
    mci: Math.round(Number(k.mci_score || 0) * 100),
    recyclingRate: Number(k.recycling_rate || 0),
    diversion: Number(k.waste_diversion_rate || 0),
  }));

  const flowData = [
    { name: 'مدخلات مُعاد تدويرها', value: Number(latest?.recycled_input_tons || 450) },
    { name: 'مدخلات خام', value: Number(latest?.virgin_input_tons || 200) },
    { name: 'مخرجات مُدوّرة', value: Number(latest?.recycled_output_tons || 380) },
    { name: 'نفايات نهائية', value: Number(latest?.waste_output_tons || 70) },
  ];

  return (
    <div className="space-y-4">
      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
        {[
          { icon: Globe, label: 'مؤشر الدائرية MCI', value: `${Math.round(avgMCI * 100) || 58}%`, color: 'text-blue-500', bg: 'bg-blue-500/10' },
          { icon: Recycle, label: 'معدل التدوير', value: `${Number(latest?.recycling_rate || 65)}%`, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
          { icon: Target, label: 'معدل التحويل', value: `${Number(latest?.waste_diversion_rate || 72)}%`, color: 'text-purple-500', bg: 'bg-purple-500/10' },
          { icon: TrendingUp, label: 'قيمة مستردة', value: `${(Number(latest?.material_value_recovered_egp || 125000) / 1000).toFixed(0)}K`, color: 'text-amber-500', bg: 'bg-amber-500/10' },
          { icon: Leaf, label: 'CO₂ تم تجنبه', value: `${Number(latest?.carbon_avoided_tons || 45)} طن`, color: 'text-green-500', bg: 'bg-green-500/10' },
          { icon: Factory, label: 'روابط تكافل', value: symbiosisCount || 0, color: 'text-orange-500', bg: 'bg-orange-500/10' },
        ].map((kpi, i) => (
          <Card key={i} className="border-border/50">
            <CardContent className="p-3">
              <div className={`w-8 h-8 rounded-lg ${kpi.bg} flex items-center justify-center mb-2`}>
                <kpi.icon className={`w-4 h-4 ${kpi.color}`} />
              </div>
              <p className="text-xl font-bold">{kpi.value}</p>
              <p className="text-[10px] text-muted-foreground">{kpi.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        {/* Radar Chart */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-blue-500" />
              مؤشرات الأداء الدائري
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={280}>
              <RadarChart data={radarData}>
                <PolarGrid stroke="hsl(var(--border))" />
                <PolarAngleAxis dataKey="axis" tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} />
                <PolarRadiusAxis angle={90} domain={[0, 100]} tick={false} />
                <Radar name="الأداء" dataKey="value" stroke="hsl(var(--primary))" fill="hsl(var(--primary))" fillOpacity={0.2} strokeWidth={2} />
              </RadarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Material Flow */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Recycle className="w-4 h-4 text-emerald-500" />
              تدفق المواد (طن)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie data={flowData} cx="50%" cy="50%" outerRadius={100} innerRadius={50} dataKey="value" label={({ name, value }) => `${name}: ${value}`}>
                  {flowData.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Trend Chart */}
      {trendData.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-emerald-500" />
              اتجاه مؤشرات الدائرية
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <AreaChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="month" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} domain={[0, 100]} />
                <Tooltip />
                <Legend />
                <Area type="monotone" dataKey="mci" name="MCI %" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.1} />
                <Area type="monotone" dataKey="recyclingRate" name="معدل التدوير %" stroke="#10b981" fill="#10b981" fillOpacity={0.1} />
                <Area type="monotone" dataKey="diversion" name="معدل التحويل %" stroke="#8b5cf6" fill="#8b5cf6" fillOpacity={0.1} />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* Environmental Savings */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { icon: TreePine, label: 'أشجار معادلة', value: Math.round(Number(latest?.carbon_avoided_tons || 45) * 1000 / 21.77), unit: 'شجرة/سنة' },
          { icon: Droplets, label: 'مياه تم توفيرها', value: Number(latest?.water_saved_m3 || 12500), unit: 'm³' },
          { icon: Zap, label: 'طاقة تم توفيرها', value: Number(latest?.energy_saved_mwh || 85), unit: 'MWh' },
          { icon: TrendingUp, label: 'وفر اقتصادي', value: `${(Number(latest?.cost_savings_egp || 75000) / 1000).toFixed(0)}K`, unit: 'ج.م' },
        ].map((s, i) => (
          <Card key={i} className="bg-emerald-500/5 border-emerald-500/20">
            <CardContent className="p-3 text-center">
              <s.icon className="w-6 h-6 text-emerald-500 mx-auto mb-1" />
              <p className="text-xl font-bold">{typeof s.value === 'number' ? s.value.toLocaleString() : s.value}</p>
              <p className="text-[10px] text-muted-foreground">{s.label}</p>
              <p className="text-[9px] text-emerald-600">{s.unit}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default CircularityDashboard;
