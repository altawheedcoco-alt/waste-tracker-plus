/**
 * بطاقات إحصائيات محسّنة — مع مؤشر اتجاه (ارتفاع/انخفاض) ونسبة تغيير
 */
import { motion } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { TrendingUp, TrendingDown, Minus, LucideIcon } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface EnhancedStatCard {
  title: string;
  value: number;
  subtitle: string;
  icon: LucideIcon;
  previousValue?: number;
}

interface Props {
  stats: EnhancedStatCard[];
}

const TrendIndicator = ({ current, previous }: { current: number; previous?: number }) => {
  if (previous === undefined || previous === 0) return null;
  const pct = Math.round(((current - previous) / previous) * 100);
  if (pct === 0) return <Minus className="w-3 h-3 text-muted-foreground" />;
  const isUp = pct > 0;
  return (
    <span className={`flex items-center gap-0.5 text-[10px] font-semibold ${isUp ? 'text-emerald-600' : 'text-destructive'}`}>
      {isUp ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
      {isUp ? '+' : ''}{pct}%
    </span>
  );
};

const AdminStatsGridEnhanced = ({ stats }: Props) => {
  // جلب إحصائيات الأسبوع الماضي للمقارنة
  const { data: prevStats } = useQuery({
    queryKey: ['admin-prev-week-stats'],
    queryFn: async () => {
      const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
      const twoWeeksAgo = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString();

      const [thisWeek, lastWeek] = await Promise.all([
        supabase.from('shipments').select('id', { count: 'exact', head: true }).gte('created_at', weekAgo),
        supabase.from('shipments').select('id', { count: 'exact', head: true }).gte('created_at', twoWeeksAgo).lt('created_at', weekAgo),
      ]);

      return {
        shipmentsThisWeek: thisWeek.count ?? 0,
        shipmentsLastWeek: lastWeek.count ?? 0,
      };
    },
    staleTime: 60_000,
  });

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      {stats.map((stat, index) => (
        <motion.div
          key={stat.title}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.08 }}
        >
          <Card className="hover:shadow-md transition-shadow">
            <CardContent className="p-4">
              <div className="flex items-start justify-between">
                <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                  <stat.icon className="w-4.5 h-4.5 text-primary" />
                </div>
                <div className="text-right flex-1 mr-2">
                  <p className="text-[11px] text-muted-foreground leading-tight">{stat.title}</p>
                  <div className="flex items-center gap-1.5 justify-end mt-0.5">
                    <p className="text-2xl font-bold leading-none">{stat.value.toLocaleString()}</p>
                    {index === 0 && prevStats && (
                      <TrendIndicator current={prevStats.shipmentsThisWeek} previous={prevStats.shipmentsLastWeek} />
                    )}
                  </div>
                  <p className="text-[10px] text-muted-foreground mt-0.5">{stat.subtitle}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      ))}
    </div>
  );
};

export default AdminStatsGridEnhanced;
