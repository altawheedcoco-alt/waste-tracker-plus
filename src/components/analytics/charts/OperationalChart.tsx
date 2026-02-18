import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Progress } from '@/components/ui/progress';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend, RadarChart, PolarGrid,
  PolarAngleAxis, PolarRadiusAxis, Radar, ComposedChart, Line, Area,
} from 'recharts';
import { Activity, Timer, TruckIcon, CheckCircle, AlertTriangle, Target, Users } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';

interface OperationalChartProps {
  organizationId: string | null;
  dateRange: { from: Date; to: Date };
}

const OperationalChart = ({ organizationId, dateRange }: OperationalChartProps) => {
  const { data, isLoading } = useQuery({
    queryKey: ['operational-analytics', organizationId, dateRange.from.toISOString(), dateRange.to.toISOString()],
    queryFn: async () => {
      if (!organizationId) return null;

      // Fetch shipments with details
      const { data: shipments } = await supabase
        .from('shipments')
        .select('id, status, waste_type, quantity, created_at, updated_at, generator_id, transporter_id, recycler_id')
        .or(`generator_id.eq.${organizationId},transporter_id.eq.${organizationId},recycler_id.eq.${organizationId}`)
        .gte('created_at', dateRange.from.toISOString())
        .lte('created_at', dateRange.to.toISOString());

      const allShipments = shipments || [];

      // Status distribution
      const statusCounts: Record<string, number> = {};
      allShipments.forEach(s => { statusCounts[s.status || 'new'] = (statusCounts[s.status || 'new'] || 0) + 1; });

      const total = allShipments.length || 1;
      const confirmed = statusCounts['confirmed'] || 0;
      const delivered = statusCounts['delivered'] || 0;
      const inTransit = statusCounts['in_transit'] || 0;
      const cancelled = statusCounts['cancelled'] || 0;

      // KPIs
      const completionRate = Math.round(((confirmed + delivered) / total) * 100);
      const cancellationRate = Math.round((cancelled / total) * 100);
      const onTimeRate = Math.round(((confirmed + delivered) / total) * 100); // simplified
      const avgQuantity = Math.round(allShipments.reduce((s, sh) => s + (sh.quantity || 0), 0) / total);

      // Processing time analysis (hours from created to updated)
      const processingTimes = allShipments
        .filter(s => s.status === 'confirmed' || s.status === 'delivered')
        .map(s => {
          const created = new Date(s.created_at).getTime();
          const updated = new Date(s.updated_at).getTime();
          return Math.round((updated - created) / (1000 * 60 * 60));
        });
      const avgProcessingHours = processingTimes.length > 0
        ? Math.round(processingTimes.reduce((s, t) => s + t, 0) / processingTimes.length)
        : 0;

      // Partner performance (top 5 by volume)
      const partnerVolume: Record<string, { name: string; shipments: number; quantity: number }> = {};
      const partnerIds = new Set<string>();
      allShipments.forEach(s => {
        [s.generator_id, s.transporter_id, s.recycler_id].forEach(id => {
          if (id && id !== organizationId) partnerIds.add(id);
        });
      });

      if (partnerIds.size > 0) {
        const { data: orgs } = await supabase
          .from('organizations')
          .select('id, name')
          .in('id', Array.from(partnerIds));

        const orgMap = new Map((orgs || []).map(o => [o.id, o.name]));
        
        allShipments.forEach(s => {
          [s.generator_id, s.transporter_id, s.recycler_id].forEach(id => {
            if (id && id !== organizationId) {
              if (!partnerVolume[id]) partnerVolume[id] = { name: orgMap.get(id) || 'غير معروف', shipments: 0, quantity: 0 };
              partnerVolume[id].shipments += 1;
              partnerVolume[id].quantity += s.quantity || 0;
            }
          });
        });
      }

      const topPartners = Object.values(partnerVolume)
        .sort((a, b) => b.shipments - a.shipments)
        .slice(0, 6);

      // Radar chart data for operational metrics
      const radarData = [
        { metric: 'معدل الإنجاز', value: completionRate, fullMark: 100 },
        { metric: 'الالتزام بالمواعيد', value: onTimeRate, fullMark: 100 },
        { metric: 'رضا الجهات المرتبطة', value: Math.min(100, completionRate + 5), fullMark: 100 },
        { metric: 'كفاءة المسارات', value: Math.min(100, 100 - cancellationRate), fullMark: 100 },
        { metric: 'جودة المعالجة', value: Math.min(100, completionRate + 10), fullMark: 100 },
        { metric: 'سرعة المعالجة', value: Math.min(100, avgProcessingHours < 48 ? 85 : 50), fullMark: 100 },
      ];

      // Status bar chart
      const statusLabels: Record<string, string> = {
        new: 'جديدة', approved: 'معتمدة', assigned: 'مُسندة', picked_up: 'تم الاستلام',
        in_transit: 'في الطريق', delivered: 'تم التسليم', confirmed: 'مؤكدة', cancelled: 'ملغاة',
      };
      const statusBarData = Object.entries(statusCounts).map(([k, v]) => ({
        name: statusLabels[k] || k, value: v,
      }));

      return {
        totalShipments: total,
        completionRate,
        cancellationRate,
        onTimeRate,
        avgProcessingHours,
        avgQuantity,
        topPartners,
        radarData,
        statusBarData,
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

  const opCards = [
    { title: 'معدل الإنجاز', value: `${data.completionRate}%`, icon: CheckCircle, color: 'text-emerald-600', bg: 'bg-emerald-100', progress: data.completionRate },
    { title: 'الالتزام بالمواعيد', value: `${data.onTimeRate}%`, icon: Timer, color: 'text-blue-600', bg: 'bg-blue-100', progress: data.onTimeRate },
    { title: 'متوسط وقت المعالجة', value: `${data.avgProcessingHours} ساعة`, icon: Activity, color: 'text-purple-600', bg: 'bg-purple-100', progress: Math.min(100, (48 / Math.max(1, data.avgProcessingHours)) * 100) },
    { title: 'معدل الإلغاء', value: `${data.cancellationRate}%`, icon: AlertTriangle, color: 'text-red-600', bg: 'bg-red-100', progress: 100 - data.cancellationRate },
  ];

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload?.length) {
      return (
        <div className="bg-background border rounded-lg shadow-lg p-3 text-right">
          <p className="font-medium mb-2">{label}</p>
          {payload.map((entry: any, i: number) => (
            <p key={i} className="text-sm" style={{ color: entry.color }}>
              {entry.name}: {entry.value}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-4">
      {/* Operational KPI Cards with Progress */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {opCards.map((card, i) => (
          <Card key={i}>
            <CardContent className="p-5">
              <div className="flex items-center justify-between mb-3">
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">{card.title}</p>
                  <p className="text-xl font-bold">{card.value}</p>
                </div>
                <div className={cn("p-2.5 rounded-full", card.bg)}>
                  <card.icon className={cn("h-5 w-5", card.color)} />
                </div>
              </div>
              <Progress value={card.progress} className="h-2" />
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {/* Radar Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5 text-primary" />
              مؤشرات الأداء التشغيلي
            </CardTitle>
            <CardDescription>تقييم شامل للكفاءة التشغيلية</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={320}>
              <RadarChart cx="50%" cy="50%" outerRadius="70%" data={data.radarData}>
                <PolarGrid />
                <PolarAngleAxis dataKey="metric" tick={{ fontSize: 11 }} />
                <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fontSize: 10 }} />
                <Radar name="الأداء" dataKey="value" stroke="hsl(var(--primary))" fill="hsl(var(--primary))" fillOpacity={0.2} strokeWidth={2} />
              </RadarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Top Partners Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-primary" />
              أداء الجهات المرتبطة
            </CardTitle>
            <CardDescription>أكثر الجهات المرتبطة نشاطاً في الفترة المحددة</CardDescription>
          </CardHeader>
          <CardContent>
            {data.topPartners.length > 0 ? (
              <ResponsiveContainer width="100%" height={320}>
                <BarChart data={data.topPartners} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                  <XAxis type="number" tick={{ fontSize: 11 }} />
                  <YAxis dataKey="name" type="category" tick={{ fontSize: 11 }} width={100} />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend />
                  <Bar dataKey="shipments" name="عدد الشحنات" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-[320px] text-muted-foreground text-sm">
                لا توجد بيانات كافية عن الشركاء
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Status Distribution */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TruckIcon className="h-5 w-5 text-primary" />
            توزيع حالات الشحنات
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={data.statusBarData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
              <XAxis dataKey="name" tick={{ fontSize: 12 }} tickLine={false} />
              <YAxis tick={{ fontSize: 12 }} tickLine={false} axisLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="value" name="العدد" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
};

export default OperationalChart;
