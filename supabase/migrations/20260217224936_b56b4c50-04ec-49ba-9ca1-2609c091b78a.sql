
-- =============================================
-- منظومة الإعلانات والدخل - Advertising & Revenue System
-- =============================================

-- خطط الإعلانات
CREATE TABLE public.ad_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name_ar TEXT NOT NULL,
  name_en TEXT,
  description_ar TEXT,
  description_en TEXT,
  plan_type TEXT NOT NULL DEFAULT 'banner', -- banner, featured, spotlight, premium
  duration_days INTEGER NOT NULL DEFAULT 30,
  price_egp NUMERIC(10,2) NOT NULL DEFAULT 0,
  max_media_count INTEGER NOT NULL DEFAULT 3,
  allows_video BOOLEAN DEFAULT false,
  allows_links BOOLEAN DEFAULT true,
  homepage_placement BOOLEAN DEFAULT false,
  priority_order INTEGER DEFAULT 0, -- higher = more visible
  impressions_limit INTEGER, -- null = unlimited
  is_active BOOLEAN DEFAULT true,
  features JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- الإعلانات
CREATE TABLE public.advertisements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  advertiser_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  advertiser_organization_id UUID REFERENCES public.organizations(id) ON DELETE SET NULL,
  ad_plan_id UUID REFERENCES public.ad_plans(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  subtitle TEXT,
  description TEXT,
  -- وسائط
  media_urls TEXT[] DEFAULT '{}',
  media_types TEXT[] DEFAULT '{}', -- image, video
  video_url TEXT,
  external_link TEXT,
  cta_text TEXT DEFAULT 'تعرف أكثر',
  cta_link TEXT,
  -- حالة
  status TEXT NOT NULL DEFAULT 'draft', -- draft, pending_review, pending_payment, active, paused, expired, rejected
  rejection_reason TEXT,
  -- مدة
  starts_at TIMESTAMPTZ,
  ends_at TIMESTAMPTZ,
  -- إحصائيات
  impressions_count INTEGER DEFAULT 0,
  clicks_count INTEGER DEFAULT 0,
  -- دفع
  payment_status TEXT DEFAULT 'unpaid', -- unpaid, paid, refunded
  payment_transaction_id UUID,
  amount_paid NUMERIC(10,2) DEFAULT 0,
  -- موافقة
  reviewed_by UUID,
  reviewed_at TIMESTAMPTZ,
  admin_notes TEXT,
  -- تصنيف
  category TEXT, -- waste_management, recycling, transport, equipment, services, general
  target_audience TEXT[] DEFAULT '{}', -- generator, transporter, recycler, disposal, all
  tags TEXT[] DEFAULT '{}',
  -- تخصيص المظهر
  background_color TEXT,
  text_color TEXT,
  badge_text TEXT,
  is_featured BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- تتبع الانطباعات والنقرات
CREATE TABLE public.ad_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  advertisement_id UUID REFERENCES public.advertisements(id) ON DELETE CASCADE NOT NULL,
  event_type TEXT NOT NULL, -- impression, click, conversion
  viewer_user_id UUID,
  viewer_ip TEXT,
  viewer_device TEXT,
  page_location TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- خصومات وكوبونات للإعلانات
CREATE TABLE public.ad_coupons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE,
  discount_percent INTEGER CHECK (discount_percent BETWEEN 1 AND 100),
  discount_amount NUMERIC(10,2),
  max_uses INTEGER DEFAULT 1,
  current_uses INTEGER DEFAULT 0,
  valid_from TIMESTAMPTZ DEFAULT now(),
  valid_until TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- مصادر دخل إضافية
CREATE TABLE public.revenue_services (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  service_name_ar TEXT NOT NULL,
  service_name_en TEXT,
  service_type TEXT NOT NULL, -- verified_badge, priority_listing, analytics_report, featured_profile, sponsored_search
  description_ar TEXT,
  price_egp NUMERIC(10,2) NOT NULL DEFAULT 0,
  duration_days INTEGER DEFAULT 30,
  is_active BOOLEAN DEFAULT true,
  icon TEXT DEFAULT 'star',
  features JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- اشتراكات خدمات الدخل
CREATE TABLE public.revenue_service_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  service_id UUID REFERENCES public.revenue_services(id) ON DELETE CASCADE NOT NULL,
  status TEXT DEFAULT 'pending', -- pending, active, expired, cancelled
  starts_at TIMESTAMPTZ,
  ends_at TIMESTAMPTZ,
  payment_status TEXT DEFAULT 'unpaid',
  amount_paid NUMERIC(10,2) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.ad_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.advertisements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ad_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ad_coupons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.revenue_services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.revenue_service_subscriptions ENABLE ROW LEVEL SECURITY;

-- ad_plans: everyone reads, admin manages
CREATE POLICY "Anyone can view active ad plans" ON public.ad_plans FOR SELECT USING (is_active = true);
CREATE POLICY "Admin manages ad plans" ON public.ad_plans FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- advertisements: owner manages own, public sees active
CREATE POLICY "Anyone can view active ads" ON public.advertisements FOR SELECT USING (status = 'active');
CREATE POLICY "Owner can manage own ads" ON public.advertisements FOR ALL USING (auth.uid() = advertiser_user_id);
CREATE POLICY "Admin manages all ads" ON public.advertisements FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- ad_analytics: insert anyone, read owner/admin
CREATE POLICY "Anyone can insert analytics" ON public.ad_analytics FOR INSERT WITH CHECK (true);
CREATE POLICY "Admin reads analytics" ON public.ad_analytics FOR SELECT USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Ad owner reads analytics" ON public.ad_analytics FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.advertisements WHERE id = advertisement_id AND advertiser_user_id = auth.uid())
);

-- ad_coupons: admin only
CREATE POLICY "Admin manages coupons" ON public.ad_coupons FOR ALL USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Authenticated can view active coupons" ON public.ad_coupons FOR SELECT TO authenticated USING (is_active = true);

-- revenue_services: public read
CREATE POLICY "Anyone can view active services" ON public.revenue_services FOR SELECT USING (is_active = true);
CREATE POLICY "Admin manages revenue services" ON public.revenue_services FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- revenue_service_subscriptions
CREATE POLICY "User views own subscriptions" ON public.revenue_service_subscriptions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "User creates own subscriptions" ON public.revenue_service_subscriptions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admin manages all subscriptions" ON public.revenue_service_subscriptions FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- Insert default ad plans
INSERT INTO public.ad_plans (name_ar, name_en, plan_type, duration_days, price_egp, max_media_count, allows_video, homepage_placement, priority_order, features) VALUES
('الباقة الأساسية', 'Basic Plan', 'banner', 7, 199, 1, false, false, 1, '["إعلان نصي + صورة واحدة", "عرض في صفحة الإعلانات", "إحصائيات أساسية"]'),
('الباقة المتقدمة', 'Standard Plan', 'featured', 30, 599, 3, false, false, 2, '["حتى 3 صور", "رابط خارجي", "إحصائيات تفصيلية", "أولوية في العرض"]'),
('الباقة الممتازة', 'Premium Plan', 'spotlight', 30, 1499, 5, true, true, 3, '["حتى 5 صور + فيديو", "عرض على الصفحة الرئيسية", "رابط خارجي", "شارة مميزة", "إحصائيات كاملة", "أولوية قصوى"]'),
('الباقة الذهبية', 'Gold VIP Plan', 'premium', 90, 3999, 10, true, true, 4, '["حتى 10 صور + فيديو", "بانر الصفحة الرئيسية", "عرض دائم في كل الصفحات", "تقارير تحليلية أسبوعية", "دعم مخصص", "شارة ذهبية VIP"]');

-- Insert default revenue services
INSERT INTO public.revenue_services (service_name_ar, service_name_en, service_type, description_ar, price_egp, duration_days, icon, features) VALUES
('شارة التحقق', 'Verified Badge', 'verified_badge', 'شارة زرقاء تثبت مصداقية منشأتك وتزيد ثقة العملاء', 299, 365, 'badge-check', '["شارة تحقق زرقاء", "أولوية في نتائج البحث", "ثقة أعلى من العملاء"]'),
('الظهور المميز', 'Priority Listing', 'priority_listing', 'اجعل منشأتك تظهر أولاً في نتائج البحث والشركاء', 499, 30, 'arrow-up-circle', '["أول نتيجة في البحث", "إطار مميز في القوائم", "زيادة الظهور 5x"]'),
('تقارير تحليلية', 'Analytics Report', 'analytics_report', 'تقارير تفصيلية عن أداء منشأتك وتحليل السوق', 799, 30, 'bar-chart-3', '["تقرير أسبوعي PDF", "تحليل المنافسين", "توقعات السوق", "توصيات AI"]'),
('الملف الذهبي', 'Featured Profile', 'featured_profile', 'ملف تعريفي مميز بتصميم احترافي وشارات متعددة', 999, 90, 'crown', '["تصميم ملف احترافي", "شارة ذهبية", "معرض صور موسع", "فيديو تعريفي"]'),
('الإعلان في البحث', 'Sponsored Search', 'sponsored_search', 'ظهور مدفوع أعلى نتائج البحث عن الشركاء', 399, 30, 'search', '["إعلان أعلى نتائج البحث", "استهداف حسب النوع", "إحصائيات النقرات"]');

-- Enable realtime for advertisements
ALTER PUBLICATION supabase_realtime ADD TABLE public.advertisements;
