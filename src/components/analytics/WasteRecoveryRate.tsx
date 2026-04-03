/**
 * WasteRecoveryRate — معدل استرداد المخلفات
 */
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Recycle, TrendingUp, Leaf } from 'lucide-react';
import { RadialBarChart, RadialBar, ResponsiveContainer, Tooltip } from 'recharts';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export default function WasteRecoveryRate() {
  const { organization } = useAuth();
  const orgId = organization?.id;

  const { data, isLoading } = useQuery({
    queryKey: ['waste-recovery', orgId],
    queryFn: async () => {
      if (!orgId) return null;

      const sixMonthsAgo = new Date();
      sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

      const { data: shipments } = await supabase
        .from('shipments')
        .select('actual_weight, weight_at_source, weight_at_destination, status, disposal_type')
        .or(`generator_id.eq.${orgId},recycler_id.eq.${orgId},transporter_id.eq.${orgId}`)
        .gte('created_at', sixMonthsAgo.toISOString())
        .in('status', ['delivered', 'completed', 'recycled']);

      let totalCollected = 0;
      let totalRecovered = 0;
      let recycled = 0;
      let landfilled = 0;
      let composted = 0;

      (shipments || []).forEach(s => {
        const weight = s.actual_weight || s.weight_at_source || 0;
        totalCollected += weight;

        const dtype = (s.disposal_type || '').toLowerCase();
        if (dtype.includes('recycl') || dtype.includes('تدوير')) {
          totalRecovered += weight;
          recycled += weight;
        } else if (dtype.includes('compost') || dtype.includes('سماد')) {
          totalRecovered += weight;
          composted += weight;
        } else if (dtype.includes('landfill') || dtype.includes('مكب') || dtype.includes('دفن')) {
          landfilled += weight;
        } else {
          // Default: assume 60% recovery for delivered shipments
          totalRecovered += weight * 0.6;
          recycled += weight * 0.6;
        }
      });

      const recoveryRate = totalCollected > 0 ? Math.round((totalRecovered / totalCollected) * 100) : 0;

      const chartData = [
        { name: 'معدل الاسترداد', value: recoveryRate, fill: recoveryRate >= 70 ? 'hsl(142, 76%, 36%)' : recoveryRate >= 50 ? 'hsl(48, 96%, 53%)' : 'hsl(346, 87%, 50%)' },
      ];

      return {
        recoveryRate,
        totalCollected: Math.round(totalCollected),
        totalRecovered: Math.round(totalRecovered),
        recycled: Math.round(recycled),
        composted: Math.round(composted),
        landfilled: Math.round(landfilled),
        chartData,
        co2Saved: Math.round(totalRecovered * 0.5), // ~0.5 kg CO2 per kg recycled
      };
    },
    enabled: !!orgId,
    staleTime: 30 * 60 * 1000,
  });

  return (
    <Card className="border-border">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <CardTitle className="flex items-center gap-2 text-base">
            <Recycle className="h-5 w-5 text-primary" />
            معدل استرداد المخلفات
          </CardTitle>
          {data && (
            <Badge variant={data.recoveryRate >= 70 ? 'default' : 'secondary'} className="gap-1">
              <Leaf className="h-3 w-3" />
              وفر {(data.co2Saved / 1000).toFixed(1)} طن CO₂
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="h-[220px] bg-muted/20 rounded animate-pulse" />
        ) : data ? (
          <div className="flex items-center gap-4">
            {/* Radial gauge */}
            <div className="w-[140px] h-[140px] relative">
              <ResponsiveContainer width="100%" height="100%">
                <RadialBarChart cx="50%" cy="50%" innerRadius="60%" outerRadius="90%" startAngle={180} endAngle={0} data={data.chartData}>
                  <RadialBar dataKey="value" cornerRadius={10} background={{ fill: 'hsl(var(--muted))' }} />
                </RadialBarChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center -mt-4">
                  <p className="text-2xl font-bold">{data.recoveryRate}%</p>
                  <p className="text-[9px] text-muted-foreground">استرداد</p>
                </div>
              </div>
            </div>

            {/* Stats */}
            <div className="flex-1 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">إجمالي الجمع</span>
                <span className="font-medium">{(data.totalCollected / 1000).toFixed(1)} طن</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="flex items-center gap-1 text-green-600"><div className="w-2 h-2 rounded-full bg-green-500" />تدوير</span>
                <span className="font-medium">{(data.recycled / 1000).toFixed(1)} طن</span>
              </div>
              {data.composted > 0 && (
                <div className="flex items-center justify-between text-xs">
                  <span className="flex items-center gap-1 text-amber-600"><div className="w-2 h-2 rounded-full bg-amber-500" />تسميد</span>
                  <span className="font-medium">{(data.composted / 1000).toFixed(1)} طن</span>
                </div>
              )}
              <div className="flex items-center justify-between text-xs">
                <span className="flex items-center gap-1 text-destructive"><div className="w-2 h-2 rounded-full bg-destructive" />مكب</span>
                <span className="font-medium">{(data.landfilled / 1000).toFixed(1)} طن</span>
              </div>
            </div>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
