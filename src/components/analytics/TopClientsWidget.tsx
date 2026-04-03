/**
 * TopClientsWidget — أفضل العملاء
 */
import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Users, Crown } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Skeleton } from '@/components/ui/skeleton';

export default function TopClientsWidget() {
  const { organization } = useAuth();
  const orgId = organization?.id;

  const { data, isLoading } = useQuery({
    queryKey: ['top-clients', orgId],
    enabled: !!orgId,
    queryFn: async () => {
      const { data: shipments } = await supabase
        .from('shipments')
        .select('generator_id, recycler_id, total_value, actual_weight')
        .or(`generator_id.eq.${orgId},recycler_id.eq.${orgId},transporter_id.eq.${orgId}`);

      // Get org names
      const partnerIds = new Set<string>();
      (shipments || []).forEach(s => {
        if (s.generator_id && s.generator_id !== orgId) partnerIds.add(s.generator_id);
        if (s.recycler_id && s.recycler_id !== orgId) partnerIds.add(s.recycler_id);
      });

      const { data: orgs } = await supabase
        .from('organizations')
        .select('id, name')
        .in('id', Array.from(partnerIds).slice(0, 50));

      const orgMap: Record<string, string> = {};
      (orgs || []).forEach(o => { orgMap[o.id] = o.name; });

      // Aggregate
      const clientStats: Record<string, { name: string; revenue: number; weight: number; count: number }> = {};
      (shipments || []).forEach(s => {
        const partnerId = s.generator_id !== orgId ? s.generator_id : s.recycler_id;
        if (!partnerId || partnerId === orgId) return;
        if (!clientStats[partnerId]) {
          clientStats[partnerId] = { name: orgMap[partnerId] || 'جهة', revenue: 0, weight: 0, count: 0 };
        }
        clientStats[partnerId].revenue += Number(s.total_value) || 0;
        clientStats[partnerId].weight += Number(s.actual_weight) || 0;
        clientStats[partnerId].count += 1;
      });

      return Object.values(clientStats).sort((a, b) => b.revenue - a.revenue).slice(0, 5);
    },
  });

  if (isLoading) return <Skeleton className="h-[280px] w-full rounded-xl" />;

  return (
    <Card className="border-border">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-base">
          <Users className="h-5 w-5 text-primary" />
          أفضل العملاء
        </CardTitle>
      </CardHeader>
      <CardContent>
        {!data || data.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">لا توجد بيانات</p>
        ) : (
          <div className="space-y-3">
            {data.map((client, i) => (
              <div key={i} className="flex items-center justify-between p-2 rounded-lg bg-muted/50">
                <div className="flex items-center gap-2">
                  {i === 0 && <Crown className="h-4 w-4 text-yellow-500" />}
                  <span className="text-sm font-medium">{client.name}</span>
                  <Badge variant="secondary" className="text-[10px]">{client.count} شحنة</Badge>
                </div>
                <span className="text-sm font-bold text-primary">{Math.round(client.revenue).toLocaleString('ar-EG')} ج.م</span>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
