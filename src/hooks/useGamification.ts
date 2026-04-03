import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface AchievementDef {
  id: string;
  key: string;
  title_ar: string;
  title_en: string | null;
  description_ar: string | null;
  icon: string;
  category: string;
  tier: string;
  condition_type: string;
  condition_value: number;
  points_reward: number;
}

export interface UserAchievement {
  id: string;
  achievement_id: string;
  earned_at: string;
  seen: boolean;
  achievement?: AchievementDef;
}

export interface UserGamification {
  id: string;
  user_id: string;
  total_points: number;
  current_level: number;
  level_name: string;
  xp_current: number;
  xp_next_level: number;
  total_shipments: number;
  total_tons: number;
  streak_days: number;
  longest_streak: number;
  last_activity_at: string | null;
}

const LEVEL_THRESHOLDS = [
  { level: 1, name: 'برونزي', xp: 0, nameEn: 'Bronze' },
  { level: 2, name: 'برونزي II', xp: 100, nameEn: 'Bronze II' },
  { level: 3, name: 'فضي', xp: 300, nameEn: 'Silver' },
  { level: 4, name: 'فضي II', xp: 600, nameEn: 'Silver II' },
  { level: 5, name: 'ذهبي', xp: 1000, nameEn: 'Gold' },
  { level: 6, name: 'ذهبي II', xp: 1500, nameEn: 'Gold II' },
  { level: 7, name: 'بلاتيني', xp: 2500, nameEn: 'Platinum' },
  { level: 8, name: 'بلاتيني II', xp: 4000, nameEn: 'Platinum II' },
  { level: 9, name: 'ماسي', xp: 6000, nameEn: 'Diamond' },
  { level: 10, name: 'أسطوري', xp: 10000, nameEn: 'Legendary' },
];

export const getLevelInfo = (xp: number) => {
  let current = LEVEL_THRESHOLDS[0];
  let next = LEVEL_THRESHOLDS[1];
  for (let i = LEVEL_THRESHOLDS.length - 1; i >= 0; i--) {
    if (xp >= LEVEL_THRESHOLDS[i].xp) {
      current = LEVEL_THRESHOLDS[i];
      next = LEVEL_THRESHOLDS[i + 1] || { ...current, xp: current.xp + 5000 };
      break;
    }
  }
  const progress = next ? ((xp - current.xp) / (next.xp - current.xp)) * 100 : 100;
  return { current, next, progress: Math.min(progress, 100) };
};

export const getTierColor = (tier: string) => {
  switch (tier) {
    case 'bronze': return 'text-orange-600 bg-orange-100 dark:bg-orange-900/30';
    case 'silver': return 'text-slate-500 bg-slate-100 dark:bg-slate-800/50';
    case 'gold': return 'text-yellow-600 bg-yellow-100 dark:bg-yellow-900/30';
    case 'platinum': return 'text-purple-600 bg-purple-100 dark:bg-purple-900/30';
    default: return 'text-muted-foreground bg-muted';
  }
};

export function useGamification() {
  const { user, organization } = useAuth();
  const queryClient = useQueryClient();

  const { data: gamification, isLoading: loadingGamification } = useQuery({
    queryKey: ['user-gamification', user?.id],
    enabled: !!user?.id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('user_gamification' as any)
        .select('*')
        .eq('user_id', user!.id)
        .maybeSingle();
      if (error) throw error;
      if (!data) {
        // Auto-create
        const { data: created, error: createErr } = await supabase
          .from('user_gamification' as any)
          .insert({ user_id: user!.id, organization_id: organization?.id } as any)
          .select()
          .single();
        if (createErr) throw createErr;
        return created as unknown as UserGamification;
      }
      return data as unknown as UserGamification;
    },
  });

  const { data: allAchievements = [] } = useQuery({
    queryKey: ['achievement-definitions'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('achievement_definitions' as any)
        .select('*')
        .eq('is_active', true)
        .order('sort_order');
      if (error) throw error;
      return (data || []) as unknown as AchievementDef[];
    },
  });

  const { data: userAchievements = [], isLoading: loadingAchievements } = useQuery({
    queryKey: ['user-achievements', user?.id],
    enabled: !!user?.id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('user_achievements' as any)
        .select('*')
        .eq('user_id', user!.id);
      if (error) throw error;
      return (data || []) as unknown as UserAchievement[];
    },
  });

  const earnedIds = new Set(userAchievements.map(a => a.achievement_id));

  const achievementsWithStatus = allAchievements.map(def => ({
    ...def,
    earned: earnedIds.has(def.id),
    earnedAt: userAchievements.find(a => a.achievement_id === def.id)?.earned_at,
  }));

  const unlockedCount = userAchievements.length;
  const totalCount = allAchievements.length;
  const levelInfo = getLevelInfo(gamification?.xp_current || 0);

  const unseenCount = userAchievements.filter(a => !a.seen).length;

  return {
    gamification,
    achievements: achievementsWithStatus,
    userAchievements,
    unlockedCount,
    totalCount,
    levelInfo,
    unseenCount,
    isLoading: loadingGamification || loadingAchievements,
    LEVEL_THRESHOLDS,
  };
}
