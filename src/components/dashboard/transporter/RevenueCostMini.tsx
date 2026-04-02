import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { DollarSign, TrendingUp, TrendingDown, ArrowUpRight } from 'lucide-react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Skeleton } from '@/components/ui/skeleton';

const RevenueCostMini = () => {
  const { organization } = useAuth();
  const navigate = useNavigate();

  const { data, isLoading } = useQuery({
    queryKey: ['revenue-cost-mini', organization?.id],
    queryFn: async () => {
      const orgId = organization!.id;
      const now = new Date();
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

      const { data: ledger } = await supabase
        .from('accounting_ledger')
        .select('entry_type, amount, entry_category')
        .eq('organization_id', orgId)
        .gte('entry_date', monthStart.toISOString())
        .limit(500);

      const entries = ledger || [];
      let revenue = 0;
      let costs = 0;

      entries.forEach(e => {
        if (e.entry_type === 'credit' || e.entry_type === 'income') {
          revenue += Math.abs(Number(e.amount) || 0);
        } else {
          costs += Math.abs(Number(e.amount) || 0);
        }
      });

      const profit = revenue - costs;
      const margin = revenue > 0 ? Math.round((profit / revenue) * 100) : 0;

      return { revenue, costs, profit, margin };
    },
    enabled: !!organization?.id,
    staleTime: 300000,
  });

  if (isLoading) {
    return <Skeleton className="h-24 w-full rounded-xl" />;
  }

  if (!data) return null;

  const fmt = (n: number) => {
    if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M`;
    if (n >= 1000) return `${(n / 1000).toFixed(1)}K`;
    return n.toLocaleString('ar-EG');
  };

  return (
    <Card
      className="border-border/50 shadow-sm cursor-pointer hover:shadow-md transition-shadow"
      onClick={() => navigate('/dashboard/e-invoice')}
    >
      <CardContent className="p-3 sm:p-4">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-amber-500/10">
              <DollarSign className="w-4 h-4 text-amber-600" />
            </div>
            <h3 className="text-sm font-semibold">ملخص الشهر المالي</h3>
          </div>
          <ArrowUpRight className="w-4 h-4 text-muted-foreground" />
        </div>

        <div className="grid grid-cols-3 gap-2">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center p-2 rounded-lg bg-emerald-500/10"
          >
            <TrendingUp className="w-3.5 h-3.5 text-emerald-600 mx-auto mb-0.5" />
            <div className="text-sm font-bold text-emerald-700">{fmt(data.revenue)}</div>
            <div className="text-[9px] text-muted-foreground">إيرادات</div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.05 }}
            className="text-center p-2 rounded-lg bg-red-500/10"
          >
            <TrendingDown className="w-3.5 h-3.5 text-red-600 mx-auto mb-0.5" />
            <div className="text-sm font-bold text-red-700">{fmt(data.costs)}</div>
            <div className="text-[9px] text-muted-foreground">مصروفات</div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.1 }}
            className={`text-center p-2 rounded-lg ${data.profit >= 0 ? 'bg-primary/10' : 'bg-red-500/10'}`}
          >
            <Badge variant="outline" className="text-[9px] mb-0.5">
              {data.margin}%
            </Badge>
            <div className={`text-sm font-bold ${data.profit >= 0 ? 'text-primary' : 'text-red-600'}`}>
              {fmt(Math.abs(data.profit))}
            </div>
            <div className="text-[9px] text-muted-foreground">
              {data.profit >= 0 ? 'صافي ربح' : 'صافي خسارة'}
            </div>
          </motion.div>
        </div>
      </CardContent>
    </Card>
  );
};

export default RevenueCostMini;
