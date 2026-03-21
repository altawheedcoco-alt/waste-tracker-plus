
-- 1. جدول مشرفي القنوات
CREATE TABLE IF NOT EXISTS public.broadcast_channel_admins (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  channel_id uuid NOT NULL REFERENCES public.broadcast_channels(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  role text NOT NULL DEFAULT 'admin', -- 'owner' | 'admin' | 'moderator'
  added_by uuid,
  permissions jsonb DEFAULT '{"can_post": true, "can_edit": true, "can_delete": true, "can_manage_members": false}'::jsonb,
  created_at timestamptz DEFAULT now(),
  UNIQUE(channel_id, user_id)
);

ALTER TABLE public.broadcast_channel_admins ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Channel members can view admins" ON public.broadcast_channel_admins
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Channel owners manage admins" ON public.broadcast_channel_admins
  FOR ALL TO authenticated
  USING (
    channel_id IN (
      SELECT id FROM broadcast_channels 
      WHERE created_by = auth.uid()
    )
  )
  WITH CHECK (
    channel_id IN (
      SELECT id FROM broadcast_channels 
      WHERE created_by = auth.uid()
    )
  );

-- 2. جدول الإبلاغات
CREATE TABLE IF NOT EXISTS public.broadcast_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  channel_id uuid REFERENCES public.broadcast_channels(id) ON DELETE CASCADE,
  post_id uuid REFERENCES public.broadcast_posts(id) ON DELETE CASCADE,
  reporter_id uuid NOT NULL,
  reason text NOT NULL,
  details text,
  status text DEFAULT 'pending', -- pending, reviewed, resolved
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.broadcast_reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can create reports" ON public.broadcast_reports
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = reporter_id);

CREATE POLICY "Users view own reports" ON public.broadcast_reports
  FOR SELECT TO authenticated USING (auth.uid() = reporter_id);

-- 3. جدول المحظورين
CREATE TABLE IF NOT EXISTS public.broadcast_blocked_users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  channel_id uuid NOT NULL REFERENCES public.broadcast_channels(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  blocked_by uuid NOT NULL,
  reason text,
  created_at timestamptz DEFAULT now(),
  UNIQUE(channel_id, user_id)
);

ALTER TABLE public.broadcast_blocked_users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Channel owners manage blocks" ON public.broadcast_blocked_users
  FOR ALL TO authenticated
  USING (
    channel_id IN (
      SELECT id FROM broadcast_channels 
      WHERE created_by = auth.uid()
    )
  )
  WITH CHECK (
    channel_id IN (
      SELECT id FROM broadcast_channels 
      WHERE created_by = auth.uid()
    )
  );

-- 4. إضافة أعمدة إعدادات القناة
ALTER TABLE public.broadcast_channels
  ADD COLUMN IF NOT EXISTS allow_comments boolean DEFAULT true,
  ADD COLUMN IF NOT EXISTS allow_reactions boolean DEFAULT true,
  ADD COLUMN IF NOT EXISTS allowed_reactions text[] DEFAULT '{heart,thumbsup,laugh,fire,clap,flag}',
  ADD COLUMN IF NOT EXISTS invite_link text,
  ADD COLUMN IF NOT EXISTS admin_count integer DEFAULT 1,
  ADD COLUMN IF NOT EXISTS auto_approve_followers boolean DEFAULT true;

-- 5. جدول إشعارات المتابعين (كتم)
CREATE TABLE IF NOT EXISTS public.broadcast_notification_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  channel_id uuid NOT NULL REFERENCES public.broadcast_channels(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  is_muted boolean DEFAULT false,
  muted_until timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(channel_id, user_id)
);

ALTER TABLE public.broadcast_notification_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own notification settings" ON public.broadcast_notification_settings
  FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
