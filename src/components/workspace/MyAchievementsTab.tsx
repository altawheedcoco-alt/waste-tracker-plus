import { useAuth } from '@/contexts/AuthContext';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Trophy, TrendingUp, Package, Star, Target, Flame } from 'lucide-react';
import { Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';

const MyAchievementsTab = () => {
  const { user, organization } = useAuth();

  const { data: stats, isLoading } = useQuery({
    queryKey: ['my-achievements', user?.id],
    queryFn: async () => {
      if (!user?.id || !organization?.id) return null;

      const [shipmentsRes, logsRes, notifsRes] = await Promise.all([
        (supabase.from('shipments') as any).select('id', { count: 'exact', head: true }).eq('organization_id', organization.id).eq('status', 'delivered'),
        supabase.from('activity_logs').select('id', { count: 'exact', head: true }).eq('user_id', user.id),
        supabase.from('notifications').select('id', { count: 'exact', head: true }).eq('user_id', user.id).eq('is_read', true),
      ]);

      return {
        deliveredShipments: shipmentsRes.count || 0,
        totalActions: logsRes.count || 0,
        readNotifications: notifsRes.count || 0,
      };
    },
    enabled: !!user?.id && !!organization?.id,
    staleTime: 1000 * 60 * 5,
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="w-6 h-6 text-primary animate-spin" />
      </div>
    );
  }

  const delivered = stats?.deliveredShipments || 0;
  const actions = stats?.totalActions || 0;
  const readNotifs = stats?.readNotifications || 0;

  const totalScore = delivered * 10 + actions + readNotifs * 0.5;

  const levels = [
    { name: 'مبتدئ', min: 0, emoji: '🌱', color: 'from-muted to-muted' },
    { name: 'نشط', min: 20, emoji: '⚡', color: 'from-primary/30 to-primary/50' },
    { name: 'متقدم', min: 100, emoji: '🚀', color: 'from-primary/50 to-primary/70' },
    { name: 'خبير', min: 300, emoji: '🏆', color: 'from-primary to-primary/80' },
    { name: 'أسطورة', min: 1000, emoji: '👑', color: 'from-primary to-accent' },
  ];

  const currentLevel = [...levels].reverse().find(l => totalScore >= l.min) || levels[0];
  const nextLevel = levels.find(l => l.min > totalScore);
  const progressToNext = nextLevel ? ((totalScore - currentLevel.min) / (nextLevel.min - currentLevel.min)) * 100 : 100;

  const achievements = [
    { title: 'شحنات مكتملة', value: delivered, icon: Package, milestone: 50, unit: 'شحنة' },
    { title: 'إجراءات منفذة', value: actions, icon: TrendingUp, milestone: 200, unit: 'إجراء' },
    { title: 'إشعارات معالجة', value: readNotifs, icon: Star, milestone: 100, unit: 'إشعار' },
  ];

  // Unlocked badges
  const badges = [
    { name: 'أول شحنة', emoji: '📦', unlocked: delivered >= 1 },
    { name: '10 شحنات', emoji: '🚛', unlocked: delivered >= 10 },
    { name: '50 إجراء', emoji: '⚡', unlocked: actions >= 50 },
    { name: 'قارئ نشط', emoji: '📖', unlocked: readNotifs >= 20 },
    { name: 'محترف', emoji: '🎯', unlocked: totalScore >= 200 },
    { name: 'أسطورة', emoji: '👑', unlocked: totalScore >= 1000 },
  ];

  return (
    <div className="space-y-6">
      {/* Level Card */}
      <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }}>
        <Card className="border-primary/10 overflow-hidden">
          <CardContent className="p-6">
            <div className="flex items-center gap-5">
              <div className={`w-20 h-20 rounded-2xl bg-gradient-to-br ${currentLevel.color} flex items-center justify-center shadow-lg`}>
                <span className="text-4xl">{currentLevel.emoji}</span>
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h3 className="text-2xl font-bold">{currentLevel.name}</h3>
                  <Badge variant="secondary" className="text-xs">{Math.round(totalScore)} نقطة</Badge>
                </div>
                {nextLevel && (
                  <div className="mt-3">
                    <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
                      <span>{currentLevel.name}</span>
                      <span>{nextLevel.name} ({nextLevel.min} نقطة)</span>
                    </div>
                    <div className="w-full bg-muted rounded-full h-3">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${Math.min(progressToNext, 100)}%` }}
                        transition={{ duration: 1, ease: 'easeOut' }}
                        className="h-3 rounded-full bg-gradient-to-r from-primary to-primary/60"
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Stats Grid */}
      <div className="grid gap-4 sm:grid-cols-3">
        {achievements.map((a, i) => {
          const progress = Math.min((a.value / a.milestone) * 100, 100);
          return (
            <motion.div
              key={a.title}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
            >
              <Card className="border-border/30 h-full">
                <CardContent className="p-5 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center">
                      <a.icon className="w-5 h-5 text-primary" />
                    </div>
                    <div className="text-left">
                      <span className="text-2xl font-bold">{a.value}</span>
                      <span className="text-xs text-muted-foreground mr-1">/ {a.milestone}</span>
                    </div>
                  </div>
                  <p className="text-sm font-medium">{a.title}</p>
                  <div className="w-full bg-muted rounded-full h-2">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${progress}%` }}
                      transition={{ duration: 0.8, delay: 0.3 + i * 0.1 }}
                      className="h-2 rounded-full bg-gradient-to-r from-primary to-primary/60"
                    />
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>

      {/* Badges */}
      <Card className="border-border/30">
        <CardContent className="p-5">
          <div className="flex items-center gap-2 mb-4">
            <Flame className="w-5 h-5 text-primary" />
            <h3 className="font-semibold">الشارات</h3>
            <Badge variant="secondary" className="text-xs">
              {badges.filter(b => b.unlocked).length}/{badges.length}
            </Badge>
          </div>
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
            {badges.map((b, i) => (
              <motion.div
                key={b.name}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.5 + i * 0.08 }}
                className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border transition-all ${
                  b.unlocked
                    ? 'border-primary/30 bg-primary/5'
                    : 'border-border/20 bg-muted/20 opacity-40 grayscale'
                }`}
              >
                <span className="text-2xl">{b.emoji}</span>
                <span className="text-[10px] font-medium text-center leading-tight">{b.name}</span>
              </motion.div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default MyAchievementsTab;
