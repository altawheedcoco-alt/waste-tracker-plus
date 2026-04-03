/**
 * ودجة ملخص أرباح السائق — خاص بالسائقين
 * يعرض ملخص الأرباح والرحلات المكتملة
 */
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Wallet, TrendingUp, Package, Star, Route } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

const DriverEarningsSummary = () => {
  const { profile } = useAuth();

  const { data: earnings } = useQuery({
    queryKey: ['driver-earnings-summary', profile?.id],
    queryFn: async () => {
      if (!profile?.id) return null;
      
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
      const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

      const { data: shipments } = await supabase
        .from('shipments')
        .select('status, created_at, actual_weight, quantity')
        .eq('driver_id', profile.id)
        .gte('created_at', thirtyDaysAgo)
        .limit(200);

      if (!shipments?.length) return null;

      const total = shipments.length;
      const completed = shipments.filter((s: any) => ['delivered', 'confirmed'].includes(s.status)).length;
      const thisWeek = shipments.filter((s: any) => s.created_at >= sevenDaysAgo).length;
      const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;
      const totalWeight = shipments.reduce((a, s: any) => a + (Number(s.actual_weight || s.quantity) || 0), 0);

      return {
        totalTrips: total,
        completedTrips: completed,
        thisWeekTrips: thisWeek,
        completionRate,
        totalWeight: Math.round(totalWeight),
        avgPerDay: Math.round(total / 30),
      };
    },
    enabled: !!profile?.id,
    staleTime: 1000 * 60 * 5,
  });

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm flex items-center gap-2">
          <Wallet className="h-4 w-4 text-primary" />
          ملخص الأداء
          {earnings && (
            <Badge 
              variant="outline" 
              className={`text-[9px] mr-auto border-0 ${earnings.completionRate >= 90 ? 'bg-green-500/10 text-green-700 dark:text-green-300' : 'bg-amber-500/10 text-amber-700 dark:text-amber-300'}`}
            >
              {earnings.completionRate}% إتمام
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {!earnings ? (
          <div className="text-center py-4">
            <Route className="h-8 w-8 text-muted-foreground/40 mx-auto mb-2" />
            <p className="text-xs text-muted-foreground">لا توجد رحلات بعد</p>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-2 text-center">
              <div className="p-2 rounded-lg bg-primary/5">
                <Package className="h-3.5 w-3.5 text-primary mx-auto mb-1" />
                <div className="text-lg font-bold">{earnings.totalTrips}</div>
                <p className="text-[9px] text-muted-foreground">رحلة (30 يوم)</p>
              </div>
              <div className="p-2 rounded-lg bg-green-500/10">
                <TrendingUp className="h-3.5 w-3.5 text-green-500 mx-auto mb-1" />
                <div className="text-lg font-bold text-green-700 dark:text-green-300">{earnings.completedTrips}</div>
                <p className="text-[9px] text-muted-foreground">مكتملة</p>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="p-1.5 rounded bg-muted/20">
                <div className="text-xs font-bold">{earnings.thisWeekTrips}</div>
                <p className="text-[8px] text-muted-foreground">هذا الأسبوع</p>
              </div>
              <div className="p-1.5 rounded bg-muted/20">
                <div className="text-xs font-bold">{earnings.avgPerDay}</div>
                <p className="text-[8px] text-muted-foreground">متوسط/يوم</p>
              </div>
              <div className="p-1.5 rounded bg-muted/20">
                <div className="text-xs font-bold">{earnings.totalWeight.toLocaleString('ar-EG')}</div>
                <p className="text-[8px] text-muted-foreground">كجم نُقلت</p>
              </div>
            </div>

            <div className="flex items-center gap-2 p-2 rounded-lg bg-primary/5">
              <Star className="h-4 w-4 text-primary" />
              <span className="text-[10px] text-muted-foreground">
                معدل الإتمام {earnings.completionRate}% — {earnings.completionRate >= 90 ? 'ممتاز!' : 'يمكن تحسينه'}
              </span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default DriverEarningsSummary;
