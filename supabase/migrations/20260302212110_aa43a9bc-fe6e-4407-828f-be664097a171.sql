
-- Sidebar preferences for custom ordering and visibility per user
CREATE TABLE public.sidebar_preferences (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
  group_order TEXT[] DEFAULT '{}',
  hidden_groups TEXT[] DEFAULT '{}',
  collapsed_groups TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, organization_id)
);

ALTER TABLE public.sidebar_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own sidebar prefs"
  ON public.sidebar_preferences FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own sidebar prefs"
  ON public.sidebar_preferences FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own sidebar prefs"
  ON public.sidebar_preferences FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own sidebar prefs"
  ON public.sidebar_preferences FOR DELETE
  USING (auth.uid() = user_id);
