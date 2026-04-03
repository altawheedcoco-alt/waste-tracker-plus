/**
 * CustomerRetentionAnalysis — تحليل ولاء الشركاء
 */
import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Users, TrendingUp, TrendingDown, UserCheck, UserX, Repeat } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

const MONTHS_AR = ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'];

export default function CustomerRetentionAnalysis() {
  const { organization } = useAuth();
  const orgId = organization?.id;

  const { data, isLoading } = useQuery({
    queryKey: ['customer-retention', orgId],
    queryFn: async () => {
      if (!orgId) return null;

      const now = new Date();
      const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 6, 1);
      const threeMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 3, 1);

      const { data: shipments } = await supabase
        .from('shipments')
        .select('generator_id, recycler_id, transporter_id, created_at, status')
        .eq('transporter_id', orgId)
        .gte('created_at', sixMonthsAgo.toISOString());

      const partnerMap = new Map<string, { first: Date; last: Date; count: number; recent: boolean }>();

      (shipments || []).forEach(s => {
        const partnerIds = [s.generator_id, s.recycler_id].filter(Boolean);
        const date = new Date(s.created_at!);
        partnerIds.forEach(pid => {
          if (!pid || pid === orgId) return;
          const existing = partnerMap.get(pid);
          if (existing) {
            existing.count++;
            if (date < existing.first) existing.first = date;
            if (date > existing.last) existing.last = date;
            if (date >= threeMonthsAgo) existing.recent = true;
          } else {
            partnerMap.set(pid, { first: date, last: date, count: 1, recent: date >= threeMonthsAgo });
          }
        });
      });

      const totalPartners = partnerMap.size;
      let active = 0, returning = 0, churned = 0, newPartners = 0;

      partnerMap.forEach(p => {
        if (p.recent) {
          active++;
          if (p.first < threeMonthsAgo) returning++; else newPartners++;
        } else { churned++; }
      });

      const retentionRate = totalPartners > 0 ? Math.round((active / totalPartners) * 100) : 0;

      const monthlyData: Array<{ month: string; active: number; new: number }> = [];
      for (let i = 5; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0);
        let mActive = 0, mNew = 0;
        partnerMap.forEach(p => {
          if (p.first <= monthEnd && p.last >= d) mActive++;
          if (p.first >= d && p.first <= monthEnd) mNew++;
        });
        monthlyData.push({ month: MONTHS_AR[d.getMonth()], active: mActive, new: mNew });
      }

      return { totalPartners, active, returning, churned, newPartners, retentionRate, monthlyData };
    },
    enabled: !!orgId,
    staleTime: 30 * 60 * 1000,
  });

  const stats = useMemo(() => {
    if (!data) return [];
    return [
      { label: 'نشط', value: data.active, icon: UserCheck, color: 'text-green-500' },
      { label: 'عائد', value: data.returning, icon: Repeat, color: 'text-blue-500' },
      { label: 'جديد', value: data.newPartners, icon: TrendingUp, color: 'text-purple-500' },
      { label: 'غير نشط', value: data.churned, icon: UserX, color: 'text-destructive' },
    ];
  }, [data]);

  return (
    <Card className="border-border">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <CardTitle className="flex items-center gap-2 text-base">
            <Users className="h-5 w-5 text-primary" />
            تحليل ولاء الشركاء
          </CardTitle>
          {data && (
            <Badge variant={data.retentionRate >= 70 ? 'default' : 'destructive'} className="gap-1">
              {data.retentionRate >= 70 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
              احتفاظ: {data.retentionRate}%
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {isLoading ? (
          <div className="h-[200px] bg-muted/20 rounded animate-pulse" />
        ) : (
          <>
            <div className="grid grid-cols-4 gap-2">
              {stats.map(s => (
                <div key={s.label} className="text-center p-2 rounded-lg bg-muted/30">
                  <s.icon className={`h-4 w-4 mx-auto mb-1 ${s.color}`} />
                  <p className="text-lg font-bold">{s.value}</p>
                  <p className="text-[10px] text-muted-foreground">{s.label}</p>
                </div>
              ))}
            </div>
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={data?.monthlyData || []} margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis dataKey="month" tick={{ fontSize: 10 }} className="text-muted-foreground" />
                <YAxis tick={{ fontSize: 10 }} className="text-muted-foreground" />
                <Tooltip contentStyle={{ borderRadius: 8, fontSize: 12, direction: 'rtl' }}
                  formatter={(val: number, name: string) => [val, name === 'active' ? 'نشط' : 'جديد']} />
                <Bar dataKey="active" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                <Bar dataKey="new" fill="hsl(var(--accent))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </>
        )}
      </CardContent>
    </Card>
  );
}
