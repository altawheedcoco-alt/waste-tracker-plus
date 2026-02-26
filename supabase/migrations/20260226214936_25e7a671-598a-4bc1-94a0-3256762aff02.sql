
-- Create platform news table
CREATE TABLE public.platform_news (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'عام',
  badge TEXT DEFAULT 'جديد',
  icon_name TEXT DEFAULT 'Newspaper',
  color_gradient TEXT DEFAULT 'from-primary to-primary/80',
  link TEXT DEFAULT '/',
  is_published BOOLEAN NOT NULL DEFAULT false,
  is_featured BOOLEAN NOT NULL DEFAULT false,
  published_at TIMESTAMP WITH TIME ZONE,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  sort_order INTEGER DEFAULT 0
);

-- Enable RLS
ALTER TABLE public.platform_news ENABLE ROW LEVEL SECURITY;

-- Everyone can read published news
CREATE POLICY "Anyone can read published news"
  ON public.platform_news FOR SELECT
  USING (is_published = true);

-- Admins can manage news using has_role RPC
CREATE POLICY "Admins can insert news"
  ON public.platform_news FOR INSERT
  WITH CHECK (
    public.has_role(auth.uid(), 'admin')
  );

CREATE POLICY "Admins can update news"
  ON public.platform_news FOR UPDATE
  USING (
    public.has_role(auth.uid(), 'admin')
  );

CREATE POLICY "Admins can delete news"
  ON public.platform_news FOR DELETE
  USING (
    public.has_role(auth.uid(), 'admin')
  );

-- Admins can read all news (including unpublished)
CREATE POLICY "Admins can read all news"
  ON public.platform_news FOR SELECT
  USING (
    public.has_role(auth.uid(), 'admin')
  );

-- Trigger for updated_at
CREATE TRIGGER update_platform_news_updated_at
  BEFORE UPDATE ON public.platform_news
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Seed existing hardcoded news
INSERT INTO public.platform_news (title, description, category, badge, icon_name, color_gradient, link, is_published, is_featured, published_at, sort_order) VALUES
('منصة عُمالنا للتوظيف المتكامل', 'نظام توظيف متكامل — عرض وطلب في مكان واحد. سجّل كباحث عن عمل أو انشر وظيفة لاستقطاب الكفاءات في قطاع المخلفات والتدوير.', 'توظيف', 'جديد 🔥', 'Users', 'from-blue-500 to-cyan-500', '/dashboard/omaluna', true, true, now(), 1),
('دليل الاستشاريين البيئيين وجهات منح الأيزو', 'دليل معتمد للمستشارين البيئيين ومكاتب الاستشارات وجهات منح شهادات الأيزو — كل الخبراء في مكان واحد.', 'استشارات', 'جديد', 'Award', 'from-amber-500 to-orange-500', '/auth?mode=register&type=consultant', true, false, now(), 2),
('نظام الإعلانات المدفوعة', 'وصّل خدماتك ومنتجاتك لآلاف العاملين في قطاع المخلفات والتدوير عبر إعلانات مستهدفة وفعالة.', 'تسويق', 'جديد', 'Megaphone', 'from-purple-500 to-violet-500', '/dashboard/ads', true, false, now(), 3),
('التحقق الرقمي من المستندات', 'تحقق فوري من صحة شهادات التخلص الآمن ونماذج تتبع المخلفات عبر رمز التتبع أو QR.', 'تحقق', 'محدّث', 'ShieldCheck', 'from-emerald-500 to-green-500', '/verify', true, false, now(), 4),
('نظام إدارة وتتبع النفايات', 'حل برمجي متكامل لإدارة وتتبع النفايات من التوليد إلى التخلص الآمن.', 'إدارة نفايات', 'أساسي', 'Recycle', 'from-green-500 to-teal-500', '/auth', true, false, now(), 5),
('تتبع السائقين والمركبات GPS', 'تتبع فوري لحركة السائقين والمركبات مع إشعارات ذكية.', 'نقل', 'محدّث', 'Truck', 'from-indigo-500 to-blue-500', '/dashboard/driver-tracking', true, false, now(), 6),
('تقارير وتحليلات متقدمة', 'تقارير شاملة وتحليلات بصرية للبيانات — اتخذ قرارات أذكى.', 'تقارير', 'محدّث', 'BarChart3', 'from-rose-500 to-pink-500', '/dashboard/reports', true, false, now(), 7),
('إصدار الشهادات ونماذج التتبع', 'إصدار تلقائي لنماذج تتبع المخلفات وشهادات التخلص الآمن.', 'شهادات', 'أساسي', 'FileCheck', 'from-teal-500 to-cyan-500', '/auth', true, false, now(), 8),
('الامتثال للمتطلبات البيئية', 'ضمان الامتثال الكامل للمتطلبات الحكومية والبيئية والدولية.', 'امتثال', 'هام', 'Globe', 'from-sky-500 to-blue-500', '/auth', true, false, now(), 9),
('أكاديمية التدريب والتأهيل', 'دورات تدريبية معتمدة في مجال إدارة المخلفات والسلامة البيئية.', 'تدريب', 'قريباً', 'BookOpen', 'from-orange-500 to-red-500', '/dashboard/academy', true, false, now(), 10);
