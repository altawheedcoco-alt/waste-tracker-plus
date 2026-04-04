import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { motion, AnimatePresence } from 'framer-motion';
import { Award, Trophy, Flame, Star, TrendingUp, Crown, Zap, Target, Medal, Gift } from 'lucide-react';
import BackButton from '@/components/ui/back-button';

const levelThresholds = [0, 100, 300, 600, 1000, 1500, 2500, 4000, 6000, 10000];
const levelNames = ['مبتدئ', 'نشط', 'متقدم', 'خبير', 'محترف', 'ماهر', 'متميز', 'أسطوري', 'أسطوري+', 'الأعلى'];

const rarityColors: Record<string, string> = {
  common: 'bg-muted text-foreground border-gray-300',
  uncommon: 'bg-green-100 text-green-700 border-green-300',
  rare: 'bg-blue-100 text-blue-700 border-blue-300',
  epic: 'bg-purple-100 text-purple-700 border-purple-300',
  legendary: 'bg-yellow-100 text-yellow-700 border-yellow-300',
};

const rarityLabels: Record<string, string> = {
  common: 'عادية',
  uncommon: 'غير شائعة',
  rare: 'نادرة',
  epic: 'ملحمية',
  legendary: 'أسطورية',
};

const iconMap: Record<string, React.ElementType> = {
  award: Award, package: Gift, zap: Zap, recycle: Target, star: Star,
  shield: Medal, sunrise: TrendingUp, users: Crown, flame: Flame,
  database: Trophy, leaf: Target,
};

