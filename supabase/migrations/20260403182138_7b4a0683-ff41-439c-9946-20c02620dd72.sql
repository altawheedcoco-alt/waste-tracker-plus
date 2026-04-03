
-- 1) جدول نقاط وتقدم المستخدم (Gamification)
CREATE TABLE public.user_gamification (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
  total_points INTEGER NOT NULL DEFAULT 0,
  current_level INTEGER NOT NULL DEFAULT 1,
  level_name TEXT NOT NULL DEFAULT 'برونزي',
  xp_current INTEGER NOT NULL DEFAULT 0,
  xp_next_level INTEGER NOT NULL DEFAULT 100,
  total_shipments INTEGER NOT NULL DEFAULT 0,
  total_tons NUMERIC(12,3) NOT NULL DEFAULT 0,
  streak_days INTEGER NOT NULL DEFAULT 0,
  longest_streak INTEGER NOT NULL DEFAULT 0,
  last_activity_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

-- 2) جدول الإنجازات المتاحة (تعريفات)
CREATE TABLE public.achievement_definitions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT NOT NULL UNIQUE,
  title_ar TEXT NOT NULL,
  title_en TEXT,
  description_ar TEXT,
  description_en TEXT,
  icon TEXT NOT NULL DEFAULT '🏆',
  category TEXT NOT NULL DEFAULT 'general',
  tier TEXT NOT NULL DEFAULT 'bronze',
  condition_type TEXT NOT NULL DEFAULT 'shipment_count',
  condition_value INTEGER NOT NULL DEFAULT 1,
  points_reward INTEGER NOT NULL DEFAULT 10,
  is_active BOOLEAN NOT NULL DEFAULT true,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3) جدول إنجازات المستخدم المكتسبة
CREATE TABLE public.user_achievements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  achievement_id UUID NOT NULL REFERENCES public.achievement_definitions(id) ON DELETE CASCADE,
  earned_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  seen BOOLEAN NOT NULL DEFAULT false,
  UNIQUE(user_id, achievement_id)
);

-- Enable RLS
ALTER TABLE public.user_gamification ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.achievement_definitions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_achievements ENABLE ROW LEVEL SECURITY;

-- RLS: user_gamification
CREATE POLICY "Users can view own gamification" ON public.user_gamification FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Users can update own gamification" ON public.user_gamification FOR UPDATE TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Users can insert own gamification" ON public.user_gamification FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());

-- RLS: achievement_definitions (public read)
CREATE POLICY "Anyone can view achievements" ON public.achievement_definitions FOR SELECT TO authenticated USING (true);

-- RLS: user_achievements
CREATE POLICY "Users can view own achievements" ON public.user_achievements FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Users can insert own achievements" ON public.user_achievements FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
