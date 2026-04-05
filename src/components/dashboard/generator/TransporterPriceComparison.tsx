/**
 * مقارنة أسعار الناقلين - يعرض مقارنة تلقائية بأسعار الشركاء
 */
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendingDown, Star, Truck, ArrowUpDown } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';

const TransporterPriceComparison = () => {
  const { organization } = useAuth();
  const [sortBy, setSortBy] = useState<'price' | 'count'>('price');

  const { data: shipments = [] } = useQuery({
    queryKey: ['generator-transporter-prices', organization?.id],
    queryFn: async () => {
      if (!organization?.id) return [];
      const { data } = await supabase
        .from('shipments')
        .select('transporter_id, quantity, waste_type')
        .eq('generator_id', organization.id)
        .in('status', ['delivered', 'confirmed']);
      return data || [];
    },
    enabled: !!organization?.id,
  });

  const { data: ledger = [] } = useQuery({
    queryKey: ['generator-transporter-costs', organization?.id],
    queryFn: async () => {
      if (!organization?.id) return [];
      const { data } = await supabase
        .from('accounting_ledger')
        .select('partner_organization_id, amount, shipment_id')
        .eq('organization_id', organization.id)
        .eq('entry_type', 'debit');
      return data || [];
    },
    enabled: !!organization?.id,
  });

  const { data: orgs = [] } = useQuery({
    queryKey: ['generator-partner-orgs', organization?.id],
    queryFn: async () => {
      const ids = [...new Set(shipments.map(s => s.transporter_id).filter(Boolean))];
      if (ids.length === 0) return [];
      const { data } = await supabase.from('organizations').select('id, name, city').in('id', ids);
      return data || [];
    },
    enabled: shipments.length > 0,
  });

  const comparison = useMemo(() => {
    const transporterMap: Record<string, { name: string; city: string; totalCost: number; totalQty: number; shipmentCount: number }> = {};

    for (const s of shipments) {
      if (!s.transporter_id) continue;
      if (!transporterMap[s.transporter_id]) {
        const org = orgs.find(o => o.id === s.transporter_id);
        transporterMap[s.transporter_id] = {
          name: org?.name || 'غير معروف',
          city: org?.city || '',
          totalCost: 0,
          totalQty: 0,
          shipmentCount: 0,
        };
      }
      transporterMap[s.transporter_id].totalQty += s.quantity || 0;
      transporterMap[s.transporter_id].shipmentCount += 1;
    }

    for (const l of ledger) {
      if (l.partner_organization_id && transporterMap[l.partner_organization_id]) {
        transporterMap[l.partner_organization_id].totalCost += Math.abs(l.amount || 0);
      }
    }

    return Object.values(transporterMap)
      .map(t => ({ ...t, avgPerKg: t.totalQty > 0 ? t.totalCost / t.totalQty : 0 }))
      .sort((a, b) => sortBy === 'price' ? a.avgPerKg - b.avgPerKg : b.shipmentCount - a.shipmentCount);
  }, [shipments, ledger, orgs, sortBy]);

  const cheapest = comparison[0]?.avgPerKg || 0;

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <Button variant="ghost" size="sm" onClick={() => setSortBy(s => s === 'price' ? 'count' : 'price')}>
            <ArrowUpDown className="h-4 w-4 ml-1" />
            {sortBy === 'price' ? 'بالسعر' : 'بالعدد'}
          </Button>
          <CardTitle className="text-sm flex items-center gap-2">
            <TrendingDown className="h-4 w-4 text-primary" />
            مقارنة أسعار الناقلين
          </CardTitle>
        </div>
      </CardHeader>
      <CardContent className="space-y-2" dir="rtl">
        {comparison.length === 0 ? (
          <p className="text-center text-muted-foreground text-sm py-4">لا توجد بيانات كافية للمقارنة</p>
        ) : (
          comparison.slice(0, 5).map((t, i) => (
            <div key={i} className="flex items-center justify-between p-2 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors">
              <div className="flex items-center gap-2">
                {i === 0 && cheapest > 0 && <Star className="h-4 w-4 text-amber-500" />}
                <Badge variant={i === 0 ? 'default' : 'secondary'} className="text-xs">
                  {t.avgPerKg > 0 ? `${t.avgPerKg.toFixed(2)} ج.م/كجم` : 'بدون تكلفة'}
                </Badge>
                <span className="text-xs text-muted-foreground">{t.shipmentCount} شحنة</span>
              </div>
              <div className="text-right">
                <span className="text-sm font-medium">{t.name}</span>
                {t.city && <span className="text-xs text-muted-foreground mr-1">({t.city})</span>}
              </div>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
};

export default TransporterPriceComparison;
