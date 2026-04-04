import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Crown, Medal, Trophy, TrendingUp, Users } from 'lucide-react';
import { motion } from 'framer-motion';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useQuery } from '@tanstack/react-query';

const DriverLeaderboard = () => {
  const { profile } = useAuth();

  const { data: leaderboard } = useQuery({
    queryKey: ['driver-leaderboard', profile?.id],
    queryFn: async () => {
      if (!profile?.id) return [];

      // Get driver's org
      const { data: driverData } = await supabase
        .from('drivers')
        .select('id, organization_id')
        .eq('profile_id', profile.id)
        .single();
      if (!driverData) return [];

      // Get all drivers in same org
      const driversResult = await (supabase
        .from('drivers' as any)
        .select('id, profile_id, organization_id')
        .eq('organization_id', driverData.organization_id)
        .eq('is_active', true));
      const drivers = driversResult.data as any[] | null;

      if (!drivers || drivers.length === 0) return [];

      // Get profiles for drivers
      const profileIds = drivers.map(d => d.profile_id).filter(Boolean);
      const { data: profilesData } = await supabase
        .from('profiles')
        .select('id, full_name, avatar_url')
        .in('id', profileIds);
      const profileMap: Record<string, any> = {};
      profilesData?.forEach(p => { profileMap[p.id] = p; });

      if (!drivers || drivers.length === 0) return [];

      // Get wallets
      const driverIds = drivers.map(d => d.id);
      const { data: wallets } = await supabase
        .from('driver_wallet')
        .select('driver_id, total_points, streak_days, level')
        .in('driver_id', driverIds);

      const walletMap: Record<string, any> = {};
      wallets?.forEach(w => { walletMap[w.driver_id] = w; });

      // Get delivery counts this month
      const monthStart = new Date();
      monthStart.setDate(1);
      monthStart.setHours(0, 0, 0, 0);

      const { data: deliveries } = await supabase
        .from('shipments')
        .select('driver_id, id')
        .in('driver_id', driverIds)
        .in('status', ['delivered', 'confirmed'])
        .gte('delivered_at', monthStart.toISOString());

      const deliveryCount: Record<string, number> = {};
      deliveries?.forEach(d => {
        if (d.driver_id) deliveryCount[d.driver_id] = (deliveryCount[d.driver_id] || 0) + 1;
      });

      return (drivers as any[]).map((d: any) => ({
        id: d.id,
        name: profileMap[d.profile_id]?.full_name || 'سائق',
        avatar: profileMap[d.profile_id]?.avatar_url,
        isMe: d.profile_id === profile.id,
        points: walletMap[d.id]?.total_points || 0,
        streak: walletMap[d.id]?.streak_days || 0,
        level: walletMap[d.id]?.level || 'bronze',
        deliveries: deliveryCount[d.id] || 0,
      }))
      .sort((a, b) => b.points - a.points)
      .map((d, i) => ({ ...d, rank: i + 1 }));
    },
    enabled: !!profile?.id,
  });

  const getRankIcon = (rank: number) => {
    if (rank === 1) return <Crown className="w-5 h-5 text-amber-400" />;
    if (rank === 2) return <Medal className="w-5 h-5 text-muted-foreground" />;
    if (rank === 3) return <Medal className="w-5 h-5 text-orange-600" />;
    return <span className="text-xs font-bold text-muted-foreground">#{rank}</span>;
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Users className="w-5 h-5 text-primary" />
          لوحة المتصدرين
          <Badge variant="outline" className="text-[10px] mr-auto">هذا الشهر</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {(!leaderboard || leaderboard.length === 0) ? (
          <p className="text-sm text-muted-foreground text-center py-6">لا توجد بيانات متاحة</p>
        ) : (
          <div className="space-y-2">
            {leaderboard.map((driver, idx) => (
              <motion.div
                key={driver.id}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.05 }}
                className={`flex items-center gap-3 p-3 rounded-lg border transition-colors ${
                  driver.isMe 
                    ? 'bg-primary/5 border-primary/30 ring-1 ring-primary/20' 
                    : 'hover:bg-muted/30'
                }`}
              >
                <div className="w-8 h-8 flex items-center justify-center">
                  {getRankIcon(driver.rank)}
                </div>
                <Avatar className="h-9 w-9">
                  <AvatarFallback className={`text-xs ${driver.isMe ? 'bg-primary/10 text-primary' : 'bg-muted'}`}>
                    {driver.name.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <p className="text-sm font-semibold truncate">
                      {driver.name} {driver.isMe && '(أنت)'}
                    </p>
                    {driver.streak > 0 && <span className="text-xs">🔥{driver.streak}</span>}
                  </div>
                  <p className="text-[10px] text-muted-foreground">{driver.deliveries} تسليم هذا الشهر</p>
                </div>
                <div className="text-left">
                  <p className="text-sm font-bold text-primary">{driver.points}</p>
                  <p className="text-[10px] text-muted-foreground">نقطة</p>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default DriverLeaderboard;
