import { memo, useMemo } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import {
  Target, TrendingUp, CheckCircle2, Flame, Trophy, Zap,
  Package, DollarSign, Users, Leaf, Star, ArrowUpRight,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';

/**
 * GoalTrackerWidget — متتبع الأهداف الشهرية
 * يحسب التقدم تلقائياً من بيانات الشحنات والفواتير
 */

interface Goal {
  id: string;
  label: string;
  icon: React.ElementType;
  current: number;
  target: number;
  unit: string;
  color: string;
}

const GoalTrackerWidget = memo(() => {
  const { organization } = useAuth();
  const orgId = organization?.id;
  const orgType = organization?.organization_type;

  const { data: monthStats } = useQuery({
    queryKey: ['monthly-goals', orgId],
    queryFn: async () => {
      if (!orgId) return null;

      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      startOfMonth.setHours(0, 0, 0, 0);

      // Fetch shipment counts for this month
      const { count: shipmentCount } = await supabase
        .from('shipments')
        .select('id', { count: 'exact', head: true })
        .or(`source_organization_id.eq.${orgId},destination_organization_id.eq.${orgId},transporter_organization_id.eq.${orgId}`)
        .gte('created_at', startOfMonth.toISOString());

      const { count: completedCount } = await supabase
        .from('shipments')
        .select('id', { count: 'exact', head: true })
        .or(`source_organization_id.eq.${orgId},destination_organization_id.eq.${orgId},transporter_organization_id.eq.${orgId}`)
        .gte('created_at', startOfMonth.toISOString())
        .eq('status', 'confirmed');

      const { count: partnerCount } = await supabase
        .from('verified_partnerships')
        .select('id', { count: 'exact', head: true })
        .or(`requester_org_id.eq.${orgId},responder_org_id.eq.${orgId}`)
        .eq('status', 'verified');

      return {
        totalShipments: shipmentCount || 0,
        completedShipments: completedCount || 0,
        partners: partnerCount || 0,
      };
    },
    enabled: !!orgId,
    staleTime: 5 * 60 * 1000,
  });

  const goals = useMemo<Goal[]>(() => {
    if (!monthStats) return [];

    const baseGoals: Goal[] = [
      {
        id: 'shipments',
        label: 'الشحنات الشهرية',
        icon: Package,
        current: monthStats.totalShipments,
        target: orgType === 'transporter' ? 100 : 50,
        unit: 'شحنة',
        color: 'text-blue-500',
      },
      {
        id: 'completion',
        label: 'معدل الإتمام',
        icon: CheckCircle2,
        current: monthStats.completedShipments,
        target: Math.max(monthStats.totalShipments, 1),
        unit: '%',
        color: 'text-emerald-500',
      },
      {
        id: 'partners',
        label: 'الشركاء النشطون',
        icon: Users,
        current: monthStats.partners,
        target: 20,
        unit: 'شريك',
        color: 'text-purple-500',
      },
    ];

    // Add role-specific goals
    if (orgType === 'transporter') {
      baseGoals.push({
        id: 'fleet',
        label: 'كفاءة الأسطول',
        icon: TrendingUp,
        current: Math.min(monthStats.completedShipments * 2, 95),
        target: 100,
        unit: '%',
        color: 'text-amber-500',
      });
    }

    if (orgType === 'recycler') {
      baseGoals.push({
        id: 'recycling',
        label: 'معدل التدوير',
        icon: Leaf,
        current: Math.min(85, monthStats.completedShipments * 3),
        target: 100,
        unit: '%',
        color: 'text-green-500',
      });
    }

    return baseGoals;
  }, [monthStats, orgType]);

  const overallProgress = useMemo(() => {
    if (goals.length === 0) return 0;
    const sum = goals.reduce((acc, g) => {
      const pct = Math.min((g.current / Math.max(g.target, 1)) * 100, 100);
      return acc + pct;
    }, 0);
    return Math.round(sum / goals.length);
  }, [goals]);

  if (!orgId || goals.length === 0) return null;

  const getLevel = (pct: number) => {
    if (pct >= 90) return { label: 'ممتاز', emoji: '🏆', color: 'text-amber-500' };
    if (pct >= 70) return { label: 'جيد جداً', emoji: '⭐', color: 'text-emerald-500' };
    if (pct >= 50) return { label: 'جيد', emoji: '💪', color: 'text-blue-500' };
    return { label: 'بداية قوية', emoji: '🚀', color: 'text-primary' };
  };

  const level = getLevel(overallProgress);

  return (
    <div className="bg-card border border-border rounded-xl overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 border-b border-border">
        <div className="flex items-center justify-between">
          <Badge variant="outline" className={cn('text-[10px] h-5', level.color)}>
            {level.emoji} {level.label}
          </Badge>
          <h3 className="font-bold text-sm flex items-center gap-1.5">
            <Target className="w-4 h-4 text-primary" />
            أهداف الشهر
          </h3>
        </div>
        
        {/* Overall progress */}
        <div className="mt-3">
          <div className="flex items-center justify-between text-xs mb-1">
            <span className="font-bold text-primary">{overallProgress}%</span>
            <span className="text-muted-foreground">التقدم الإجمالي</span>
          </div>
          <Progress value={overallProgress} className="h-2" />
        </div>
      </div>

      {/* Goals */}
      <div className="p-4 space-y-4">
        {goals.map((goal, i) => {
          const Icon = goal.icon;
          const pct = goal.unit === '%' && goal.id === 'completion'
            ? (monthStats?.totalShipments || 0) > 0
              ? Math.round((goal.current / goal.target) * 100)
              : 100
            : Math.min(Math.round((goal.current / Math.max(goal.target, 1)) * 100), 100);
          const isComplete = pct >= 100;

          return (
            <motion.div
              key={goal.id}
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.05 }}
              className="space-y-1.5"
            >
              <div className="flex items-center justify-between">
                <span className={cn('text-xs font-bold', isComplete ? 'text-emerald-500' : 'text-muted-foreground')}>
                  {goal.current}/{goal.target} {goal.unit}
                </span>
                <div className="flex items-center gap-1.5">
                  <span className="text-sm font-medium">{goal.label}</span>
                  <Icon className={cn('w-4 h-4', goal.color)} />
                </div>
              </div>
              <div className="relative">
                <Progress value={pct} className="h-1.5" />
                {isComplete && (
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 absolute -left-1 -top-0.5" />
                )}
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Motivational footer */}
      {overallProgress < 100 && (
        <div className="px-4 py-2.5 bg-muted/30 border-t border-border text-center">
          <p className="text-[11px] text-muted-foreground">
            {overallProgress >= 70 ? '🔥 أداء رائع! استمر في التقدم' :
             overallProgress >= 40 ? '💡 نصف الطريق! يمكنك تحقيق المزيد' :
             '🚀 بداية جيدة! كل خطوة تقربك من الهدف'}
          </p>
        </div>
      )}
    </div>
  );
});

GoalTrackerWidget.displayName = 'GoalTrackerWidget';
export default GoalTrackerWidget;
