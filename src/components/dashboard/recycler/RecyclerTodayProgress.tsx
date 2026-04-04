import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Package, CheckCircle2, Clock, Truck } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { motion } from 'framer-motion';

const RecyclerTodayProgress = () => {
  const { organization } = useAuth();

  const { data } = useQuery({
    queryKey: ['recycler-today', organization?.id],
    queryFn: async () => {
      if (!organization?.id) return null;
      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);

      const { data: shipments } = await supabase
        .from('shipments')
        .select('status')
        .eq('recycler_id', organization.id)
        .gte('created_at', todayStart.toISOString());

      const all = shipments || [];
      return {
        total: all.length,
        incoming: all.filter(s => ['new', 'approved', 'in_transit'].includes(s.status)).length,
        processing: all.filter(s => s.status === 'delivered').length,
        done: all.filter(s => s.status === 'confirmed').length,
      };
    },
    enabled: !!organization?.id,
    staleTime: 1000 * 60 * 2,
  });

  if (!data || data.total === 0) return null;

  const progress = data.total > 0 ? Math.round((data.done / data.total) * 100) : 0;

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
      <Card className="border-border/40 bg-gradient-to-l from-emerald-500/5 to-transparent">
        <CardContent className="p-3">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] text-muted-foreground">{progress}% مكتمل</span>
            <span className="text-xs font-bold">تقدم اليوم</span>
          </div>
          <Progress value={progress} className="h-1.5 mb-3" />
          <div className="grid grid-cols-3 gap-2 text-center">
            {[
              { icon: Truck, label: 'واردة', value: data.incoming, color: 'text-amber-500' },
              { icon: Clock, label: 'قيد المعالجة', value: data.processing, color: 'text-violet-500' },
              { icon: CheckCircle2, label: 'مكتملة', value: data.done, color: 'text-emerald-500' },
            ].map((s, i) => (
              <motion.div
                key={s.label}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2 + i * 0.1 }}
                className="flex flex-col items-center gap-0.5"
              >
                <s.icon className={`w-3.5 h-3.5 ${s.color}`} />
                <span className="text-sm font-bold">{s.value}</span>
                <span className="text-[9px] text-muted-foreground">{s.label}</span>
              </motion.div>
            ))}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default RecyclerTodayProgress;
