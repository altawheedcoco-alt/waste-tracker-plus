
CREATE TABLE public.platform_tags (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  category text DEFAULT 'عام',
  usage_count integer DEFAULT 0,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.platform_tags ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read tags" ON public.platform_tags
  FOR SELECT USING (true);

CREATE POLICY "Only sovereign admin can manage tags" ON public.platform_tags
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.admin_sovereign_roles
      WHERE user_id = auth.uid() AND is_active = true
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.admin_sovereign_roles
      WHERE user_id = auth.uid() AND is_active = true
    )
  );
