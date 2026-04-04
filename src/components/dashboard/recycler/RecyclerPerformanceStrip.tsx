import { motion } from 'framer-motion';
import { Recycle, TrendingUp, Zap, Award } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

const RecyclerPerformanceStrip = () => {
  const { organization } = useAuth();

  const { data } = useQuery({
    queryKey: ['recycler-perf-strip', organization?.id],
    queryFn: async () => {
      if (!organization?.id) return null;
      const { data: shipments } = await supabase
        .from('shipments')
        .select('status, quantity')
        .eq('recycler_id', organization.id);
      
      const all = shipments || [];
      const total = all.length;
      const confirmed = all.filter(s => s.status === 'confirmed').length;
      const totalQty = all.reduce((s, r) => s + (r.quantity || 0), 0);
      const rate = total > 0 ? Math.round((confirmed / total) * 100) : 0;

      return { total, confirmed, totalQty: Math.round(totalQty), rate };
    },
    enabled: !!organization?.id,
    staleTime: 1000 * 60 * 3,
  });

  if (!data) return null;

  const stats = [
    { icon: Recycle, label: 'معالَجة', value: data.confirmed, color: 'text-emerald-500' },
    { icon: TrendingUp, label: 'معدل الإنجاز', value: `${data.rate}%`, color: 'text-blue-500' },
    { icon: Zap, label: 'طن تم تدويره', value: data.totalQty, color: 'text-amber-500' },
    { icon: Award, label: 'إجمالي الشحنات', value: data.total, color: 'text-violet-500' },
  ];

  return (
    <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide py-1">
      {stats.map((s, i) => (
        <motion.div
          key={s.label}
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: i * 0.08, type: 'spring' }}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-card border border-border/40 shrink-0"
        >
          <s.icon className={`w-3.5 h-3.5 ${s.color}`} />
          <span className="text-[10px] text-muted-foreground">{s.label}</span>
          <span className="text-xs font-bold">{s.value}</span>
        </motion.div>
      ))}
    </div>
  );
};

export default RecyclerPerformanceStrip;
