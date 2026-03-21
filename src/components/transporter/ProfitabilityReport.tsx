import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DollarSign, TrendingUp, TrendingDown, Users, MapPin, BarChart3 } from 'lucide-react';

interface ShipmentRevenue {
  id: string;
  generator_id: string | null;
  recycler_id: string | null;
  pickup_location: string | null;
  delivery_location: string | null;
  total_cost: number | null;
  status: string;
  created_at: string;
}

interface ClientProfitability {
  clientId: string;
  clientName: string;
  totalShipments: number;
  totalRevenue: number;
  avgRevenuePerShipment: number;
}

interface RouteProfitability {
  route: string;
  totalShipments: number;
  totalRevenue: number;
  avgRevenue: number;
}

const ProfitabilityReport = () => {
  const { organization } = useAuth();
  const { language } = useLanguage();
  const isAr = language === 'ar';

  const [viewMode, setViewMode] = useState<'client' | 'route'>('client');

  const { data: fetchedData, isLoading: loading } = useQuery({
    queryKey: ['profitability-report', organization?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from('shipments')
        .select('id, generator_id, recycler_id, pickup_location, delivery_location, total_value, status, created_at')
        .eq('transporter_id', organization!.id)
        .in('status', ['delivered', 'confirmed'])
        .order('created_at', { ascending: false })
        .limit(500);

      const shipments = (data || []) as any[];
      const orgIds = [...new Set([
        ...shipments.map(d => d.generator_id).filter(Boolean),
        ...shipments.map(d => d.recycler_id).filter(Boolean),
      ])];
      
      let orgNames = new Map<string, string>();
      if (orgIds.length > 0) {
        const { data: orgs } = await supabase
          .from('organizations')
          .select('id, name')
          .in('id', orgIds);
        orgNames = new Map((orgs || []).map(o => [o.id, o.name]));
      }
      return { shipments, orgNames };
    },
    enabled: !!organization?.id,
    refetchInterval: 60_000,
  });

  const shipments = fetchedData?.shipments || [];
  const orgNames = fetchedData?.orgNames || new Map<string, string>();

  const clientData = useMemo((): ClientProfitability[] => {
    const map = new Map<string, { count: number; revenue: number }>();
    shipments.forEach(s => {
      const clientId = s.generator_id || 'unknown';
      const existing = map.get(clientId) || { count: 0, revenue: 0 };
      existing.count++;
      existing.revenue += s.total_cost || 0;
      map.set(clientId, existing);
    });
    return Array.from(map.entries())
      .map(([clientId, data]) => ({
        clientId,
        clientName: orgNames.get(clientId) || clientId.slice(0, 8),
        totalShipments: data.count,
        totalRevenue: data.revenue,
        avgRevenuePerShipment: data.count > 0 ? data.revenue / data.count : 0,
      }))
      .sort((a, b) => b.totalRevenue - a.totalRevenue);
  }, [shipments, orgNames]);

  const routeData = useMemo((): RouteProfitability[] => {
    const map = new Map<string, { count: number; revenue: number }>();
    shipments.forEach(s => {
      const from = s.pickup_location?.split(',')[0]?.trim() || '?';
      const to = s.delivery_location?.split(',')[0]?.trim() || '?';
      const route = `${from} → ${to}`;
      const existing = map.get(route) || { count: 0, revenue: 0 };
      existing.count++;
      existing.revenue += s.total_cost || 0;
      map.set(route, existing);
    });
    return Array.from(map.entries())
      .map(([route, data]) => ({
        route,
        totalShipments: data.count,
        totalRevenue: data.revenue,
        avgRevenue: data.count > 0 ? data.revenue / data.count : 0,
      }))
      .sort((a, b) => b.totalRevenue - a.totalRevenue)
      .slice(0, 15);
  }, [shipments]);

  const totalRevenue = shipments.reduce((s, sh) => s + (sh.total_cost || 0), 0);
  const topClient = clientData[0];

  const formatCurrency = (amount: number) =>
    `${amount.toLocaleString(isAr ? 'ar-EG' : 'en')} ${isAr ? 'ج.م' : 'EGP'}`;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <BarChart3 className="w-5 h-5 text-primary" />
          {isAr ? 'تقارير الربحية' : 'Profitability Reports'}
        </CardTitle>
        <Select value={viewMode} onValueChange={(v) => setViewMode(v as any)}>
          <SelectTrigger className="w-[140px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="client">
              <span className="flex items-center gap-1"><Users className="w-3 h-3" /> {isAr ? 'حسب العميل' : 'By Client'}</span>
            </SelectItem>
            <SelectItem value="route">
              <span className="flex items-center gap-1"><MapPin className="w-3 h-3" /> {isAr ? 'حسب المسار' : 'By Route'}</span>
            </SelectItem>
          </SelectContent>
        </Select>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Summary */}
        <div className="grid grid-cols-3 gap-3">
          <div className="p-3 rounded-lg bg-emerald-500/5 border text-center">
            <DollarSign className="w-6 h-6 mx-auto mb-1 text-emerald-600" />
            <p className="text-lg font-bold text-emerald-600">{formatCurrency(totalRevenue)}</p>
            <p className="text-[10px] text-muted-foreground">{isAr ? 'إجمالي الإيرادات' : 'Total Revenue'}</p>
          </div>
          <div className="p-3 rounded-lg bg-blue-500/5 border text-center">
            <TrendingUp className="w-6 h-6 mx-auto mb-1 text-blue-600" />
            <p className="text-lg font-bold text-blue-600">{shipments.length}</p>
            <p className="text-[10px] text-muted-foreground">{isAr ? 'شحنات مكتملة' : 'Completed'}</p>
          </div>
          <div className="p-3 rounded-lg bg-amber-500/5 border text-center">
            <Users className="w-6 h-6 mx-auto mb-1 text-amber-600" />
            <p className="text-lg font-bold text-amber-600">{topClient?.clientName || '-'}</p>
            <p className="text-[10px] text-muted-foreground">{isAr ? 'أكبر عميل' : 'Top Client'}</p>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-8 text-muted-foreground">{isAr ? 'جاري التحميل...' : 'Loading...'}</div>
        ) : viewMode === 'client' ? (
          <div className="space-y-2">
            {clientData.map((c, idx) => {
              const percentage = totalRevenue > 0 ? (c.totalRevenue / totalRevenue) * 100 : 0;
              return (
                <div key={c.clientId} className="flex items-center gap-3 p-3 rounded-lg border hover:bg-accent/50 transition-colors">
                  <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary">
                    {idx + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm truncate">{c.clientName}</p>
                    <p className="text-[10px] text-muted-foreground">
                      {c.totalShipments} {isAr ? 'شحنة' : 'shipments'} · {isAr ? 'متوسط' : 'avg'}: {formatCurrency(c.avgRevenuePerShipment)}
                    </p>
                  </div>
                  <div className="text-left">
                    <p className="font-bold text-sm text-emerald-600">{formatCurrency(c.totalRevenue)}</p>
                    <Badge variant="outline" className="text-[10px]">{percentage.toFixed(1)}%</Badge>
                  </div>
                </div>
              );
            })}
            {clientData.length === 0 && (
              <p className="text-center py-8 text-muted-foreground">
                {isAr ? 'لا توجد بيانات ربحية بعد' : 'No profitability data yet'}
              </p>
            )}
          </div>
        ) : (
          <div className="space-y-2">
            {routeData.map((r, idx) => (
              <div key={r.route} className="flex items-center gap-3 p-3 rounded-lg border hover:bg-accent/50 transition-colors">
                <div className="w-7 h-7 rounded-full bg-blue-500/10 flex items-center justify-center text-xs font-bold text-blue-600">
                  {idx + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm truncate">{r.route}</p>
                  <p className="text-[10px] text-muted-foreground">
                    {r.totalShipments} {isAr ? 'رحلة' : 'trips'} · {isAr ? 'متوسط' : 'avg'}: {formatCurrency(r.avgRevenue)}
                  </p>
                </div>
                <p className="font-bold text-sm text-emerald-600">{formatCurrency(r.totalRevenue)}</p>
              </div>
            ))}
            {routeData.length === 0 && (
              <p className="text-center py-8 text-muted-foreground">
                {isAr ? 'لا توجد بيانات مسارات بعد' : 'No route data yet'}
              </p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ProfitabilityReport;
