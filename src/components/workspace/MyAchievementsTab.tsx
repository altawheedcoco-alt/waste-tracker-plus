import { useAuth } from '@/contexts/AuthContext';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Trophy, TrendingUp, Package, Star, Target, Flame, Zap, Award, CheckCircle2, Calendar, Clock } from 'lucide-react';
import { Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';

// Progress ring for achievements
const AchievementRing = ({ value, max, size = 56 }: { value: number; max: number; size?: number }) => {
  const radius = (size - 5) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = Math.min(value / max, 1);
  const offset = circumference - progress * circumference;

  return (
    <svg width={size} height={size} className="transform -rotate-90">
      <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="hsl(var(--muted))" strokeWidth={4} />
      <motion.circle
        cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="hsl(var(--primary))" strokeWidth={4}
        strokeLinecap="round" strokeDasharray={circumference}
        initial={{ strokeDashoffset: circumference }}
        animate={{ strokeDashoffset: offset }}
        transition={{ duration: 1, ease: 'easeOut' }}
      />
    </svg>
  );
};

const MyAchievementsTab = () => {
  const { user, organization } = useAuth();

  const { data: stats, isLoading } = useQuery({
    queryKey: ['my-achievements-v2', user?.id],
    queryFn: async () => {
      if (!user?.id || !organization?.id) return null;
      const now = new Date();
      const weekStart = new Date(now.getTime() - 7 * 86400000).toISOString();
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

      const [shipmentsRes, logsRes, notifsRes, weekLogsRes, monthLogsRes, consecutiveDays] = await Promise.all([
        (supabase.from('shipments') as any).select('id', { count: 'exact', head: true }).eq('organization_id', organization.id).eq('status', 'delivered'),
        supabase.from('activity_logs').select('id', { count: 'exact', head: true }).eq('user_id', user.id),
        supabase.from('notifications').select('id', { count: 'exact', head: true }).eq('user_id', user.id).eq('is_read', true),
        supabase.from('activity_logs').select('id', { count: 'exact', head: true }).eq('user_id', user.id).gte('created_at', weekStart),
        supabase.from('activity_logs').select('id', { count: 'exact', head: true }).eq('user_id', user.id).gte('created_at', monthStart),
        // Calculate streak - check last 30 days for consecutive activity
        Promise.resolve().then(async () => {
          let streak = 0;
          for (let i = 0; i < 30; i++) {
            const date = new Date();
            date.setDate(date.getDate() - i);
            const dayStart = new Date(date.getFullYear(), date.getMonth(), date.getDate()).toISOString();
            const dayEnd = new Date(date.getFullYear(), date.getMonth(), date.getDate() + 1).toISOString();
            const { count } = await supabase.from('activity_logs').select('id', { count: 'exact', head: true }).eq('user_id', user!.id).gte('created_at', dayStart).lt('created_at', dayEnd);
            if ((count || 0) > 0) streak++;
            else break;
          }
          return streak;
        }),
      ]);

      return {
        deliveredShipments: shipmentsRes.count || 0,
        totalActions: logsRes.count || 0,
        readNotifications: notifsRes.count || 0,
        weekActions: weekLogsRes.count || 0,
        monthActions: monthLogsRes.count || 0,
        streak: consecutiveDays,
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
  const streak = stats?.streak || 0;
  const weekActions = stats?.weekActions || 0;
  const monthActions = stats?.monthActions || 0;

  const totalScore = delivered * 10 + actions + readNotifs * 0.5 + streak * 5;

  const levels = [
    { name: 'مبتدئ', min: 0, emoji: '🌱', color: 'from-muted to-muted/50' },
    { name: 'نشط', min: 20, emoji: '⚡', color: 'from-primary/20 to-primary/40' },
    { name: 'متقدم', min: 100, emoji: '🚀', color: 'from-primary/40 to-primary/60' },
    { name: 'خبير', min: 300, emoji: '🏆', color: 'from-primary/60 to-primary' },
    { name: 'أسطورة', min: 1000, emoji: '👑', color: 'from-primary to-accent' },
  ];

  const currentLevel = [...levels].reverse().find(l => totalScore >= l.min) || levels[0];
  const nextLevel = levels.find(l => l.min > totalScore);
  const progressToNext = nextLevel ? ((totalScore - currentLevel.min) / (nextLevel.min - currentLevel.min)) * 100 : 100;

  const achievements = [
    { title: 'شحنات مكتملة', value: delivered, icon: Package, milestone: 50, unit: 'شحنة', color: 'text-primary' },
    { title: 'إجراءات منفذة', value: actions, icon: TrendingUp, milestone: 200, unit: 'إجراء', color: 'text-primary' },
    { title: 'إشعارات معالجة', value: readNotifs, icon: Star, milestone: 100, unit: 'إشعار', color: 'text-primary' },
  ];

  const badges = [
    { name: 'أول شحنة', emoji: '📦', unlocked: delivered >= 1, desc: 'أكمل أول شحنة' },
    { name: '10 شحنات', emoji: '🚛', unlocked: delivered >= 10, desc: 'أكمل 10 شحنات' },
    { name: '50 إجراء', emoji: '⚡', unlocked: actions >= 50, desc: 'نفّذ 50 إجراء' },
    { name: 'قارئ نشط', emoji: '📖', unlocked: readNotifs >= 20, desc: 'اقرأ 20 إشعار' },
    { name: 'نشاط يومي', emoji: '🔥', unlocked: streak >= 3, desc: '3 أيام متتالية' },
    { name: 'أسبوع كامل', emoji: '🌟', unlocked: streak >= 7, desc: '7 أيام متتالية' },
    { name: 'محترف', emoji: '🎯', unlocked: totalScore >= 200, desc: '200 نقطة' },
    { name: 'أسطورة', emoji: '👑', unlocked: totalScore >= 1000, desc: '1000 نقطة' },
  ];

  const unlockedBadges = badges.filter(b => b.unlocked).length;

  // Weekly challenges
  const weeklyChallenges = [
    { title: 'أكمل 5 إجراءات هذا الأسبوع', current: Math.min(weekActions, 5), target: 5, reward: '+10 نقاط' },
    { title: 'حافظ على نشاطك اليومي', current: Math.min(streak, 7), target: 7, reward: '+35 نقطة' },
    { title: 'أكمل 20 إجراء هذا الشهر', current: Math.min(monthActions, 20), target: 20, reward: '+50 نقطة' },
  ];

  return (
    <div className="space-y-5">
      {/* ─── Level + Streak Hero ─── */}
      <div className="grid gap-4 lg:grid-cols-3">
        {/* Level Card */}
        <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} className="lg:col-span-2">
          <Card className="border-primary/10 overflow-hidden h-full">
            <CardContent className="p-5 sm:p-6">
              <div className="flex items-center gap-5">
                <div className={`w-20 h-20 rounded-2xl bg-gradient-to-br ${currentLevel.color} flex items-center justify-center shadow-lg shrink-0`}>
                  <span className="text-4xl">{currentLevel.emoji}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-2xl font-bold">{currentLevel.name}</h3>
                    <Badge variant="secondary" className="text-xs">{Math.round(totalScore)} نقطة</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">المستوى {levels.indexOf(currentLevel) + 1} من {levels.length}</p>
                  {nextLevel && (
                    <div className="mt-3">
                      <div className="flex items-center justify-between text-[10px] text-muted-foreground mb-1">
                        <span>{currentLevel.name}</span>
                        <span>{nextLevel.name} — {nextLevel.min} نقطة</span>
                      </div>
                      <div className="w-full bg-muted rounded-full h-3 overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${Math.min(progressToNext, 100)}%` }}
                          transition={{ duration: 1.2, ease: 'easeOut' }}
                          className="h-3 rounded-full bg-gradient-to-r from-primary to-primary/60"
                        />
                      </div>
                      <p className="text-[10px] text-muted-foreground mt-1">
                        باقي {Math.round(nextLevel.min - totalScore)} نقطة للمستوى التالي
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Streak Card */}
        <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.1 }}>
          <Card className={`border-border/30 h-full ${streak >= 3 ? 'border-primary/20 bg-gradient-to-br from-primary/5 to-card' : ''}`}>
            <CardContent className="p-5 flex flex-col items-center justify-center h-full text-center">
              <div className={`text-5xl mb-2 ${streak >= 3 ? 'animate-pulse' : ''}`}>
                {streak >= 7 ? '🔥' : streak >= 3 ? '⚡' : streak >= 1 ? '✨' : '💤'}
              </div>
              <p className="text-3xl font-bold">{streak}</p>
              <p className="text-sm text-muted-foreground">أيام متتالية</p>
              {streak >= 3 && (
                <Badge className="mt-2 bg-primary/10 text-primary border-primary/20 text-[10px]">
                  🔥 سلسلة نشاط!
                </Badge>
              )}
              {streak === 0 && (
                <p className="text-[10px] text-muted-foreground mt-2">سجّل نشاطاً اليوم لبدء سلسلة!</p>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* ─── Weekly Challenges ─── */}
      <Card className="border-border/30">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-sm">
            <Target className="w-4 h-4 text-primary" />
            التحديات الأسبوعية
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {weeklyChallenges.map((challenge, i) => {
            const progress = (challenge.current / challenge.target) * 100;
            const completed = challenge.current >= challenge.target;
            return (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 + i * 0.08 }}
                className={`p-3 rounded-xl border transition-all ${completed ? 'border-primary/30 bg-primary/5' : 'border-border/30'}`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    {completed ? (
                      <CheckCircle2 className="w-4 h-4 text-primary" />
                    ) : (
                      <Clock className="w-4 h-4 text-muted-foreground" />
                    )}
                    <span className={`text-xs font-medium ${completed ? 'line-through text-muted-foreground' : ''}`}>
                      {challenge.title}
                    </span>
                  </div>
                  <Badge variant="outline" className="text-[9px] h-5">{challenge.reward}</Badge>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex-1 bg-muted rounded-full h-2 overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${Math.min(progress, 100)}%` }}
                      transition={{ duration: 0.8, delay: 0.4 + i * 0.1 }}
                      className={`h-2 rounded-full ${completed ? 'bg-primary' : 'bg-primary/60'}`}
                    />
                  </div>
                  <span className="text-[10px] text-muted-foreground font-medium w-12 text-left">
                    {challenge.current}/{challenge.target}
                  </span>
                </div>
              </motion.div>
            );
          })}
        </CardContent>
      </Card>

      {/* ─── Stats Grid ─── */}
      <div className="grid gap-3 sm:grid-cols-3">
        {achievements.map((a, i) => {
          const progress = Math.min((a.value / a.milestone) * 100, 100);
          return (
            <motion.div
              key={a.title}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 + i * 0.08 }}
            >
              <Card className="border-border/30 h-full">
                <CardContent className="p-4 flex items-center gap-3">
                  <div className="relative shrink-0">
                    <AchievementRing value={a.value} max={a.milestone} />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <a.icon className="w-5 h-5 text-primary" />
                    </div>
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs text-muted-foreground">{a.title}</p>
                    <p className="text-lg font-bold">{a.value}<span className="text-xs text-muted-foreground font-normal">/{a.milestone}</span></p>
                    <p className="text-[10px] text-muted-foreground">{a.unit}</p>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>

      {/* ─── Badges ─── */}
      <Card className="border-border/30">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-sm">
            <Award className="w-4 h-4 text-primary" />
            الشارات المكتسبة
            <Badge variant="secondary" className="text-[10px]">{unlockedBadges}/{badges.length}</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-4 sm:grid-cols-8 gap-2">
            {badges.map((b, i) => (
              <motion.div
                key={b.name}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.5 + i * 0.06 }}
                title={b.desc}
                className={`flex flex-col items-center gap-1 p-2.5 rounded-xl border transition-all ${
                  b.unlocked
                    ? 'border-primary/30 bg-primary/5 hover:bg-primary/10 cursor-default'
                    : 'border-border/20 bg-muted/10 opacity-35 grayscale'
                }`}
              >
                <span className="text-xl">{b.emoji}</span>
                <span className="text-[8px] font-medium text-center leading-tight">{b.name}</span>
              </motion.div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default MyAchievementsTab;
