/**
 * InventoryTurnoverWidget — معدل دوران المخزون
 */
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Package, RotateCcw, ArrowUpDown } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

const MONTHS_AR = ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'];

export default function InventoryTurnoverWidget() {
  const { organization } = useAuth();
  const orgId = organization?.id;

  const { data, isLoading } = useQuery({
    queryKey: ['inventory-turnover', orgId],
    queryFn: async () => {
      if (!orgId) return null;

      const sixMonthsAgo = new Date();
      sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

      const { data: shipments } = await supabase
        .from('shipments')
        .select('actual_weight, created_at, status, waste_type')
        .or(`generator_id.eq.${orgId},recycler_id.eq.${orgId},transporter_id.eq.${orgId}`)
        .gte('created_at', sixMonthsAgo.toISOString());

      const now = new Date();
      const monthlyData: Array<{ month: string; inbound: number; outbound: number; turnover: number }> = [];

      for (let i = 5; i >= 0; i--) {
        const mStart = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const mEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0);

        let inbound = 0;
        let outbound = 0;

        (shipments || []).forEach(s => {
          const d = new Date(s.created_at!);
          if (d >= mStart && d <= mEnd) {
            const weight = s.actual_weight || 0;
            if (s.status === 'delivered') {
              outbound += weight;
            }
            inbound += weight;
          }
        });

        const avgInventory = (inbound + outbound) / 2 || 1;
        const turnover = Math.round((outbound / avgInventory) * 100) / 100;

        monthlyData.push({
          month: MONTHS_AR[mStart.getMonth()],
          inbound: Math.round(inbound / 1000 * 10) / 10,
          outbound: Math.round(outbound / 1000 * 10) / 10,
          turnover,
        });
      }

      const avgTurnover = monthlyData.reduce((s, m) => s + m.turnover, 0) / Math.max(monthlyData.length, 1);
      const totalProcessed = monthlyData.reduce((s, m) => s + m.outbound, 0);

      return { monthlyData, avgTurnover: Math.round(avgTurnover * 100) / 100, totalProcessed: Math.round(totalProcessed * 10) / 10 };
    },
    enabled: !!orgId,
    staleTime: 30 * 60 * 1000,
  });

  return (
    <Card className="border-border">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <CardTitle className="flex items-center gap-2 text-base">
            <Package className="h-5 w-5 text-primary" />
            معدل دوران المخزون
          </CardTitle>
          {data && (
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="gap-1 text-xs">
                <RotateCcw className="h-3 w-3" />
                {data.avgTurnover}x متوسط
              </Badge>
              <Badge variant="secondary" className="text-xs">
                {data.totalProcessed} طن
              </Badge>
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="h-[200px] bg-muted/20 rounded animate-pulse" />
        ) : data?.monthlyData.length ? (
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={data.monthlyData} margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
              <XAxis dataKey="month" tick={{ fontSize: 10 }} className="text-muted-foreground" />
              <YAxis tick={{ fontSize: 10 }} className="text-muted-foreground" />
              <Tooltip contentStyle={{ borderRadius: 8, fontSize: 12, direction: 'rtl' }}
                formatter={(val: number, name: string) => [
                  `${val} ${name === 'turnover' ? 'x' : 'طن'}`,
                  name === 'inbound' ? 'وارد' : name === 'outbound' ? 'صادر' : 'دوران'
                ]} />
              <Line type="monotone" dataKey="inbound" stroke="hsl(var(--primary))" strokeWidth={2} dot={{ r: 3 }} name="inbound" />
              <Line type="monotone" dataKey="outbound" stroke="hsl(142, 76%, 36%)" strokeWidth={2} dot={{ r: 3 }} name="outbound" />
              <Line type="monotone" dataKey="turnover" stroke="hsl(262, 83%, 58%)" strokeWidth={2} strokeDasharray="5 5" dot={{ r: 3 }} name="turnover" />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-[200px] flex items-center justify-center text-sm text-muted-foreground">لا توجد بيانات كافية</div>
        )}
        <div className="flex items-center justify-center gap-6 mt-2 text-[10px] text-muted-foreground">
          <span className="flex items-center gap-1"><div className="w-3 h-0.5 bg-primary rounded" /> وارد</span>
          <span className="flex items-center gap-1"><div className="w-3 h-0.5 rounded" style={{ background: 'hsl(142, 76%, 36%)' }} /> صادر</span>
          <span className="flex items-center gap-1"><div className="w-3 h-0.5 rounded" style={{ background: 'hsl(262, 83%, 58%)', borderTop: '1px dashed' }} /> دوران</span>
        </div>
      </CardContent>
    </Card>
  );
}
