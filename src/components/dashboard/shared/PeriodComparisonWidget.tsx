import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, TrendingDown, Minus, ArrowUpRight, ArrowDownRight, BarChart3 } from 'lucide-react';
import { motion } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface PeriodComparisonWidgetProps {
  role: 'generator' | 'recycler';
}

const PeriodComparisonWidget = ({ role }: PeriodComparisonWidgetProps) => {
  const { organization } = useAuth();

  const { data } = useQuery({
    queryKey: ['period-comparison', organization?.id, role],
    queryFn: async () => {
      if (!organization?.id) return null;
      const now = new Date();
      const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
      const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString();
      const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0).toISOString();

      const field = role === 'generator' ? 'generator_id' : 'recycler_id';

      const [thisMonth, lastMonth] = await Promise.all([
        supabase.from('shipments').select('id, quantity, status').eq(field, organization.id).gte('created_at', thisMonthStart),
        supabase.from('shipments').select('id, quantity, status').eq(field, organization.id).gte('created_at', lastMonthStart).lte('created_at', lastMonthEnd),
      ]);

      const thisData = thisMonth.data || [];
      const lastData = lastMonth.data || [];

      return {
        thisMonth: {
          count: thisData.length,
          quantity: thisData.reduce((s, r) => s + (r.quantity || 0), 0),
          completed: thisData.filter(r => ['delivered', 'confirmed'].includes(r.status)).length,
        },
        lastMonth: {
          count: lastData.length,
          quantity: lastData.reduce((s, r) => s + (r.quantity || 0), 0),
          completed: lastData.filter(r => ['delivered', 'confirmed'].includes(r.status)).length,
        },
      };
    },
    enabled: !!organization?.id,
    staleTime: 1000 * 60 * 5,
  });

  const metrics = useMemo(() => {
    if (!data) return [];
    const calc = (curr: number, prev: number) => {
      if (prev === 0) return curr > 0 ? 100 : 0;
      return Math.round(((curr - prev) / prev) * 100);
    };
    return [
      { label: 'عدد الشحنات', current: data.thisMonth.count, previous: data.lastMonth.count, change: calc(data.thisMonth.count, data.lastMonth.count) },
      { label: 'الكمية (طن)', current: Math.round(data.thisMonth.quantity), previous: Math.round(data.lastMonth.quantity), change: calc(data.thisMonth.quantity, data.lastMonth.quantity) },
      { label: 'المكتملة', current: data.thisMonth.completed, previous: data.lastMonth.completed, change: calc(data.thisMonth.completed, data.lastMonth.completed) },
    ];
  }, [data]);

  if (!data) return null;

  return (
    <Card className="border-border/50 overflow-hidden">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center justify-between text-sm">
          <Badge variant="outline" className="text-[10px]">مقارنة شهرية</Badge>
          <div className="flex items-center gap-1.5">
            <BarChart3 className="w-4 h-4 text-primary" />
            <span>أداء هذا الشهر vs الشهر السابق</span>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="grid grid-cols-3 gap-3">
          {metrics.map((m, i) => (
            <motion.div
              key={m.label}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="text-center p-3 rounded-xl bg-muted/30 border border-border/30"
            >
              <p className="text-[10px] text-muted-foreground mb-1">{m.label}</p>
              <motion.p
                className="text-lg font-bold"
                initial={{ scale: 0.5 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', delay: i * 0.1 + 0.2 }}
              >
                {m.current}
              </motion.p>
              <div className={`flex items-center justify-center gap-0.5 text-[10px] mt-1 ${
                m.change > 0 ? 'text-emerald-500' : m.change < 0 ? 'text-red-500' : 'text-muted-foreground'
              }`}>
                {m.change > 0 ? <ArrowUpRight className="w-3 h-3" /> : m.change < 0 ? <ArrowDownRight className="w-3 h-3" /> : <Minus className="w-3 h-3" />}
                <span>{Math.abs(m.change)}%</span>
              </div>
              <p className="text-[9px] text-muted-foreground mt-0.5">السابق: {m.previous}</p>
            </motion.div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default PeriodComparisonWidget;
