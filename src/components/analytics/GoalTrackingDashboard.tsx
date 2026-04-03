/**
 * GoalTrackingDashboard — لوحة تتبع الأهداف
 * تعرض الأهداف الشهرية/السنوية مع نسبة التقدم
 */
import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Target, TrendingUp, Truck, Recycle, DollarSign, Leaf, CheckCircle2, Clock } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface Goal {
  id: string;
  label: string;
  icon: typeof Target;
  target: number;
  current: number;
  unit: string;
  color: string;
  deadline: string;
}

export default function GoalTrackingDashboard() {
  const { organization } = useAuth();
  const orgId = organization?.id;

  const { data: goals, isLoading } = useQuery({
    queryKey: ['goal-tracking', orgId],
    queryFn: async (): Promise<Goal[]> => {
      if (!orgId) return [];

      const now = new Date();
      const yearStart = new Date(now.getFullYear(), 0, 1).toISOString();
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

      const [yearShipments, monthShipments] = await Promise.all([
        supabase.from('shipments')
          .select('id, quantity, unit, status', { count: 'exact' })
          .or(`generator_id.eq.${orgId},transporter_id.eq.${orgId},recycler_id.eq.${orgId},disposal_facility_id.eq.${orgId}`)
          .gte('created_at', yearStart),
        supabase.from('shipments')
          .select('id, quantity, unit, status', { count: 'exact' })
          .or(`generator_id.eq.${orgId},transporter_id.eq.${orgId},recycler_id.eq.${orgId},disposal_facility_id.eq.${orgId}`)
          .gte('created_at', monthStart),
      ]);

      const yearData = yearShipments.data || [];
      const monthData = monthShipments.data || [];
      const yearCount = yearShipments.count || 0;
      const monthCount = monthShipments.count || 0;

      const yearTons = yearData.reduce((s, sh) => s + (sh.unit === 'kg' ? (sh.quantity || 0) / 1000 : (sh.quantity || 0)), 0);
      const monthCompleted = monthData.filter(s => ['delivered', 'confirmed'].includes(s.status)).length;

      const monthsElapsed = now.getMonth() + 1;
      const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
      const dayOfMonth = now.getDate();

      return [
        {
          id: 'yearly-shipments', label: 'شحنات سنوية', icon: Truck,
          target: Math.max(yearCount * (12 / monthsElapsed) * 1.2, 100),
          current: yearCount, unit: 'شحنة',
          color: 'hsl(var(--primary))',
          deadline: `31 ديسمبر ${now.getFullYear()}`,
        },
        {
          id: 'monthly-completion', label: 'إنجاز شهري', icon: CheckCircle2,
          target: monthCount || 10,
          current: monthCompleted, unit: 'شحنة مكتملة',
          color: '#22c55e',
          deadline: `${daysInMonth - dayOfMonth} يوم متبقي`,
        },
        {
          id: 'tonnage-goal', label: 'هدف الحمولة السنوي', icon: Recycle,
          target: Math.max(Math.round(yearTons * (12 / monthsElapsed) * 1.15), 50),
          current: Math.round(yearTons * 10) / 10, unit: 'طن',
          color: '#8b5cf6',
          deadline: `31 ديسمبر ${now.getFullYear()}`,
        },
        {
          id: 'co2-goal', label: 'وفورات كربونية', icon: Leaf,
          target: Math.max(Math.round(yearTons * 0.8 * (12 / monthsElapsed) * 1.2), 20),
          current: Math.round(yearTons * 0.8 * 10) / 10, unit: 'طن CO₂',
          color: '#10b981',
          deadline: `${now.getFullYear()}`,
        },
      ];
    },
    enabled: !!orgId,
    staleTime: 10 * 60 * 1000,
  });

  if (isLoading) {
    return (
      <Card className="border-border">
        <CardContent className="p-6">
          <div className="space-y-4">{Array(4).fill(0).map((_, i) => <div key={i} className="h-16 bg-muted/30 rounded animate-pulse" />)}</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-border">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Target className="h-5 w-5 text-primary" />
          تتبع الأهداف
          <Badge variant="secondary" className="text-[10px] mr-auto">{goals?.length || 0} أهداف</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {(goals || []).map(goal => {
            const Icon = goal.icon;
            const pct = goal.target > 0 ? Math.min(Math.round((goal.current / goal.target) * 100), 100) : 0;
            const isComplete = pct >= 100;
            return (
              <div key={goal.id} className="p-4 rounded-xl border border-border bg-card hover:shadow-sm transition-shadow">
                <div className="flex items-center gap-3 mb-3">
                  <div className="p-2 rounded-lg" style={{ backgroundColor: `${goal.color}15` }}>
                    <Icon className="h-4 w-4" style={{ color: goal.color }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">{goal.label}</p>
                    <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      {goal.deadline}
                    </div>
                  </div>
                  <Badge
                    variant="outline"
                    className={`text-xs ${isComplete ? 'text-emerald-600 border-emerald-200 bg-emerald-50 dark:bg-emerald-950/30' : 'text-muted-foreground'}`}
                  >
                    {pct}%
                  </Badge>
                </div>
                <Progress value={pct} className="h-2 mb-2" />
                <div className="flex justify-between text-[11px] text-muted-foreground">
                  <span>{goal.current} {goal.unit}</span>
                  <span>الهدف: {Math.round(goal.target)} {goal.unit}</span>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
