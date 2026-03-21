import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import { BarChart3 } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

const COLORS = ['hsl(var(--primary))', 'hsl(142, 76%, 36%)', 'hsl(38, 92%, 50%)', 'hsl(0, 84%, 60%)', 'hsl(262, 83%, 58%)'];

const TransporterPerformanceCharts = () => {
  const { organization } = useAuth();
  const { t } = useLanguage();

  const { data, isLoading } = useQuery({
    queryKey: ['transporter-charts', organization?.id],
    queryFn: async () => {
      // Get last 30 days shipments for richer historical data
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const { data: shipments } = await supabase
        .from('shipments')
        .select('status, waste_type, created_at, total_value, quantity')
        .eq('transporter_id', organization!.id)
        .gte('created_at', thirtyDaysAgo.toISOString())
        .order('created_at', { ascending: true });

      // Weekly shipment counts (last 4 weeks)
      const weeklyMap: Record<string, number> = {};
      for (let i = 3; i >= 0; i--) {
        const weekStart = new Date();
        weekStart.setDate(weekStart.getDate() - (i * 7 + 6));
        const weekEnd = new Date();
        weekEnd.setDate(weekEnd.getDate() - (i * 7));
        const label = `${weekStart.getDate()}/${weekStart.getMonth() + 1}`;
        weeklyMap[label] = 0;
      }

      // Also daily for last 7 days
      const dailyMap: Record<string, number> = {};
      const days = [
        t('transporterCharts.sunday'), t('transporterCharts.monday'), t('transporterCharts.tuesday'),
        t('transporterCharts.wednesday'), t('transporterCharts.thursday'), t('transporterCharts.friday'),
        t('transporterCharts.saturday')
      ];
      for (let i = 6; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const dayName = days[d.getDay()];
        dailyMap[dayName] = 0;
      }
      shipments?.forEach(s => {
        const d = new Date(s.created_at);
        const dayName = days[d.getDay()];
        if (dayName in dailyMap) dailyMap[dayName]++;
      });
      const shipmentKey = t('transporterCharts.shipments');
      const dailyData = Object.entries(dailyMap).map(([name, count]) => ({ name, [shipmentKey]: count }));

      // Status distribution
      const statusMap: Record<string, number> = {};
      shipments?.forEach(s => {
        const label = s.status === 'new' ? t('shipmentStatus.new')
          : s.status === 'approved' ? t('shipmentStatus.accepted')
          : s.status === 'in_transit' ? t('shipmentStatus.in_transit')
          : s.status === 'delivered' ? t('shipmentStatus.delivered')
          : s.status === 'confirmed' ? t('shipmentStatus.confirmed')
          : s.status;
        statusMap[label] = (statusMap[label] || 0) + 1;
      });
      const statusData = Object.entries(statusMap).map(([name, value]) => ({ name, value }));

      // Monthly revenue trend
      const totalRevenue = shipments?.reduce((s, sh) => s + (sh.total_value || 0), 0) || 0;
      const totalQuantity = shipments?.reduce((s, sh) => s + (sh.quantity || 0), 0) || 0;

      return { dailyData, statusData, totalShipments: shipments?.length || 0, totalRevenue, totalQuantity };
    },
    enabled: !!organization?.id,
    refetchInterval: 60_000,
  });

  if (isLoading || !data) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="animate-pulse h-[200px] bg-muted rounded" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <BarChart3 className="w-5 h-5 text-primary" />
          {t('transporterCharts.performanceAnalytics')}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {/* Summary KPIs */}
        <div className="grid grid-cols-3 gap-3 mb-4">
          <div className="p-2 rounded-lg bg-primary/5 border text-center">
            <p className="text-lg font-bold text-primary">{data.totalShipments}</p>
            <p className="text-[10px] text-muted-foreground">{t('transporterCharts.shipments')} (30 يوم)</p>
          </div>
          <div className="p-2 rounded-lg bg-emerald-500/5 border text-center">
            <p className="text-lg font-bold text-emerald-600">{data.totalRevenue.toLocaleString('ar-EG')}</p>
            <p className="text-[10px] text-muted-foreground">إجمالي الإيراد</p>
          </div>
          <div className="p-2 rounded-lg bg-blue-500/5 border text-center">
            <p className="text-lg font-bold text-blue-600">{data.totalQuantity.toLocaleString('ar-EG')}</p>
            <p className="text-[10px] text-muted-foreground">إجمالي الكمية (طن)</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Daily shipments bar chart */}
          <div>
            <p className="text-sm font-medium text-muted-foreground mb-3 text-right">{t('transporterCharts.dailyShipmentsLast7')}</p>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={data.dailyData}>
                <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                <XAxis dataKey="name" fontSize={11} />
                <YAxis fontSize={11} allowDecimals={false} />
                <Tooltip />
                <Bar dataKey={t('transporterCharts.shipments')} fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Status pie chart */}
          <div>
            <p className="text-sm font-medium text-muted-foreground mb-3 text-right">{t('transporterCharts.statusDistribution')}</p>
            {data.statusData.length > 0 ? (
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie data={data.statusData} cx="50%" cy="50%" outerRadius={70} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine={false} fontSize={10}>
                    {data.statusData.map((_, i) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-[200px] text-muted-foreground text-sm">
                {t('transporterCharts.noData')}
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default TransporterPerformanceCharts;
