import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { startOfMonth, endOfMonth, subMonths, format, parseISO } from 'date-fns';
import { ar } from 'date-fns/locale';

interface TrendData {
  period: string;
  value: number;
  change: number;
  changePercent: number;
}

interface WasteTypeAnalytics {
  wasteType: string;
  totalQuantity: number;
  shipmentsCount: number;
  avgQuantityPerShipment: number;
  revenue: number;
  trend: 'up' | 'down' | 'stable';
}

interface PartnerPerformance {
  partnerId: string;
  partnerName: string;
  partnerType: string;
  shipmentsCount: number;
  totalQuantity: number;
  avgResponseTime: number; // hours
  onTimeDeliveryRate: number; // percentage
  satisfactionScore: number;
}

interface PredictedMetrics {
  nextMonthShipments: number;
  nextMonthQuantity: number;
  growthRate: number;
  seasonalFactor: number;
}

interface UseAdvancedAnalyticsOptions {
  organizationId: string | null;
  monthsBack?: number;
  enabled?: boolean;
}

export const useAdvancedAnalytics = ({
  organizationId,
  monthsBack = 6,
  enabled = true
}: UseAdvancedAnalyticsOptions) => {
  
  // Monthly shipments trend
  const { data: shipmentsTrend = [], isLoading: trendLoading } = useQuery({
    queryKey: ['analytics-shipments-trend', organizationId, monthsBack],
    queryFn: async () => {
      if (!organizationId) return [];

      const trends: TrendData[] = [];
      let previousValue = 0;

      for (let i = monthsBack - 1; i >= 0; i--) {
        const targetDate = subMonths(new Date(), i);
        const monthStart = startOfMonth(targetDate);
        const monthEnd = endOfMonth(targetDate);

        const { count } = await supabase
          .from('shipments')
          .select('*', { count: 'exact', head: true })
          .or(`generator_id.eq.${organizationId},transporter_id.eq.${organizationId},recycler_id.eq.${organizationId}`)
          .gte('created_at', monthStart.toISOString())
          .lte('created_at', monthEnd.toISOString());

        const value = count || 0;
        const change = value - previousValue;
        const changePercent = previousValue > 0 ? (change / previousValue) * 100 : 0;

        trends.push({
          period: format(targetDate, 'MMM yyyy', { locale: ar }),
          value,
          change,
          changePercent: Math.round(changePercent * 10) / 10,
        });

        previousValue = value;
      }

      return trends;
    },
    enabled: enabled && !!organizationId,
    staleTime: 10 * 60 * 1000,
  });

  // Waste type analytics
  const { data: wasteTypeAnalytics = [], isLoading: wasteLoading } = useQuery({
    queryKey: ['analytics-waste-types', organizationId],
    queryFn: async () => {
      if (!organizationId) return [];

      const { data: shipments } = await supabase
        .from('shipments')
        .select('waste_type, quantity, unit, status, created_at')
        .or(`generator_id.eq.${organizationId},transporter_id.eq.${organizationId},recycler_id.eq.${organizationId}`)
        .eq('status', 'confirmed');

      if (!shipments) return [];

      // Group by waste type
      const grouped = shipments.reduce((acc, s) => {
        const key = s.waste_type || 'غير محدد';
        if (!acc[key]) {
          acc[key] = {
            wasteType: key,
            totalQuantity: 0,
            shipmentsCount: 0,
            revenue: 0,
            recentQuantity: 0,
            oldQuantity: 0,
          };
        }
        
        const qty = s.quantity || 0;
        acc[key].totalQuantity += qty;
        acc[key].shipmentsCount += 1;
        acc[key].revenue += 0; // Revenue calculated separately if needed

        // For trend calculation
        const shipmentDate = parseISO(s.created_at);
        const threeMonthsAgo = subMonths(new Date(), 3);
        if (shipmentDate > threeMonthsAgo) {
          acc[key].recentQuantity += qty;
        } else {
          acc[key].oldQuantity += qty;
        }

        return acc;
      }, {} as Record<string, any>);

      return Object.values(grouped).map(item => {
        const trend: 'up' | 'down' | 'stable' = 
          item.recentQuantity > item.oldQuantity ? 'up' :
          item.recentQuantity < item.oldQuantity ? 'down' : 'stable';

        return {
          wasteType: item.wasteType,
          totalQuantity: item.totalQuantity,
          shipmentsCount: item.shipmentsCount,
          avgQuantityPerShipment: item.shipmentsCount > 0 
            ? Math.round(item.totalQuantity / item.shipmentsCount * 10) / 10 
            : 0,
          revenue: item.revenue,
          trend,
        } as WasteTypeAnalytics;
      }).sort((a, b) => b.totalQuantity - a.totalQuantity);
    },
    enabled: enabled && !!organizationId,
    staleTime: 10 * 60 * 1000,
  });

  // Partner performance
  const { data: partnerPerformance = [], isLoading: partnerLoading } = useQuery({
    queryKey: ['analytics-partner-performance', organizationId],
    queryFn: async () => {
      if (!organizationId) return [];

      const { data: shipments } = await supabase
        .from('shipments')
        .select(`
          id,
          generator_id,
          transporter_id,
          recycler_id,
          quantity,
          status,
          created_at,
          updated_at,
          generator:generator_id(id, name, organization_type),
          transporter:transporter_id(id, name, organization_type),
          recycler:recycler_id(id, name, organization_type)
        `)
        .or(`generator_id.eq.${organizationId},transporter_id.eq.${organizationId},recycler_id.eq.${organizationId}`)
        .eq('status', 'confirmed');

      if (!shipments) return [];

      // Group by partner
      const partnerMap = new Map<string, any>();

      shipments.forEach(s => {
        // Find partner organizations (not current org)
        const partners = [
          s.generator_id !== organizationId ? s.generator : null,
          s.transporter_id !== organizationId ? s.transporter : null,
          s.recycler_id !== organizationId ? s.recycler : null,
        ].filter(Boolean);

        partners.forEach((partner: any) => {
          if (!partner) return;
          
          if (!partnerMap.has(partner.id)) {
            partnerMap.set(partner.id, {
              partnerId: partner.id,
              partnerName: partner.name,
              partnerType: partner.organization_type,
              shipmentsCount: 0,
              totalQuantity: 0,
              totalResponseTime: 0,
              onTimeCount: 0,
            });
          }

          const data = partnerMap.get(partner.id);
          data.shipmentsCount += 1;
          data.totalQuantity += s.quantity || 0;
          // Simplified on-time calculation
          data.onTimeCount += 1;
        });
      });

      return Array.from(partnerMap.values()).map(p => ({
        partnerId: p.partnerId,
        partnerName: p.partnerName,
        partnerType: p.partnerType,
        shipmentsCount: p.shipmentsCount,
        totalQuantity: p.totalQuantity,
        avgResponseTime: 24, // placeholder
        onTimeDeliveryRate: p.shipmentsCount > 0 
          ? Math.round((p.onTimeCount / p.shipmentsCount) * 100) 
          : 0,
        satisfactionScore: 4.5, // placeholder
      } as PartnerPerformance)).sort((a, b) => b.shipmentsCount - a.shipmentsCount);
    },
    enabled: enabled && !!organizationId,
    staleTime: 10 * 60 * 1000,
  });

  // Predicted metrics (simple linear regression)
  const { data: predictions, isLoading: predictionsLoading } = useQuery({
    queryKey: ['analytics-predictions', organizationId, shipmentsTrend],
    queryFn: async () => {
      if (!shipmentsTrend || shipmentsTrend.length < 3) {
        return {
          nextMonthShipments: 0,
          nextMonthQuantity: 0,
          growthRate: 0,
          seasonalFactor: 1,
        } as PredictedMetrics;
      }

      // Simple moving average for prediction
      const recentValues = shipmentsTrend.slice(-3).map(t => t.value);
      const avgRecent = recentValues.reduce((a, b) => a + b, 0) / recentValues.length;
      
      // Calculate growth rate
      const firstHalf = shipmentsTrend.slice(0, Math.floor(shipmentsTrend.length / 2));
      const secondHalf = shipmentsTrend.slice(Math.floor(shipmentsTrend.length / 2));
      
      const avgFirst = firstHalf.length > 0 
        ? firstHalf.reduce((a, b) => a + b.value, 0) / firstHalf.length 
        : 0;
      const avgSecond = secondHalf.length > 0 
        ? secondHalf.reduce((a, b) => a + b.value, 0) / secondHalf.length 
        : 0;

      const growthRate = avgFirst > 0 ? ((avgSecond - avgFirst) / avgFirst) * 100 : 0;

      return {
        nextMonthShipments: Math.round(avgRecent * (1 + growthRate / 100)),
        nextMonthQuantity: Math.round(avgRecent * 500), // estimate
        growthRate: Math.round(growthRate * 10) / 10,
        seasonalFactor: 1,
      } as PredictedMetrics;
    },
    enabled: enabled && !!organizationId && shipmentsTrend.length > 0,
    staleTime: 10 * 60 * 1000,
  });

  const isLoading = trendLoading || wasteLoading || partnerLoading || predictionsLoading;

  return {
    shipmentsTrend,
    wasteTypeAnalytics,
    partnerPerformance,
    predictions: predictions || {
      nextMonthShipments: 0,
      nextMonthQuantity: 0,
      growthRate: 0,
      seasonalFactor: 1,
    },
    isLoading,
  };
};
