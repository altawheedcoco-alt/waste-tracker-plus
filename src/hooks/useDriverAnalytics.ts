/**
 * Hook لجلب بيانات تحليلات أداء السائق
 */
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface DriverAnalytics {
  // ملخص عام
  totalTrips: number;
  completedTrips: number;
  cancelledTrips: number;
  completionRate: number;
  // أرباح
  totalEarnings: number;
  avgEarningPerTrip: number;
  // أداء
  avgRating: number;
  totalRatings: number;
  // اتجاهات شهرية
  monthlyTrends: { month: string; trips: number; earnings: number }[];
  // توزيع أنواع النفايات
  wasteTypeBreakdown: { type: string; count: number }[];
  // أوقات الذروة
  peakHours: { hour: number; count: number }[];
}

export function useDriverAnalytics(driverId: string | undefined) {
  return useQuery({
    queryKey: ['driver-analytics', driverId],
    enabled: !!driverId,
    staleTime: 5 * 60 * 1000,
    queryFn: async (): Promise<DriverAnalytics> => {
      // Fetch shipments assigned to this driver
      const { data: shipments, error } = await supabase
        .from('shipments')
        .select('id, status, created_at, actual_weight, price_per_unit, waste_type')
        .eq('driver_id', driverId!)
        .order('created_at', { ascending: false })
        .limit(500);

      if (error) throw error;
      const items = shipments || [];

      const completed = items.filter(s => s.status === 'delivered' || s.status === 'confirmed');
      const cancelled = items.filter(s => s.status === 'cancelled');

      // Monthly trends (last 6 months)
      const now = new Date();
      const monthlyMap = new Map<string, { trips: number; earnings: number }>();
      for (let i = 5; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
        monthlyMap.set(key, { trips: 0, earnings: 0 });
      }

      completed.forEach(s => {
        const d = new Date(s.created_at);
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
        const entry = monthlyMap.get(key);
        if (entry) {
          entry.trips++;
          entry.earnings += (s.actual_weight || 0) * (s.price_per_ton || 0);
        }
      });

      const monthlyTrends = Array.from(monthlyMap.entries()).map(([month, data]) => ({
        month,
        ...data,
      }));

      // Waste type breakdown
      const wasteMap = new Map<string, number>();
      items.forEach(s => {
        const type = s.waste_type || 'غير محدد';
        wasteMap.set(type, (wasteMap.get(type) || 0) + 1);
      });
      const wasteTypeBreakdown = Array.from(wasteMap.entries())
        .map(([type, count]) => ({ type, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 6);

      // Peak hours
      const hourMap = new Map<number, number>();
      items.forEach(s => {
        const h = new Date(s.created_at).getHours();
        hourMap.set(h, (hourMap.get(h) || 0) + 1);
      });
      const peakHours = Array.from(hourMap.entries())
        .map(([hour, count]) => ({ hour, count }))
        .sort((a, b) => a.hour - b.hour);

      // Ratings
      const { data: ratings } = await supabase
        .from('driver_ratings')
        .select('overall_rating')
        .eq('driver_id', driverId!)
        .eq('rating_direction', 'org_to_driver');

      const ratingList = ratings || [];
      const avgRating = ratingList.length
        ? ratingList.reduce((sum, r) => sum + r.overall_rating, 0) / ratingList.length
        : 0;

      const totalEarnings = completed.reduce(
        (sum, s) => sum + (s.actual_weight || 0) * (s.price_per_ton || 0), 0
      );

      return {
        totalTrips: items.length,
        completedTrips: completed.length,
        cancelledTrips: cancelled.length,
        completionRate: items.length ? completed.length / items.length : 0,
        totalEarnings,
        avgEarningPerTrip: completed.length ? totalEarnings / completed.length : 0,
        avgRating: Math.round(avgRating * 10) / 10,
        totalRatings: ratingList.length,
        monthlyTrends,
        wasteTypeBreakdown,
        peakHours,
      };
    },
  });
}