const GamificationDashboard: React.FC = () => {
  const { user } = useAuth();

  const { data: userPoints } = useQuery({
    queryKey: ['user-points', user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from('user_points')
        .select('*')
        .eq('user_id', user!.id)
        .maybeSingle();
      return data;
    },
    enabled: !!user,
  });

  const { data: allBadges } = useQuery({
    queryKey: ['all-badges'],
    queryFn: async () => {
      const { data } = await supabase.from('badges').select('*').eq('is_active', true);
      return data || [];
    },
  });

  const { data: userBadges } = useQuery({
    queryKey: ['user-badges', user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from('user_badges')
        .select('*, badges(*)')
        .eq('user_id', user!.id);
      return data || [];
    },
    enabled: !!user,
  });

  const { data: recentTransactions } = useQuery({
    queryKey: ['points-transactions', user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from('points_transactions')
        .select('*')
        .eq('user_id', user!.id)
        .order('created_at', { ascending: false })
        .limit(20);
      return data || [];
    },
    enabled: !!user,
  });

  const { data: leaderboard } = useQuery({
    queryKey: ['leaderboard'],
    queryFn: async () => {
      const { data } = await supabase
        .from('leaderboard_cache')
        .select('*')
        .eq('period_type', 'monthly')
        .order('total_points', { ascending: false })
        .limit(10);
      return data || [];
    },
  });

  const points = userPoints?.total_points || 0;
  const level = userPoints?.current_level || 1;
  const nextLevel = Math.min(level, levelThresholds.length - 1);
  const currentThreshold = levelThresholds[level - 1] || 0;
  const nextThreshold = levelThresholds[nextLevel] || levelThresholds[levelThresholds.length - 1];
  const progressToNext = nextThreshold > currentThreshold ? ((points - currentThreshold) / (nextThreshold - currentThreshold)) * 100 : 100;

  const earnedBadgeIds = new Set(userBadges?.map(ub => ub.badge_id) || []);

  return (
    <div className="space-y-6 pb-10">
      <div className="flex items-center gap-3">
        <BackButton />
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Trophy className="w-7 h-7 text-primary" />
            نظام المكافآت والتحفيز
          </h1>
          <p className="text-muted-foreground">اجمع النقاط واحصل على شارات وتسلق لوحة المتصدرين</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-primary/10">
            <CardContent className="p-4 text-center">
              <Star className="w-8 h-8 text-primary mx-auto mb-2" />
              <div className="text-3xl font-bold text-primary">{points}</div>
              <div className="text-sm text-muted-foreground">إجمالي النقاط</div>
            </CardContent>
          </Card>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <Card>
            <CardContent className="p-4 text-center">
              <Crown className="w-8 h-8 text-yellow-500 mx-auto mb-2" />
              <div className="text-3xl font-bold">{levelNames[level - 1] || 'مبتدئ'}</div>
              <div className="text-sm text-muted-foreground">المستوى {level}</div>
            </CardContent>
          </Card>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <Card>
            <CardContent className="p-4 text-center">
              <Award className="w-8 h-8 text-blue-500 mx-auto mb-2" />
              <div className="text-3xl font-bold">{userBadges?.length || 0}</div>
              <div className="text-sm text-muted-foreground">الشارات المكتسبة</div>
            </CardContent>
          </Card>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          <Card>
            <CardContent className="p-4 text-center">
              <Flame className="w-8 h-8 text-orange-500 mx-auto mb-2" />
              <div className="text-3xl font-bold">{userPoints?.streak_days || 0}</div>
              <div className="text-sm text-muted-foreground">أيام متتالية</div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Level Progress */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-3">
            <span className="font-semibold">التقدم للمستوى التالي</span>
            <span className="text-sm text-muted-foreground">{points} / {nextThreshold} نقطة</span>
          </div>
          <Progress value={Math.min(progressToNext, 100)} className="h-3" />
          <div className="flex justify-between mt-2 text-xs text-muted-foreground">
            <span>المستوى {level}: {levelNames[level - 1]}</span>
            <span>المستوى {level + 1}: {levelNames[level] || 'الأعلى'}</span>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="badges" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="badges" className="gap-2"><Award className="w-4 h-4" />الشارات</TabsTrigger>
          <TabsTrigger value="history" className="gap-2"><TrendingUp className="w-4 h-4" />سجل النقاط</TabsTrigger>
          <TabsTrigger value="leaderboard" className="gap-2"><Trophy className="w-4 h-4" />المتصدرون</TabsTrigger>
        </TabsList>

        <TabsContent value="badges">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <AnimatePresence>
              {allBadges?.map((badge, i) => {
                const earned = earnedBadgeIds.has(badge.id);
                const IconComp = iconMap[badge.icon] || Award;
                return (
                  <motion.div
                    key={badge.id}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: i * 0.05 }}
                  >
                    <Card className={`transition-all ${earned ? 'border-primary/50 shadow-md' : 'opacity-60 grayscale'}`}>
                      <CardContent className="p-4">
                        <div className="flex items-start gap-3">
                          <div
                            className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0"
                            style={{ backgroundColor: earned ? badge.color + '20' : '#f3f4f6' }}
                          >
                            <IconComp className="w-6 h-6" style={{ color: earned ? badge.color : '#9ca3af' }} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <h3 className="font-bold text-sm truncate">{badge.name_ar}</h3>
                              {earned && <Badge variant="default" className="text-[10px] px-1.5">مكتسبة</Badge>}
                            </div>
                            <p className="text-xs text-muted-foreground mb-2">{badge.description_ar}</p>
                            <div className="flex items-center gap-2">
                              <Badge variant="outline" className={`text-[10px] ${rarityColors[badge.rarity]}`}>
                                {rarityLabels[badge.rarity]}
                              </Badge>
                              <span className="text-[10px] text-muted-foreground">+{badge.points_reward} نقطة</span>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        </TabsContent>

        <TabsContent value="history">
          <Card>
            <CardContent className="p-4">
              {recentTransactions?.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Star className="w-12 h-12 mx-auto mb-3 opacity-30" />
                  <p>لا توجد معاملات نقاط بعد</p>
                  <p className="text-sm">ابدأ باستخدام النظام لكسب النقاط!</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {recentTransactions?.map((tx) => (
                    <div key={tx.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                      <div>
                        <p className="font-medium text-sm">{tx.action_description || tx.action_type}</p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(tx.created_at).toLocaleDateString('ar-EG')}
                        </p>
                      </div>
                      <Badge variant={tx.points > 0 ? 'default' : 'destructive'}>
                        {tx.points > 0 ? '+' : ''}{tx.points}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="leaderboard">
          <Card>
            <CardContent className="p-4">
              {leaderboard?.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Trophy className="w-12 h-12 mx-auto mb-3 opacity-30" />
                  <p>لوحة المتصدرين فارغة</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {leaderboard?.map((entry, i) => (
                    <div key={entry.id} className={`flex items-center gap-3 p-3 rounded-lg ${i < 3 ? 'bg-primary/5 border border-primary/20' : 'bg-muted/50'}`}>
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${i === 0 ? 'bg-yellow-400 text-yellow-900' : i === 1 ? 'bg-muted text-foreground' : i === 2 ? 'bg-orange-300 text-orange-800' : 'bg-muted text-muted-foreground'}`}>
                        {i + 1}
                      </div>
                      <div className="flex-1">
                        <p className="font-semibold text-sm">{entry.user_name || 'مستخدم'}</p>
                        <p className="text-xs text-muted-foreground">المستوى {entry.level} • {entry.badges_count} شارة</p>
                      </div>
                      <div className="text-left">
                        <span className="font-bold text-primary">{entry.total_points}</span>
                        <span className="text-xs text-muted-foreground mr-1">نقطة</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default GamificationDashboard;
