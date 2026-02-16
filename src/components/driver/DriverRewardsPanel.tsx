import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import {
  Trophy, Star, Medal, Award, Target, Flame,
  TrendingUp, Zap, Shield, Clock
} from 'lucide-react';
import { motion } from 'framer-motion';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useQuery } from '@tanstack/react-query';

interface DriverReward {
  type: string;
  label: string;
  description: string;
  icon: any;
  color: string;
  points: number;
  earned: boolean;
  progress: number;
  target: number;
}

const DriverRewardsPanel = () => {
  const { profile } = useAuth();

  const { data: driverStats } = useQuery({
    queryKey: ['driver-rewards-stats', profile?.id],
    queryFn: async () => {
      if (!profile?.id) return null;
      
      // Get driver
      const { data: driver } = await supabase
        .from('drivers')
        .select('id')
        .eq('profile_id', profile.id)
        .single();
      
      if (!driver) return null;

      // Get shipment stats
      const { data: shipments } = await supabase
        .from('shipments')
        .select('id, status, created_at, delivered_at, in_transit_at')
        .eq('driver_id', driver.id);

      const total = shipments?.length || 0;
      const delivered = shipments?.filter(s => ['delivered', 'confirmed'].includes(s.status)).length || 0;
      
      // Calculate on-time delivery
      const onTime = shipments?.filter(s => {
        if (!s.delivered_at || !s.in_transit_at) return false;
        const duration = new Date(s.delivered_at).getTime() - new Date(s.in_transit_at).getTime();
        return duration < 2 * 60 * 60 * 1000; // Less than 2 hours
      }).length || 0;

      // Streak: consecutive days with deliveries
      const dates = new Set(
        shipments
          ?.filter(s => s.delivered_at)
          .map(s => s.delivered_at!.split('T')[0])
      );
      let streak = 0;
      const today = new Date();
      for (let i = 0; i < 30; i++) {
        const d = new Date(today);
        d.setDate(d.getDate() - i);
        if (dates.has(d.toISOString().split('T')[0])) {
          streak++;
        } else if (i > 0) break;
      }

      return { total, delivered, onTime, streak };
    },
    enabled: !!profile?.id,
  });

  const totalPoints = useMemo(() => {
    if (!driverStats) return 0;
    let points = 0;
    points += driverStats.delivered * 10; // 10 points per delivery
    points += driverStats.onTime * 5; // 5 bonus for on-time
    points += driverStats.streak * 20; // 20 per streak day
    return points;
  }, [driverStats]);

  const level = useMemo(() => {
    if (totalPoints >= 1000) return { name: 'ماسي', color: 'text-cyan-400', next: null, icon: '💎' };
    if (totalPoints >= 500) return { name: 'ذهبي', color: 'text-amber-400', next: 1000, icon: '🥇' };
    if (totalPoints >= 200) return { name: 'فضي', color: 'text-gray-400', next: 500, icon: '🥈' };
    return { name: 'برونزي', color: 'text-orange-600', next: 200, icon: '🥉' };
  }, [totalPoints]);

  const rewards: DriverReward[] = useMemo(() => {
    const d = driverStats || { total: 0, delivered: 0, onTime: 0, streak: 0 };
    return [
      {
        type: 'deliveries',
        label: 'سائق محترف',
        description: 'أكمل 50 عملية تسليم',
        icon: Truck,
        color: 'text-blue-500',
        points: 100,
        earned: d.delivered >= 50,
        progress: d.delivered,
        target: 50,
      },
      {
        type: 'ontime',
        label: 'دقيق المواعيد',
        description: 'سلّم 30 شحنة في الوقت',
        icon: Clock,
        color: 'text-emerald-500',
        points: 75,
        earned: d.onTime >= 30,
        progress: d.onTime,
        target: 30,
      },
      {
        type: 'streak',
        label: 'مثابر',
        description: '7 أيام عمل متتالية',
        icon: Flame,
        color: 'text-orange-500',
        points: 50,
        earned: d.streak >= 7,
        progress: d.streak,
        target: 7,
      },
      {
        type: 'century',
        label: 'المئوي',
        description: 'أكمل 100 عملية تسليم',
        icon: Trophy,
        color: 'text-amber-500',
        points: 200,
        earned: d.delivered >= 100,
        progress: d.delivered,
        target: 100,
      },
    ];
  }, [driverStats]);

  const Truck = TrendingUp; // reuse icon

  return (
    <div className="space-y-4">
      {/* Level Card */}
      <Card className="bg-gradient-to-br from-primary/5 to-transparent border-primary/20">
        <CardContent className="pt-5 pb-5">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-2xl">{level.icon}</span>
                <div>
                  <p className={`font-bold text-lg ${level.color}`}>المستوى {level.name}</p>
                  <p className="text-xs text-muted-foreground">{totalPoints} نقطة</p>
                </div>
              </div>
            </div>
            <div className="text-center">
              <div className="w-14 h-14 rounded-full bg-primary/10 border-2 border-primary/30 flex items-center justify-center">
                <Star className="w-6 h-6 text-primary" />
              </div>
            </div>
          </div>
          {level.next && (
            <div className="mt-3">
              <div className="flex justify-between text-xs text-muted-foreground mb-1">
                <span>{totalPoints} نقطة</span>
                <span>{level.next} للمستوى التالي</span>
              </div>
              <Progress value={(totalPoints / level.next) * 100} className="h-2" />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Streak */}
      {driverStats && driverStats.streak > 0 && (
        <Card className="border-orange-500/30 bg-orange-500/5">
          <CardContent className="pt-4 pb-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-orange-500/10 flex items-center justify-center">
              <Flame className="w-5 h-5 text-orange-500" />
            </div>
            <div className="flex-1">
              <p className="font-semibold text-sm">سلسلة {driverStats.streak} يوم 🔥</p>
              <p className="text-xs text-muted-foreground">استمر في العمل للحصول على مكافأة!</p>
            </div>
            <Badge variant="outline" className="text-orange-600 border-orange-500/30">
              +{driverStats.streak * 20} نقطة
            </Badge>
          </CardContent>
        </Card>
      )}

      {/* Achievements */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Award className="w-5 h-5 text-primary" />
            الإنجازات والمكافآت
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {rewards.map((reward, idx) => (
            <motion.div
              key={reward.type}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.1 }}
              className={`flex items-center gap-3 p-3 rounded-lg border ${reward.earned ? 'bg-primary/5 border-primary/20' : 'bg-muted/30'}`}
            >
              <div className={`w-10 h-10 rounded-full flex items-center justify-center ${reward.earned ? 'bg-primary/10' : 'bg-muted'}`}>
                <reward.icon className={`w-5 h-5 ${reward.earned ? reward.color : 'text-muted-foreground'}`} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className={`text-sm font-semibold ${reward.earned ? '' : 'text-muted-foreground'}`}>
                    {reward.label}
                  </p>
                  {reward.earned && <Badge variant="outline" className="text-[10px] text-primary border-primary/30">مكتمل ✓</Badge>}
                </div>
                <p className="text-xs text-muted-foreground">{reward.description}</p>
                {!reward.earned && (
                  <Progress value={(reward.progress / reward.target) * 100} className="h-1 mt-1.5" />
                )}
              </div>
              <Badge variant="secondary" className="text-xs">
                +{reward.points}
              </Badge>
            </motion.div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
};

export default DriverRewardsPanel;
