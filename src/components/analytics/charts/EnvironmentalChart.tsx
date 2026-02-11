import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import {
  AreaChart, Area, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend, RadialBarChart, RadialBar,
} from 'recharts';
import { Leaf, Recycle, Factory, TreePine, TrendingUp, TrendingDown } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { format, eachMonthOfInterval } from 'date-fns';
import { ar } from 'date-fns/locale';
import { cn } from '@/lib/utils';

interface EnvironmentalChartProps {
  organizationId: string | null;
  dateRange: { from: Date; to: Date };
}

const COLORS = ['#10B981', '#3B82F6', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899'];

const EnvironmentalChart = ({ organizationId, dateRange }: EnvironmentalChartProps) => {
  const { data, isLoading } = useQuery({
    queryKey: ['environmental-analytics', organizationId, dateRange.from.toISOString(), dateRange.to.toISOString()],
    queryFn: async () => {
      if (!organizationId) return null;

      // Fetch carbon footprint records
      const { data: carbonRecords } = await supabase
        .from('carbon_footprint_records')
        .select('total_emissions, total_savings, recycling_savings, transport_emissions, calculation_date, disposal_method')
        .eq('organization_id', organizationId)
        .gte('calculation_date', dateRange.from.toISOString().split('T')[0])
        .lte('calculation_date', dateRange.to.toISOString().split('T')[0]);

      // Fetch carbon summary
      const { data: carbonSummary } = await supabase
        .from('carbon_summary')
        .select('total_emissions, total_savings, recycling_rate, total_recycled_tons, total_landfilled_tons, total_waste_tons, net_impact')
        .eq('organization_id', organizationId)
        .order('period_end', { ascending: false })
        .limit(1);

      // Fetch shipments for waste analysis
      const { data: shipments } = await supabase
        .from('shipments')
        .select('waste_type, quantity, status')
        .or(`generator_id.eq.${organizationId},recycler_id.eq.${organizationId}`)
        .gte('created_at', dateRange.from.toISOString())
        .lte('created_at', dateRange.to.toISOString())
        .in('status', ['delivered', 'confirmed']);

      const records = carbonRecords || [];
      const allShipments = shipments || [];
      const summary = carbonSummary?.[0];

      const totalEmissions = records.reduce((s, r) => s + (r.total_emissions || 0), 0);
      const totalSavings = records.reduce((s, r) => s + (r.total_savings || 0), 0);
      const totalRecycled = allShipments.reduce((s, sh) => s + (sh.quantity || 0), 0);
      const recyclingRate = summary?.recycling_rate || (totalRecycled > 0 ? 75 : 0);

      // Waste type distribution
      const wasteMap: Record<string, number> = {};
      allShipments.forEach(s => {
        const t = s.waste_type || 'other';
        wasteMap[t] = (wasteMap[t] || 0) + (s.quantity || 0);
      });
      const wasteLabels: Record<string, string> = {
        plastic: 'بلاستيك', paper: 'ورق', metal: 'معادن', glass: 'زجاج',
        electronic: 'إلكترونيات', organic: 'عضوية', chemical: 'كيميائية',
        medical: 'طبية', construction: 'بناء', other: 'أخرى',
      };
      const wasteDistribution = Object.entries(wasteMap).map(([k, v]) => ({
        name: wasteLabels[k] || k, value: Math.round(v),
      }));

      // Monthly emissions trend
      const months = eachMonthOfInterval({ start: dateRange.from, end: dateRange.to });
      const emissionsTrend = months.map(month => {
        const monthEnd = new Date(month.getFullYear(), month.getMonth() + 1, 0);
        const monthRecords = records.filter(r => {
          const d = new Date(r.calculation_date);
          return d >= month && d <= monthEnd;
        });
        return {
          name: format(month, 'MMM yyyy', { locale: ar }),
          emissions: Math.round(monthRecords.reduce((s, r) => s + (r.total_emissions || 0), 0) * 100) / 100,
          savings: Math.round(monthRecords.reduce((s, r) => s + (r.total_savings || 0), 0) * 100) / 100,
        };
      });

      // Sustainability score (0-100)
      const sustainabilityScore = Math.min(100, Math.round(
        (recyclingRate * 0.4) + 
        (totalSavings > 0 ? 30 : 0) + 
        (totalEmissions < 1000 ? 30 : 15)
      ));

      return {
        totalEmissions: Math.round(totalEmissions * 100) / 100,
        totalSavings: Math.round(totalSavings * 100) / 100,
        totalRecycled: Math.round(totalRecycled),
        recyclingRate: Math.round(recyclingRate),
        netImpact: summary?.net_impact || Math.round((totalEmissions - totalSavings) * 100) / 100,
        sustainabilityScore,
        wasteDistribution,
        emissionsTrend,
      };
    },
    enabled: !!organizationId,
    staleTime: 5 * 60 * 1000,
  });

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="grid gap-4 md:grid-cols-4">
          {[...Array(4)].map((_, i) => <Card key={i}><CardContent className="p-5"><Skeleton className="h-16 w-full" /></CardContent></Card>)}
        </div>
        <Card><CardContent className="p-6"><Skeleton className="h-[350px] w-full" /></CardContent></Card>
      </div>
    );
  }

  if (!data) return null;

  const envCards = [
    { title: 'إجمالي الانبعاثات', value: `${data.totalEmissions} طن CO₂`, icon: Factory, color: 'text-red-600', bg: 'bg-red-100' },
    { title: 'الوفورات البيئية', value: `${data.totalSavings} طن CO₂`, icon: Leaf, color: 'text-emerald-600', bg: 'bg-emerald-100' },
    { title: 'معدل التدوير', value: `${data.recyclingRate}%`, icon: Recycle, color: 'text-blue-600', bg: 'bg-blue-100' },
    { title: 'نقاط الاستدامة', value: `${data.sustainabilityScore}/100`, icon: TreePine, color: 'text-green-600', bg: 'bg-green-100' },
  ];

  const scoreData = [{ name: 'الاستدامة', value: data.sustainabilityScore, fill: data.sustainabilityScore >= 70 ? '#10B981' : data.sustainabilityScore >= 40 ? '#F59E0B' : '#EF4444' }];

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload?.length) {
      return (
        <div className="bg-background border rounded-lg shadow-lg p-3 text-right">
          <p className="font-medium mb-2">{label}</p>
          {payload.map((entry: any, i: number) => (
            <p key={i} className="text-sm" style={{ color: entry.color }}>
              {entry.name}: {entry.value} طن CO₂
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-4">
      {/* Environmental KPI Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {envCards.map((card, i) => (
          <Card key={i}>
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">{card.title}</p>
                  <p className="text-xl font-bold">{card.value}</p>
                </div>
                <div className={cn("p-2.5 rounded-full", card.bg)}>
                  <card.icon className={cn("h-5 w-5", card.color)} />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {/* Emissions Trend */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Factory className="h-5 w-5 text-primary" />
              اتجاه الانبعاثات والوفورات
            </CardTitle>
            <CardDescription>مقارنة شهرية للبصمة الكربونية</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={data.emissionsTrend} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} tickLine={false} />
                <YAxis tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Legend />
                <Area type="monotone" dataKey="emissions" name="الانبعاثات" stroke="#EF4444" fill="#EF4444" fillOpacity={0.15} strokeWidth={2} />
                <Area type="monotone" dataKey="savings" name="الوفورات" stroke="#10B981" fill="#10B981" fillOpacity={0.15} strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Waste Distribution Pie */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Recycle className="h-5 w-5 text-primary" />
              توزيع المخلفات
            </CardTitle>
          </CardHeader>
          <CardContent>
            {data.wasteDistribution.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={data.wasteDistribution}
                    cx="50%" cy="50%"
                    innerRadius={50} outerRadius={90}
                    paddingAngle={3}
                    dataKey="value"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  >
                    {data.wasteDistribution.map((_, i) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-[300px] text-muted-foreground text-sm">
                لا توجد بيانات كافية
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default EnvironmentalChart;
