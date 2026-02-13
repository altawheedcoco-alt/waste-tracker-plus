import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, TrendingDown, DollarSign, BarChart3, ArrowUpDown } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

interface PartnerProfit {
  partnerId: string;
  partnerName: string;
  partnerType: 'generator' | 'recycler';
  shipmentCount: number;
  totalRevenue: number;
  totalCost: number;
  profit: number;
  profitMargin: number;
}

const PartnerProfitabilityPanel = () => {
  const { organization } = useAuth();
  const orgId = organization?.id;

  const { data: profitData = [], isLoading } = useQuery({
    queryKey: ['partner-profitability', orgId],
    queryFn: async () => {
      if (!orgId) return [];

      // Fetch shipments with financial data
      const { data: shipments, error } = await supabase
        .from('shipments')
        .select('id, generator_id, recycler_id, status, quantity, unit')
        .eq('transporter_id', orgId)
        .in('status', ['delivered', 'confirmed'])
        .order('created_at', { ascending: false })
        .limit(500);

      if (error) throw error;
      if (!shipments?.length) return [];

      // Fetch ledger entries for revenue/cost
      const { data: ledger } = await supabase
        .from('accounting_ledger')
        .select('amount, entry_type, partner_organization_id, shipment_id')
        .eq('organization_id', orgId)
        .not('partner_organization_id', 'is', null);

      // Aggregate by partner
      const partnerMap = new Map<string, {
        type: 'generator' | 'recycler';
        shipmentCount: number;
        revenue: number;
        cost: number;
      }>();

      // Count shipments per partner
      for (const s of shipments) {
        if (s.generator_id && s.generator_id !== orgId) {
          const existing = partnerMap.get(s.generator_id) || { type: 'generator' as const, shipmentCount: 0, revenue: 0, cost: 0 };
          existing.shipmentCount++;
          partnerMap.set(s.generator_id, existing);
        }
        if (s.recycler_id && s.recycler_id !== orgId) {
          const existing = partnerMap.get(s.recycler_id) || { type: 'recycler' as const, shipmentCount: 0, revenue: 0, cost: 0 };
          existing.shipmentCount++;
          partnerMap.set(s.recycler_id, existing);
        }
      }

      // Aggregate financials from ledger
      for (const entry of (ledger || [])) {
        if (!entry.partner_organization_id) continue;
        const existing = partnerMap.get(entry.partner_organization_id);
        if (!existing) continue;
        if (entry.entry_type === 'credit') {
          existing.revenue += entry.amount;
        } else {
          existing.cost += entry.amount;
        }
      }

      // Fetch partner names
      const partnerIds = Array.from(partnerMap.keys());
      if (partnerIds.length === 0) return [];

      const { data: orgs } = await supabase
        .from('organizations')
        .select('id, name')
        .in('id', partnerIds);

      const nameMap = new Map((orgs || []).map(o => [o.id, o.name]));

      const results: PartnerProfit[] = Array.from(partnerMap.entries()).map(([id, data]) => {
        const profit = data.revenue - data.cost;
        return {
          partnerId: id,
          partnerName: nameMap.get(id) || 'غير معروف',
          partnerType: data.type,
          shipmentCount: data.shipmentCount,
          totalRevenue: data.revenue,
          totalCost: data.cost,
          profit,
          profitMargin: data.revenue > 0 ? Math.round((profit / data.revenue) * 100) : 0,
        };
      });

      // Sort by profit descending
      return results.sort((a, b) => b.profit - a.profit);
    },
    enabled: !!orgId,
    staleTime: 60_000,
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader><CardTitle>تحليل ربحية الشركاء</CardTitle></CardHeader>
        <CardContent><Skeleton className="h-32 w-full" /></CardContent>
      </Card>
    );
  }

  if (profitData.length === 0) return null;

  const totalProfit = profitData.reduce((sum, p) => sum + p.profit, 0);
  const topPartner = profitData[0];

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="text-left">
            <span className={cn('text-lg font-bold', totalProfit >= 0 ? 'text-emerald-600' : 'text-red-600')}>
              {totalProfit.toLocaleString('ar-EG')} ج.م
            </span>
            <p className="text-xs text-muted-foreground">إجمالي الربح</p>
          </div>
          <CardTitle className="flex items-center gap-2 text-sm sm:text-base">
            <BarChart3 className="w-5 h-5 text-primary" />
            تحليل ربحية الشركاء
          </CardTitle>
        </div>
        <CardDescription className="text-right">تحليل الإيرادات والتكاليف لكل شريك</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {profitData.slice(0, 6).map((partner) => (
            <div
              key={partner.partnerId}
              className="flex items-center justify-between p-2.5 rounded-lg border bg-card hover:bg-muted/50 transition-colors"
            >
              <div className="flex items-center gap-3 text-left">
                <div className={cn(
                  'flex items-center gap-1 text-sm font-semibold min-w-[80px]',
                  partner.profit >= 0 ? 'text-emerald-600' : 'text-red-600'
                )}>
                  {partner.profit >= 0 ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
                  {partner.profit.toLocaleString('ar-SA')}
                </div>
                {partner.profitMargin !== 0 && (
                  <Badge variant="outline" className={cn(
                    'text-[10px]',
                    partner.profitMargin >= 20 ? 'border-emerald-300 text-emerald-700' :
                    partner.profitMargin >= 0 ? 'border-amber-300 text-amber-700' : 'border-red-300 text-red-700'
                  )}>
                    {partner.profitMargin}%
                  </Badge>
                )}
              </div>
              <div className="text-right flex-1">
                <div className="flex items-center gap-2 justify-end">
                  <Badge variant="secondary" className="text-[10px]">
                    {partner.partnerType === 'generator' ? 'مولد' : 'مدوّر'}
                  </Badge>
                  <span className="font-medium text-sm">{partner.partnerName}</span>
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {partner.shipmentCount} شحنة • إيراد: {partner.totalRevenue.toLocaleString('ar-SA')} • تكلفة: {partner.totalCost.toLocaleString('ar-SA')}
                </p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default PartnerProfitabilityPanel;
