import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Users, Star, Truck, Clock, Route, Award, Shield,
  Zap, TrendingUp, RefreshCw, Loader2, Medal,
  Crown, Target
} from 'lucide-react';
import { toast } from 'sonner';

const scoreBadges = [
  { min: 90, label: 'نجم الأسطول ⭐', color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400' },
  { min: 80, label: 'ممتاز', color: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400' },
  { min: 70, label: 'جيد جداً', color: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400' },
  { min: 60, label: 'جيد', color: 'bg-sky-100 text-sky-800 dark:bg-sky-900/30 dark:text-sky-400' },
  { min: 0, label: 'يحتاج تحسين', color: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400' },
];

const getScoreBadge = (score: number) => scoreBadges.find(b => score >= b.min) || scoreBadges[scoreBadges.length - 1];

const EnhancedDriverPerformance = () => {
  const { organization } = useAuth();
  const queryClient = useQueryClient();
  const [isCalculating, setIsCalculating] = useState(false);

  const { data: scores = [], isLoading } = useQuery({
    queryKey: ['driver-perf-scores', organization?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('driver_performance_scores')
        .select('*, driver:drivers(id, is_available, profile:profiles(full_name))')
        .eq('organization_id', organization!.id)
        .order('overall_score', { ascending: false })
        .limit(20);
      if (error) throw error;
      return data || [];
    },
    enabled: !!organization?.id,
  });

  const calculateScores = async () => {
    if (!organization?.id) return;
    setIsCalculating(true);
    try {
      const { data: drivers } = await supabase
        .from('drivers')
        .select('id, is_available, license_expiry, profile:profiles(full_name)')
        .eq('organization_id', organization.id);

      if (!drivers?.length) {
        toast.info('لا يوجد سائقون');
        return;
      }

      const driverIds = drivers.map(d => d.id);
      const today = new Date().toISOString().split('T')[0];

      // Batch fetch including incidents for safety score
      const [shipmentsRes, tripCostsRes, ratingsRes, incidentsRes] = await Promise.all([
        supabase.from('shipments').select('driver_id, status, delivered_at, expected_delivery_date').in('driver_id', driverIds),
        supabase.from('trip_costs').select('driver_id, distance_km, fuel_cost, revenue').eq('organization_id', organization.id).in('driver_id', driverIds),
        supabase.from('partner_ratings').select('overall_rating').eq('rated_organization_id', organization.id),
        supabase.from('incident_reports').select('reported_by, severity').eq('organization_id', organization.id),
      ]);

      const avgRating = ratingsRes.data?.length
        ? ratingsRes.data.reduce((s, r) => s + r.overall_rating, 0) / ratingsRes.data.length
        : 3;

      const scoresToUpsert = drivers.map(driver => {
        const driverShipments = shipmentsRes.data?.filter(s => s.driver_id === driver.id) || [];
        const delivered = driverShipments.filter(s => ['delivered', 'confirmed'].includes(s.status));
        const onTime = delivered.filter(s => {
          if (!s.delivered_at || !s.expected_delivery_date) return true;
          return new Date(s.delivered_at) <= new Date(s.expected_delivery_date);
        });

        const driverTrips = tripCostsRes.data?.filter(t => t.driver_id === driver.id) || [];
        const totalDist = driverTrips.reduce((s, t) => s + (Number(t.distance_km) || 0), 0);
        const totalFuel = driverTrips.reduce((s, t) => s + (Number(t.fuel_cost) || 0), 0);

        const onTimeScore = delivered.length > 0 ? Math.round((onTime.length / delivered.length) * 100) : 100;
        
        // Safety score based on real incident data
        const driverIncidents = incidentsRes.data?.filter(i => i.reported_by === driver.id) || [];
        const criticalIncidents = driverIncidents.filter(i => i.severity === 'critical' || i.severity === 'high').length;
        const minorIncidents = driverIncidents.filter(i => i.severity === 'low' || i.severity === 'medium').length;
        const safetyScore = Math.max(0, Math.min(100, 100 - (criticalIncidents * 20) - (minorIncidents * 5)));
        
        const customerScore = Math.round(avgRating * 20); // 5-star to 100
        const efficiencyScore = totalDist > 0 && totalFuel > 0 ? Math.min(100, Math.round((totalDist / totalFuel) * 10)) : 75;

        // Compliance: check license expiry
        let complianceScore = 100;
        if (driver.license_expiry) {
          const daysLeft = Math.ceil((new Date(driver.license_expiry).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
          if (daysLeft < 0) complianceScore = 30;
          else if (daysLeft < 30) complianceScore = 60;
          else if (daysLeft < 90) complianceScore = 80;
        }

        const overall = Math.round(
          onTimeScore * 0.3 + safetyScore * 0.2 + customerScore * 0.2 + efficiencyScore * 0.15 + complianceScore * 0.15
        );

        return {
          organization_id: organization.id,
          driver_id: driver.id,
          period_date: today,
          on_time_score: onTimeScore,
          safety_score: Math.round(safetyScore),
          customer_rating_score: customerScore,
          efficiency_score: efficiencyScore,
          compliance_score: complianceScore,
          overall_score: overall,
          total_trips: driverShipments.length,
          trips_on_time: onTime.length,
          total_distance_km: totalDist,
        };
      });

      // Upsert scores
      for (const score of scoresToUpsert) {
        const { error } = await supabase
          .from('driver_performance_scores')
          .upsert(score, { onConflict: 'driver_id,period_date' });
        if (error) console.error('Upsert error:', error);
      }

      toast.success(`تم حساب الأداء لـ ${scoresToUpsert.length} سائق`);
      queryClient.invalidateQueries({ queryKey: ['driver-perf-scores'] });
    } catch (error) {
      console.error('Error calculating:', error);
      toast.error('حدث خطأ أثناء الحساب');
    } finally {
      setIsCalculating(false);
    }
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <Button size="sm" variant="outline" onClick={calculateScores} disabled={isCalculating} className="gap-1">
            {isCalculating ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
            حساب الأداء
          </Button>
          <CardTitle className="flex items-center gap-2 text-base">
            <Award className="w-5 h-5 text-primary" />
            تقييم أداء السائقين
            <Badge variant="secondary">{scores.length}</Badge>
          </CardTitle>
        </div>
        <CardDescription className="text-right">تقييم شامل بناءً على الالتزام والسلامة وكفاءة الاستهلاك</CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="animate-pulse space-y-3">
            {[1, 2, 3].map(i => <div key={i} className="h-20 bg-muted rounded-lg" />)}
          </div>
        ) : scores.length === 0 ? (
          <div className="text-center py-6 space-y-2">
            <Target className="w-10 h-10 mx-auto text-muted-foreground/50" />
            <p className="text-muted-foreground text-sm">اضغط "حساب الأداء" لبدء التقييم</p>
          </div>
        ) : (
          <ScrollArea className="max-h-[500px]">
            <div className="space-y-3">
              {scores.map((score: any, index: number) => {
                const profile = Array.isArray(score.driver?.profile) ? score.driver.profile[0] : score.driver?.profile;
                const badge = getScoreBadge(Number(score.overall_score));
                const RankIcon = index === 0 ? Crown : index === 1 ? Medal : index === 2 ? Star : Target;

                return (
                  <div key={score.id} className="flex items-center gap-3 p-3 rounded-lg border bg-card hover:shadow-sm transition-shadow">
                    {/* Rank */}
                    <div className="shrink-0 w-8 text-center">
                      <RankIcon className={`w-5 h-5 mx-auto ${index === 0 ? 'text-yellow-500' : index === 1 ? 'text-gray-400' : index === 2 ? 'text-amber-600' : 'text-muted-foreground'}`} />
                      <span className="text-[10px] text-muted-foreground">#{index + 1}</span>
                    </div>

                    <Avatar className="h-10 w-10 shrink-0">
                      <AvatarFallback className="bg-primary/10 text-primary text-sm font-bold">
                        {(profile?.full_name || '?').charAt(0)}
                      </AvatarFallback>
                    </Avatar>

                    <div className="flex-1 min-w-0 space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${badge.color}`}>{badge.label}</span>
                        <p className="font-medium text-sm truncate">{profile?.full_name || 'سائق'}</p>
                      </div>

                      {/* Score bars */}
                      <div className="grid grid-cols-5 gap-1.5 text-center">
                        {[
                          { label: 'الوقت', value: score.on_time_score, icon: Clock },
                          { label: 'السلامة', value: score.safety_score, icon: Shield },
                          { label: 'العملاء', value: score.customer_rating_score, icon: Star },
                          { label: 'الكفاءة', value: score.efficiency_score, icon: Zap },
                          { label: 'الامتثال', value: score.compliance_score, icon: Shield },
                        ].map((metric) => (
                          <div key={metric.label}>
                            <p className="text-[9px] text-muted-foreground">{metric.label}</p>
                            <p className="text-xs font-bold">{Number(metric.value)}</p>
                            <Progress value={Number(metric.value)} className="h-1 mt-0.5" />
                          </div>
                        ))}
                      </div>

                      <div className="flex items-center justify-between text-[10px] text-muted-foreground">
                        <span>{Number(score.total_distance_km).toLocaleString()} كم</span>
                        <span>{score.total_trips} رحلة | {score.trips_on_time} في الوقت</span>
                      </div>
                    </div>

                    {/* Overall score */}
                    <div className="shrink-0 w-14 h-14 rounded-full border-2 flex flex-col items-center justify-center" style={{
                      borderColor: Number(score.overall_score) >= 80 ? '#10b981' : Number(score.overall_score) >= 60 ? '#f59e0b' : '#ef4444'
                    }}>
                      <span className="text-lg font-bold">{Number(score.overall_score)}</span>
                      <span className="text-[8px] text-muted-foreground">نقطة</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
};

export default EnhancedDriverPerformance;
