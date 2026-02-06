import { useQuery } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  TrendingUp, 
  TrendingDown, 
  Package, 
  Scale, 
  DollarSign, 
  Users,
  Truck,
  CheckCircle
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';

interface KPICardsProps {
  organizationId: string | null;
  dateRange: {
    from: Date;
    to: Date;
  };
}

interface KPIData {
  totalShipments: number;
  totalQuantity: number;
  totalRevenue: number;
  completionRate: number;
  activePartners: number;
  avgProcessingTime: number;
  shipmentsChange: number;
  quantityChange: number;
  revenueChange: number;
  completionChange: number;
}

const KPICards = ({ organizationId, dateRange }: KPICardsProps) => {
  const { data: kpiData, isLoading } = useQuery({
    queryKey: ['analytics-kpi', organizationId, dateRange.from, dateRange.to],
    queryFn: async (): Promise<KPIData> => {
      if (!organizationId) {
        return {
          totalShipments: 0,
          totalQuantity: 0,
          totalRevenue: 0,
          completionRate: 0,
          activePartners: 0,
          avgProcessingTime: 0,
          shipmentsChange: 0,
          quantityChange: 0,
          revenueChange: 0,
          completionChange: 0,
        };
      }

      // Current period
      const { data: currentShipments } = await supabase
        .from('shipments')
        .select('id, quantity, status, created_at, updated_at')
        .or(`generator_id.eq.${organizationId},transporter_id.eq.${organizationId},recycler_id.eq.${organizationId}`)
        .gte('created_at', dateRange.from.toISOString())
        .lte('created_at', dateRange.to.toISOString());

      // Previous period for comparison
      const periodLength = dateRange.to.getTime() - dateRange.from.getTime();
      const prevFrom = new Date(dateRange.from.getTime() - periodLength);
      const prevTo = dateRange.from;

      const { data: prevShipments } = await supabase
        .from('shipments')
        .select('id, quantity, status')
        .or(`generator_id.eq.${organizationId},transporter_id.eq.${organizationId},recycler_id.eq.${organizationId}`)
        .gte('created_at', prevFrom.toISOString())
        .lte('created_at', prevTo.toISOString());

      // Invoices for revenue
      const { data: invoices } = await supabase
        .from('invoices')
        .select('total_amount')
        .eq('organization_id', organizationId)
        .gte('created_at', dateRange.from.toISOString())
        .lte('created_at', dateRange.to.toISOString());

      const { data: prevInvoices } = await supabase
        .from('invoices')
        .select('total_amount')
        .eq('organization_id', organizationId)
        .gte('created_at', prevFrom.toISOString())
        .lte('created_at', prevTo.toISOString());

      // Count unique partners from shipments
      const { data: partnerShipments } = await supabase
        .from('shipments')
        .select('generator_id, transporter_id, recycler_id')
        .or(`generator_id.eq.${organizationId},transporter_id.eq.${organizationId},recycler_id.eq.${organizationId}`);

      const uniquePartners = new Set<string>();
      (partnerShipments || []).forEach(s => {
        if (s.generator_id && s.generator_id !== organizationId) uniquePartners.add(s.generator_id);
        if (s.transporter_id && s.transporter_id !== organizationId) uniquePartners.add(s.transporter_id);
        if (s.recycler_id && s.recycler_id !== organizationId) uniquePartners.add(s.recycler_id);
      });
      const partnersCount = uniquePartners.size;

      const shipments = currentShipments || [];
      const prevShipmentsList = prevShipments || [];

      const totalShipments = shipments.length;
      const totalQuantity = shipments.reduce((acc, s) => acc + (s.quantity || 0), 0);
      const confirmedShipments = shipments.filter(s => s.status === 'confirmed').length;
      const completionRate = totalShipments > 0 ? (confirmedShipments / totalShipments) * 100 : 0;

      const prevTotal = prevShipmentsList.length;
      const prevQuantity = prevShipmentsList.reduce((acc, s) => acc + (s.quantity || 0), 0);
      const prevConfirmed = prevShipmentsList.filter(s => s.status === 'confirmed').length;
      const prevCompletionRate = prevTotal > 0 ? (prevConfirmed / prevTotal) * 100 : 0;

      const totalRevenue = (invoices || []).reduce((acc, i) => acc + (i.total_amount || 0), 0);
      const prevRevenue = (prevInvoices || []).reduce((acc, i) => acc + (i.total_amount || 0), 0);

      const calculateChange = (current: number, previous: number) => {
        if (previous === 0) return current > 0 ? 100 : 0;
        return ((current - previous) / previous) * 100;
      };

      return {
        totalShipments,
        totalQuantity,
        totalRevenue,
        completionRate: Math.round(completionRate),
        activePartners: partnersCount || 0,
        avgProcessingTime: 24, // placeholder
        shipmentsChange: Math.round(calculateChange(totalShipments, prevTotal)),
        quantityChange: Math.round(calculateChange(totalQuantity, prevQuantity)),
        revenueChange: Math.round(calculateChange(totalRevenue, prevRevenue)),
        completionChange: Math.round(completionRate - prevCompletionRate),
      };
    },
    enabled: !!organizationId,
    staleTime: 5 * 60 * 1000,
  });

  const kpis = [
    {
      title: 'إجمالي الشحنات',
      value: kpiData?.totalShipments || 0,
      change: kpiData?.shipmentsChange || 0,
      icon: Package,
      format: (v: number) => v.toLocaleString('en-US'),
      color: 'text-blue-600',
      bgColor: 'bg-blue-100',
    },
    {
      title: 'إجمالي الكمية',
      value: kpiData?.totalQuantity || 0,
      change: kpiData?.quantityChange || 0,
      icon: Scale,
      format: (v: number) => `${v.toLocaleString('en-US')} كجم`,
      color: 'text-green-600',
      bgColor: 'bg-green-100',
    },
    {
      title: 'الإيرادات',
      value: kpiData?.totalRevenue || 0,
      change: kpiData?.revenueChange || 0,
      icon: DollarSign,
      format: (v: number) => `${v.toLocaleString('en-US')} ج.م`,
      color: 'text-amber-600',
      bgColor: 'bg-amber-100',
    },
    {
      title: 'معدل الإنجاز',
      value: kpiData?.completionRate || 0,
      change: kpiData?.completionChange || 0,
      icon: CheckCircle,
      format: (v: number) => `${v}%`,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100',
    },
  ];

  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i}>
            <CardContent className="p-6">
              <Skeleton className="h-4 w-24 mb-2" />
              <Skeleton className="h-8 w-32 mb-2" />
              <Skeleton className="h-4 w-20" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {kpis.map((kpi, index) => (
        <Card key={index} className="overflow-hidden">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground">
                  {kpi.title}
                </p>
                <p className="text-2xl font-bold">
                  {kpi.format(kpi.value)}
                </p>
              </div>
              <div className={cn("p-3 rounded-full", kpi.bgColor)}>
                <kpi.icon className={cn("h-6 w-6", kpi.color)} />
              </div>
            </div>
            
            <div className="mt-4 flex items-center gap-2">
              {kpi.change >= 0 ? (
                <TrendingUp className="h-4 w-4 text-green-600" />
              ) : (
                <TrendingDown className="h-4 w-4 text-red-600" />
              )}
              <span className={cn(
                "text-sm font-medium",
                kpi.change >= 0 ? "text-green-600" : "text-red-600"
              )}>
                {kpi.change >= 0 ? '+' : ''}{kpi.change}%
              </span>
              <span className="text-sm text-muted-foreground">
                مقارنة بالفترة السابقة
              </span>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default KPICards;
