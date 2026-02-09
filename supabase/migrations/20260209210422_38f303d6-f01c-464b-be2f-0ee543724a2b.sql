
-- Create platform settings table for admin-controlled feature flags
CREATE TABLE public.platform_settings (
  id TEXT PRIMARY KEY,
  value JSONB NOT NULL DEFAULT '{}',
  description TEXT,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_by UUID REFERENCES auth.users(id)
);

ALTER TABLE public.platform_settings ENABLE ROW LEVEL SECURITY;

-- Everyone can read settings
CREATE POLICY "Anyone can read platform settings"
  ON public.platform_settings FOR SELECT
  USING (true);

-- Only admins can update (enforced via edge function, but also RLS)
CREATE POLICY "Admins can update platform settings"
  ON public.platform_settings FOR UPDATE
  USING (
    EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Admins can insert platform settings"
  ON public.platform_settings FOR INSERT
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin')
  );

-- Insert default: AI assistant enabled
INSERT INTO public.platform_settings (id, value, description)
VALUES ('ai_assistant_enabled', '{"enabled": true}', 'التحكم في تفعيل/إيقاف المساعد الذكي للعمليات');
