import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import { BarChart3 } from 'lucide-react';

const COLORS = ['hsl(var(--primary))', 'hsl(142, 76%, 36%)', 'hsl(38, 92%, 50%)', 'hsl(0, 84%, 60%)', 'hsl(262, 83%, 58%)'];

const TransporterPerformanceCharts = () => {
  const { organization } = useAuth();

  const { data, isLoading } = useQuery({
    queryKey: ['transporter-charts', organization?.id],
    queryFn: async () => {
      // Get last 7 days shipments
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

      const { data: shipments } = await supabase
        .from('shipments')
        .select('status, waste_type, created_at')
        .eq('transporter_id', organization!.id)
        .gte('created_at', sevenDaysAgo.toISOString());

      // Daily shipment counts
      const dailyMap: Record<string, number> = {};
      const days = ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];
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
      const dailyData = Object.entries(dailyMap).map(([name, count]) => ({ name, شحنات: count }));

      // Status distribution
      const statusMap: Record<string, number> = {};
      shipments?.forEach(s => {
        const label = s.status === 'new' ? 'جديدة'
          : s.status === 'approved' ? 'مقبولة'
          : s.status === 'in_transit' ? 'قيد النقل'
          : s.status === 'delivered' ? 'مسلّمة'
          : s.status === 'confirmed' ? 'مؤكدة'
          : s.status;
        statusMap[label] = (statusMap[label] || 0) + 1;
      });
      const statusData = Object.entries(statusMap).map(([name, value]) => ({ name, value }));

      return { dailyData, statusData };
    },
    enabled: !!organization?.id,
    refetchInterval: 120000,
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
          تحليلات الأداء
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Daily shipments bar chart */}
          <div>
            <p className="text-sm font-medium text-muted-foreground mb-3 text-right">الشحنات اليومية (آخر 7 أيام)</p>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={data.dailyData}>
                <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                <XAxis dataKey="name" fontSize={11} />
                <YAxis fontSize={11} allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="شحنات" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Status pie chart */}
          <div>
            <p className="text-sm font-medium text-muted-foreground mb-3 text-right">توزيع الحالات</p>
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
                لا توجد بيانات
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default TransporterPerformanceCharts;
