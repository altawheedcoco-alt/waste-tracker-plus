
-- Create blog posts table
CREATE TABLE public.blog_posts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  title_en TEXT,
  slug TEXT NOT NULL UNIQUE,
  excerpt TEXT NOT NULL,
  excerpt_en TEXT,
  content TEXT NOT NULL,
  content_en TEXT,
  category TEXT NOT NULL DEFAULT 'عام',
  category_en TEXT DEFAULT 'General',
  tags TEXT[] DEFAULT '{}',
  cover_image_url TEXT,
  cover_gradient TEXT DEFAULT 'from-primary to-primary/80',
  template_style TEXT NOT NULL DEFAULT 'standard',
  is_published BOOLEAN NOT NULL DEFAULT false,
  is_featured BOOLEAN NOT NULL DEFAULT false,
  published_at TIMESTAMP WITH TIME ZONE,
  reading_time_minutes INTEGER DEFAULT 3,
  views_count INTEGER DEFAULT 0,
  author_name TEXT DEFAULT 'فريق iRecycle',
  author_avatar_url TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  sort_order INTEGER DEFAULT 0
);

-- Enable RLS
ALTER TABLE public.blog_posts ENABLE ROW LEVEL SECURITY;

-- Everyone can read published posts
CREATE POLICY "Anyone can read published blog posts"
  ON public.blog_posts FOR SELECT
  USING (is_published = true);

-- Admins can manage
CREATE POLICY "Admins can insert blog posts"
  ON public.blog_posts FOR INSERT
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update blog posts"
  ON public.blog_posts FOR UPDATE
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete blog posts"
  ON public.blog_posts FOR DELETE
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can read all blog posts"
  ON public.blog_posts FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

-- Updated at trigger
CREATE TRIGGER update_blog_posts_updated_at
  BEFORE UPDATE ON public.blog_posts
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create index on slug for fast lookup
CREATE INDEX idx_blog_posts_slug ON public.blog_posts(slug);
CREATE INDEX idx_blog_posts_published ON public.blog_posts(is_published, sort_order);

-- Seed existing articles
INSERT INTO public.blog_posts (title, title_en, slug, excerpt, excerpt_en, content, content_en, category, category_en, template_style, is_published, published_at, sort_order, cover_gradient) VALUES
('دليل تصنيف النفايات البلدية في مصر', 'Guide to Municipal Waste Classification in Egypt', 'municipal-waste-guide',
 'تعرف على التصنيفات الرسمية للنفايات البلدية طبقًا لقانون إدارة المخلفات رقم 202 لسنة 2020 وكيفية التعامل مع كل نوع.',
 'Learn about official municipal waste classifications under Waste Management Law 202/2020 and how to handle each type.',
 '## دليل تصنيف النفايات البلدية في مصر

تعتبر النفايات البلدية من أكثر أنواع النفايات شيوعًا في مصر. وفقًا لقانون إدارة المخلفات رقم 202 لسنة 2020، يتم تصنيف النفايات البلدية إلى عدة فئات رئيسية.

### أنواع النفايات البلدية
- **نفايات عضوية**: بقايا الطعام والمواد القابلة للتحلل
- **نفايات قابلة لإعادة التدوير**: الورق والبلاستيك والمعادن والزجاج
- **نفايات خطرة منزلية**: البطاريات والمبيدات والأدوية المنتهية

### كيفية التعامل السليم
1. فصل النفايات من المصدر
2. استخدام الحاويات الملونة المخصصة
3. التواصل مع الجهات المختصة للنفايات الخطرة',
 NULL, 'نفايات بلدية', 'Municipal Waste', 'standard', true, now(), 1, 'from-emerald-500 to-green-500'),

('المخلفات الطبية: مخاطرها وطرق التخلص الآمن', 'Medical Waste: Risks and Safe Disposal Methods', 'medical-waste-safety',
 'المخلفات الطبية من أخطر أنواع النفايات. نستعرض في هذا المقال الإرشادات المصرية والدولية للتعامل الآمن معها.',
 'Medical waste is among the most hazardous. This article covers Egyptian and international guidelines for safe handling.',
 '## المخلفات الطبية: مخاطرها وطرق التخلص الآمن

تمثل المخلفات الطبية تحديًا بيئيًا وصحيًا كبيرًا. تشمل هذه المخلفات الأدوات الحادة والأنسجة البيولوجية والمواد الكيميائية.

### أنواع المخلفات الطبية
- مخلفات معدية
- أدوات حادة (إبر، مشارط)
- مخلفات صيدلانية
- مخلفات كيميائية

### إرشادات التخلص الآمن
1. الفصل في حاويات مخصصة ملونة
2. المعالجة بالتعقيم أو الحرق
3. التوثيق والتتبع الكامل',
 NULL, 'نفايات طبية', 'Medical Waste', 'detailed', true, now(), 2, 'from-red-500 to-rose-500'),

('النفايات الإلكترونية: ثروة مهدرة في مصر', 'E-Waste: A Wasted Treasure in Egypt', 'ewaste-egypt',
 'مصر تنتج أكثر من 50 ألف طن نفايات إلكترونية سنويًا. كيف يمكن تحويلها من عبء بيئي إلى فرصة اقتصادية؟',
 'Egypt produces over 50,000 tons of e-waste annually. How can we turn this environmental burden into an economic opportunity?',
 '## النفايات الإلكترونية: ثروة مهدرة

تنتج مصر أكثر من 50 ألف طن من النفايات الإلكترونية سنويًا، وتشمل الهواتف والحواسيب والأجهزة المنزلية.

### لماذا هي ثروة؟
- تحتوي على معادن ثمينة (ذهب، فضة، نحاس)
- يمكن إعادة تدوير 95% من مكوناتها
- سوق عالمي متنامي

### التحديات
1. نقص البنية التحتية للتجميع
2. القطاع غير الرسمي يتعامل بطرق خطرة
3. غياب الوعي المجتمعي',
 NULL, 'نفايات إلكترونية', 'E-Waste', 'modern', true, now(), 3, 'from-amber-500 to-orange-500'),

('اقتصاد التدوير الدائري: مستقبل الصناعة المصرية', 'Circular Economy: The Future of Egyptian Industry', 'circular-economy-egypt',
 'كيف يمكن لمبادئ الاقتصاد الدائري أن تحول قطاع إدارة النفايات في مصر وتخلق آلاف فرص العمل الجديدة.',
 'How circular economy principles can transform Egypt''s waste management sector and create thousands of new jobs.',
 '## اقتصاد التدوير الدائري

الاقتصاد الدائري هو نموذج اقتصادي يهدف إلى تقليل النفايات وإعادة استخدام الموارد بأقصى كفاءة.

### مبادئ الاقتصاد الدائري
- تصميم المنتجات لإعادة الاستخدام
- تقليل النفايات من المصدر
- تحويل النفايات إلى موارد جديدة

### الفرص في مصر
1. خلق أكثر من 100 ألف فرصة عمل
2. توفير مليارات الجنيهات من المواد الخام
3. تحسين البيئة والصحة العامة',
 NULL, 'صناعة التدوير', 'Recycling Industry', 'standard', true, now(), 4, 'from-blue-500 to-indigo-500');
