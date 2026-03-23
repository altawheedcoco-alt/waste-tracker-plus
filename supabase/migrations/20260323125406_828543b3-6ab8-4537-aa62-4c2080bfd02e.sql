
-- جدول تتبع مشاهدات المنشورات بالتفصيل
CREATE TABLE public.platform_post_views (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id uuid NOT NULL,
  visitor_id text NOT NULL,
  ip_address text,
  user_agent text,
  device_type text,
  browser text,
  os text,
  country text,
  referrer text,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX idx_post_views_post ON public.platform_post_views(post_id);
CREATE INDEX idx_post_views_visitor ON public.platform_post_views(visitor_id);
CREATE INDEX idx_post_views_ip ON public.platform_post_views(ip_address);
CREATE INDEX idx_post_views_date ON public.platform_post_views(created_at);

ALTER TABLE public.platform_post_views ENABLE ROW LEVEL SECURITY;

-- القراءة للجميع (المدير يحتاج يشوف)
CREATE POLICY "Anyone can read post views" ON public.platform_post_views
  FOR SELECT USING (true);

CREATE POLICY "Anyone can insert post views" ON public.platform_post_views
  FOR INSERT WITH CHECK (true);

-- تحديث دالة increment_post_views لتسجيل المشاهدة بالتفصيل
CREATE OR REPLACE FUNCTION public.track_post_view(
  p_post_id uuid,
  p_visitor_id text,
  p_ip_address text DEFAULT NULL,
  p_user_agent text DEFAULT NULL,
  p_device_type text DEFAULT NULL,
  p_browser text DEFAULT NULL,
  p_os text DEFAULT NULL,
  p_referrer text DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- تسجيل المشاهدة
  INSERT INTO platform_post_views (post_id, visitor_id, ip_address, user_agent, device_type, browser, os, referrer)
  VALUES (p_post_id, p_visitor_id, p_ip_address, p_user_agent, p_device_type, p_browser, p_os, p_referrer);
  
  -- تحديث عداد المشاهدات
  UPDATE platform_posts SET views_count = COALESCE(views_count, 0) + 1 WHERE id = p_post_id;
END;
$$;
