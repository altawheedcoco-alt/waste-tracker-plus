/**
 * TransporterFuelTracker — تتبع استهلاك الوقود الشهري
 * ملخص سريع لاستهلاك الوقود + التكلفة + متوسط اللتر/رحلة
 */
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent } from '@/components/ui/card';
import { Fuel, TrendingDown, TrendingUp, ChevronLeft } from 'lucide-react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';

const TransporterFuelTracker = () => {
  const { organization } = useAuth();
  const navigate = useNavigate();

  const { data, isLoading } = useQuery({
    queryKey: ['fuel-tracker-mini', organization?.id],
    queryFn: async () => {
      const now = new Date();
      const monthAgo = new Date(now);
      monthAgo.setDate(monthAgo.getDate() - 30);
      const prevMonthStart = new Date(monthAgo);
      prevMonthStart.setDate(prevMonthStart.getDate() - 30);

      const [currentR, prevR] = await Promise.all([
        supabase.from('fuel_records')
          .select('liters, total_cost')
          .eq('organization_id', organization!.id)
          .gte('fuel_date', monthAgo.toISOString()),
        supabase.from('fuel_records')
          .select('liters, total_cost')
          .eq('organization_id', organization!.id)
          .gte('fuel_date', prevMonthStart.toISOString())
          .lt('fuel_date', monthAgo.toISOString()),
      ]);

      const current = currentR.data || [];
      const prev = prevR.data || [];

      const totalLiters = current.reduce((s, r) => s + (r.liters || 0), 0);
      const totalCost = current.reduce((s, r) => s + (r.total_cost || 0), 0);
      const prevCost = prev.reduce((s, r) => s + (r.total_cost || 0), 0);
      const avgPerLiter = totalLiters > 0 ? totalCost / totalLiters : 0;
      const costChange = prevCost > 0 ? Math.round(((totalCost - prevCost) / prevCost) * 100) : 0;

      return { totalLiters, totalCost, avgPerLiter, costChange, recordCount: current.length };
    },
    enabled: !!organization?.id,
    staleTime: 5 * 60 * 1000,
  });

  if (isLoading || !data) {
    return (
      <Card className="border border-border/40 bg-card/80">
        <CardContent className="p-3">
          <div className="animate-pulse space-y-2">
            <div className="h-4 bg-muted rounded w-1/2 mr-auto" />
            <div className="h-8 bg-muted/50 rounded" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
      <Card className="border border-border/40 bg-card/80 backdrop-blur-sm overflow-hidden">
        <CardContent className="p-3 sm:p-4">
          <div className="flex items-center justify-between mb-3">
            <button
              onClick={() => navigate('/dashboard/fuel-management')}
              className="text-[10px] text-primary hover:underline flex items-center gap-0.5"
            >
              التفاصيل <ChevronLeft className="w-3 h-3" />
            </button>
            <h3 className="text-xs font-bold text-foreground flex items-center gap-1.5">
              الوقود (٣٠ يوم)
              <Fuel className="w-4 h-4 text-primary" />
            </h3>
          </div>

          <div className="grid grid-cols-3 gap-2">
            <div className="text-center p-2 rounded-lg bg-muted/20 border border-border/20">
              <p className="text-lg font-black text-foreground tabular-nums">
                {data.totalLiters.toLocaleString('ar-SA')}
              </p>
              <p className="text-[9px] text-muted-foreground">لتر</p>
            </div>
            <div className="text-center p-2 rounded-lg bg-muted/20 border border-border/20">
              <p className="text-lg font-black text-foreground tabular-nums">
                {Math.round(data.totalCost).toLocaleString('ar-SA')}
              </p>
              <p className="text-[9px] text-muted-foreground">ج.م تكلفة</p>
            </div>
            <div className="text-center p-2 rounded-lg bg-muted/20 border border-border/20">
              <div className="flex items-center justify-center gap-1">
                <p className={`text-lg font-black tabular-nums ${
                  data.costChange > 0 ? 'text-destructive' : data.costChange < 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-foreground'
                }`}>
                  {data.costChange > 0 ? '+' : ''}{data.costChange}%
                </p>
                {data.costChange > 0 ? (
                  <TrendingUp className="w-3 h-3 text-destructive" />
                ) : data.costChange < 0 ? (
                  <TrendingDown className="w-3 h-3 text-emerald-500" />
                ) : null}
              </div>
              <p className="text-[9px] text-muted-foreground">مقارنة بالشهر السابق</p>
            </div>
          </div>

          <div className="mt-2 flex items-center justify-between text-[10px] text-muted-foreground px-1">
            <span>{data.recordCount} عملية تعبئة</span>
            <span>متوسط: {data.avgPerLiter.toFixed(2)} ج.م/لتر</span>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default TransporterFuelTracker;
