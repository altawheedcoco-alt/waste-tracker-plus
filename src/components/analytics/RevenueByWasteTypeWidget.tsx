/**
 * RevenueByWasteTypeWidget — إيرادات حسب نوع المخلفات
 */
import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { DollarSign } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Skeleton } from '@/components/ui/skeleton';

const COLORS = ['hsl(var(--primary))', 'hsl(var(--chart-2))', 'hsl(var(--chart-3))', 'hsl(var(--chart-4))', 'hsl(var(--chart-5))', '#8884d8', '#82ca9d'];

export default function RevenueByWasteTypeWidget() {
  const { organization } = useAuth();
  const orgId = organization?.id;

  const { data: shipments, isLoading } = useQuery({
    queryKey: ['revenue-by-waste', orgId],
    enabled: !!orgId,
    queryFn: async () => {
      const { data } = await supabase
        .from('shipments')
        .select('waste_type, total_value')
        .or(`generator_id.eq.${orgId},recycler_id.eq.${orgId},transporter_id.eq.${orgId}`)
        .not('waste_type', 'is', null);
      return data || [];
    },
  });

  const chartData = useMemo(() => {
    if (!shipments) return [];
    const map: Record<string, number> = {};
    shipments.forEach(s => {
      const type = s.waste_type || 'أخرى';
      map[type] = (map[type] || 0) + (Number(s.total_value) || 0);
    });
    return Object.entries(map)
      .map(([name, value]) => ({ name, value: Math.round(value) }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 7);
  }, [shipments]);

  if (isLoading) return <Skeleton className="h-[280px] w-full rounded-xl" />;

  return (
    <Card className="border-border">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-base">
          <DollarSign className="h-5 w-5 text-primary" />
          إيرادات حسب نوع المخلفات
        </CardTitle>
      </CardHeader>
      <CardContent>
        {chartData.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">لا توجد بيانات</p>
        ) : (
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie data={chartData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                {chartData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Pie>
              <Tooltip formatter={(v: number) => `${v.toLocaleString('ar-EG')} ج.م`} />
            </PieChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}
