
-- جدول منشورات المنصة
CREATE TABLE public.platform_posts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  excerpt TEXT,
  content TEXT NOT NULL,
  cover_image_url TEXT,
  category TEXT NOT NULL DEFAULT 'عام',
  author_name TEXT NOT NULL DEFAULT 'فريق المنصة',
  badge TEXT DEFAULT 'جديد',
  is_published BOOLEAN NOT NULL DEFAULT false,
  is_featured BOOLEAN NOT NULL DEFAULT false,
  published_at TIMESTAMPTZ,
  sort_order INTEGER NOT NULL DEFAULT 0,
  views_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.platform_posts ENABLE ROW LEVEL SECURITY;

-- سياسة القراءة العامة للمنشورات المنشورة
CREATE POLICY "Anyone can read published posts"
  ON public.platform_posts
  FOR SELECT
  USING (is_published = true);

-- سياسة إدارة كاملة للمستخدمين المسجلين (المدير سيتحكم من الواجهة)
CREATE POLICY "Authenticated users can manage posts"
  ON public.platform_posts
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- إضافة عمود published_at لجدول platform_news إن لم يكن موجوداً (للجدولة اليدوية)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'platform_news' AND column_name = 'scheduled_at'
  ) THEN
    ALTER TABLE public.platform_news ADD COLUMN scheduled_at TIMESTAMPTZ;
  END IF;
END $$;
