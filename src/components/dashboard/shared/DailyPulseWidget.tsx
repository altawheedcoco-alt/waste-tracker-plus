/**
 * DailyPulseWidget — ملخص يومي ذكي
 * يعرض نبض اليوم مع المؤشرات الحية والأحداث المهمة
 */
import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  Sun, Moon, CloudSun, Zap, Truck, CheckCircle2,
  Clock, TrendingUp, AlertTriangle, Activity
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { translateWasteType } from '@/lib/shipmentStatusConfig';

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return { text: 'صباح الخير', icon: Sun, emoji: '☀️' };
  if (h < 17) return { text: 'مساء الخير', icon: CloudSun, emoji: '🌤️' };
  return { text: 'مساء الخير', icon: Moon, emoji: '🌙' };
}

interface DayStats {
  todayShipments: number;
  todayCompleted: number;
  todayPending: number;
  todayTons: number;
  yesterdayShipments: number;
  streak: number;
  topWasteType: string;
}

export default function DailyPulseWidget() {
  const { organization, user } = useAuth();
  const orgId = organization?.id;
  const greeting = getGreeting();
  const GIcon = greeting.icon;

  const { data: stats } = useQuery({
    queryKey: ['daily-pulse', orgId],
    queryFn: async (): Promise<DayStats> => {
      if (!orgId) throw new Error('No org');

      const now = new Date();
      const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
      const yesterdayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1).toISOString();

      const [todayRes, yesterdayRes, pendingRes] = await Promise.all([
        supabase.from('shipments')
          .select('id, status, quantity, unit, waste_type')
          .or(`generator_id.eq.${orgId},transporter_id.eq.${orgId},recycler_id.eq.${orgId},disposal_facility_id.eq.${orgId}`)
          .gte('created_at', todayStart),
        supabase.from('shipments')
          .select('id', { count: 'exact' })
          .or(`generator_id.eq.${orgId},transporter_id.eq.${orgId},recycler_id.eq.${orgId},disposal_facility_id.eq.${orgId}`)
          .gte('created_at', yesterdayStart)
          .lt('created_at', todayStart),
        supabase.from('shipments')
          .select('id', { count: 'exact' })
          .or(`generator_id.eq.${orgId},transporter_id.eq.${orgId},recycler_id.eq.${orgId},disposal_facility_id.eq.${orgId}`)
          .in('status', ['new', 'approved'] as any[]),
      ]);

      const today = todayRes.data || [];
      const completed = today.filter(s => ['delivered', 'confirmed'].includes(s.status)).length;
      const tons = today.reduce((s, sh) => s + (sh.unit === 'kg' ? (sh.quantity || 0) / 1000 : (sh.quantity || 0)), 0);

      // Top waste type
      const wasteCount: Record<string, number> = {};
      today.forEach(s => { const wt = translateWasteType(s.waste_type); wasteCount[wt] = (wasteCount[wt] || 0) + 1; });
      const topWaste = Object.entries(wasteCount).sort((a, b) => b[1] - a[1])[0]?.[0] || '-';

      // Streak: consecutive days with activity (simplified)
      let streak = today.length > 0 ? 1 : 0;
      if ((yesterdayRes.count || 0) > 0) streak++;

      return {
        todayShipments: today.length,
        todayCompleted: completed,
        todayPending: pendingRes.count || 0,
        todayTons: Math.round(tons * 10) / 10,
        yesterdayShipments: yesterdayRes.count || 0,
        streak,
        topWasteType: topWaste,
      };
    },
    enabled: !!orgId,
    staleTime: 2 * 60 * 1000,
    refetchInterval: 5 * 60 * 1000,
  });

  const pulseItems = useMemo(() => {
    if (!stats) return [];
    return [
      { icon: Truck, label: 'شحنات اليوم', value: stats.todayShipments, color: 'text-primary' },
      { icon: CheckCircle2, label: 'مكتملة', value: stats.todayCompleted, color: 'text-emerald-600' },
      { icon: Clock, label: 'معلقة', value: stats.todayPending, color: 'text-amber-600' },
      { icon: Activity, label: 'الحمولة', value: `${stats.todayTons} طن`, color: 'text-blue-600' },
    ];
  }, [stats]);

  return (
    <Card className="border-border overflow-hidden">
      <CardHeader className="pb-2 bg-gradient-to-l from-primary/5 to-transparent">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-base">
            <GIcon className="h-5 w-5 text-primary" />
            {greeting.emoji} {greeting.text}
          </CardTitle>
          {stats && stats.streak > 0 && (
            <Badge variant="outline" className="text-xs gap-1">
              <Zap className="h-3 w-3" />
              {stats.streak} يوم نشاط متتالي 🔥
            </Badge>
          )}
        </div>
        <p className="text-xs text-muted-foreground mt-1">
          {new Date().toLocaleDateString('ar-EG', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
        </p>
      </CardHeader>
      <CardContent className="pt-3">
        <div className="grid grid-cols-4 gap-3">
          {pulseItems.map((item, idx) => {
            const Icon = item.icon;
            return (
              <div key={idx} className="text-center">
                <Icon className={`h-5 w-5 mx-auto mb-1 ${item.color}`} />
                <p className="text-lg font-bold">{item.value}</p>
                <p className="text-[10px] text-muted-foreground">{item.label}</p>
              </div>
            );
          })}
        </div>

        {stats && (
          <>
            <Separator className="my-3" />
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <TrendingUp className="h-3 w-3" />
                أمس: {stats.yesterdayShipments} شحنة
              </span>
              {stats.topWasteType !== '-' && (
                <span>الأكثر: {stats.topWasteType}</span>
              )}
              {stats.todayPending > 5 && (
                <span className="flex items-center gap-1 text-amber-600">
                  <AlertTriangle className="h-3 w-3" />
                  {stats.todayPending} بانتظار المتابعة
                </span>
              )}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
