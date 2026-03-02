
-- Homepage sections management (admin CMS)
CREATE TABLE public.homepage_sections (
  id TEXT PRIMARY KEY, -- matches section key e.g. 'hero', 'stats', 'ads'
  title TEXT NOT NULL,
  title_en TEXT,
  description TEXT,
  is_visible BOOLEAN NOT NULL DEFAULT true,
  sort_order INTEGER NOT NULL DEFAULT 0,
  custom_content JSONB DEFAULT '{}',
  custom_styles JSONB DEFAULT '{}',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_by UUID
);

ALTER TABLE public.homepage_sections ENABLE ROW LEVEL SECURITY;

-- Everyone can read (needed to render homepage)
CREATE POLICY "Anyone can read homepage sections"
ON public.homepage_sections FOR SELECT
USING (true);

-- Only admins can modify
CREATE POLICY "Admins can manage homepage sections"
ON public.homepage_sections FOR ALL
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Seed default sections matching current Index.tsx order
INSERT INTO public.homepage_sections (id, title, title_en, sort_order, is_visible) VALUES
  ('header', 'الرأس والتنقل', 'Header & Navigation', 0, true),
  ('ticker', 'شريط الأخبار', 'News Ticker', 1, true),
  ('hero', 'القسم الرئيسي', 'Hero Section', 2, true),
  ('ads', 'الإعلانات', 'Homepage Ads', 3, true),
  ('partners', 'الشركاء الموثوقون', 'Trusted Partners', 4, true),
  ('stats', 'الإحصائيات', 'Statistics', 5, true),
  ('verify', 'التحقق من المستندات', 'Document Verification', 6, true),
  ('consultants', 'الاستشاريون المميزون', 'Featured Consultants', 7, true),
  ('initiative', 'المبادرة الوطنية', 'National Initiative', 8, true),
  ('features', 'المميزات', 'Features', 9, true),
  ('features-list', 'قائمة المميزات', 'Features List', 10, true),
  ('doc-ai', 'الذكاء الاصطناعي للمستندات', 'Document AI Showcase', 11, true),
  ('smart-agent', 'الوكيل الذكي', 'Smart Agent Showcase', 12, true),
  ('services', 'الخدمات', 'Services', 13, true),
  ('omaluna', 'أومالونا', 'Omaluna', 14, true),
  ('testimonials', 'آراء العملاء', 'Testimonials', 15, true),
  ('cta', 'دعوة للإجراء', 'Call to Action', 16, true),
  ('footer', 'التذييل', 'Footer', 17, true);

-- Homepage custom blocks (additional content admin can add)
CREATE TABLE public.homepage_custom_blocks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  block_type TEXT NOT NULL DEFAULT 'banner', -- 'banner', 'announcement', 'promo', 'html', 'image', 'video', 'partner_logo', 'external_link'
  title TEXT NOT NULL,
  title_en TEXT,
  content TEXT,
  content_en TEXT,
  media_url TEXT,
  link_url TEXT,
  link_text TEXT,
  background_color TEXT,
  text_color TEXT,
  position TEXT NOT NULL DEFAULT 'before_footer', -- 'top', 'after_hero', 'before_footer', 'custom'
  custom_position_after TEXT, -- section id to place after
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_visible BOOLEAN NOT NULL DEFAULT true,
  starts_at TIMESTAMPTZ,
  ends_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID
);

ALTER TABLE public.homepage_custom_blocks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read visible custom blocks"
ON public.homepage_custom_blocks FOR SELECT
USING (true);

CREATE POLICY "Admins can manage custom blocks"
ON public.homepage_custom_blocks FOR ALL
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Trigger for updated_at
CREATE TRIGGER update_homepage_sections_updated_at
BEFORE UPDATE ON public.homepage_sections
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_homepage_custom_blocks_updated_at
BEFORE UPDATE ON public.homepage_custom_blocks
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
