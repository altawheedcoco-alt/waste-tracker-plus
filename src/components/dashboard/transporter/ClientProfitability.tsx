/**
 * تحليل ربحية كل عميل (مولد) - فكرة #62
 */
import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, TrendingDown, DollarSign, Building2 } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Skeleton } from '@/components/ui/skeleton';
import { ScrollArea } from '@/components/ui/scroll-area';

export default function ClientProfitability() {
  const { organization } = useAuth();
  const orgId = organization?.id;

  const { data: ledger, isLoading } = useQuery({
    queryKey: ['client-profitability', orgId],
    enabled: !!orgId,
    queryFn: async () => {
      const { data } = await supabase
        .from('accounting_ledger')
        .select('amount, entry_type, partner_organization_id, entry_category')
        .eq('organization_id', orgId!)
        .not('partner_organization_id', 'is', null)
        .order('created_at', { ascending: false })
        .limit(500);
      return (data || []) as any[];
    },
  });

  const { data: partners } = useQuery({
    queryKey: ['client-names', orgId],
    enabled: !!orgId,
    queryFn: async () => {
      const { data } = await supabase
        .from('organizations')
        .select('id, name')
        .limit(200);
      return (data || []) as any[];
    },
  });

  const profitByClient = useMemo(() => {
    const map = new Map<string, { revenue: number; cost: number; count: number }>();

    (ledger || []).forEach((entry: any) => {
      const pid = entry.partner_organization_id!;
      if (!pid) return;
      if (!map.has(pid)) map.set(pid, { revenue: 0, cost: 0, count: 0 });
      const rec = map.get(pid)!;
      rec.count++;
      if (entry.entry_type === 'credit') rec.revenue += Number(entry.amount);
      else rec.cost += Number(entry.amount);
    });

    const partnerNames = new Map<string, string>();
    (partners || []).forEach((p: any) => {
      if (p.name) partnerNames.set(p.id, p.name);
    });

    return Array.from(map.entries())
      .map(([id, data]) => ({
        id,
        name: partnerNames.get(id) || 'عميل',
        revenue: data.revenue,
        cost: data.cost,
        profit: data.revenue - data.cost,
        count: data.count,
        margin: data.revenue > 0 ? ((data.revenue - data.cost) / data.revenue) * 100 : 0,
      }))
      .sort((a, b) => b.profit - a.profit)
      .slice(0, 8);
  }, [ledger, partners]);

  if (isLoading) return <Skeleton className="h-[280px] w-full rounded-xl" />;

  return (
    <Card className="border-border">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-base">
          <DollarSign className="h-5 w-5 text-primary" />
          ربحية العملاء
        </CardTitle>
      </CardHeader>
      <CardContent>
        {profitByClient.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-6">لا توجد بيانات مالية كافية</p>
        ) : (
          <ScrollArea className="h-[200px]">
            <div className="space-y-2 pr-2">
              {profitByClient.map(client => (
                <div key={client.id} className="flex items-center justify-between p-2 rounded-lg border border-border">
                  <div className="flex items-center gap-2 min-w-0">
                    <Building2 className="h-4 w-4 text-muted-foreground shrink-0" />
                    <div className="min-w-0">
                      <p className="text-xs font-medium truncate">{client.name}</p>
                      <p className="text-[10px] text-muted-foreground">{client.count} عملية</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {client.profit >= 0 ? (
                      <TrendingUp className="h-3.5 w-3.5 text-emerald-500" />
                    ) : (
                      <TrendingDown className="h-3.5 w-3.5 text-destructive" />
                    )}
                    <Badge
                      variant={client.profit >= 0 ? 'default' : 'destructive'}
                      className="text-[10px]"
                    >
                      {client.profit >= 0 ? '+' : ''}{client.profit.toLocaleString('ar-EG')} ج.م
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
}