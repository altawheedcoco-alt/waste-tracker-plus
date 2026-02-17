
-- =============================================
-- منظومة المطبوعات الرسمية المؤمّنة (Secure Stationery System)
-- =============================================

-- Stationery template definitions (system-level + org-custom)
CREATE TABLE public.stationery_templates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  name_en TEXT,
  description TEXT,
  category TEXT NOT NULL DEFAULT 'letterhead', -- letterhead, certificate, invoice, permit
  template_type TEXT NOT NULL DEFAULT 'system', -- system (built-in) or custom (org-specific)
  organization_id UUID REFERENCES public.organizations(id),
  
  -- Design config
  theme_id TEXT DEFAULT 'corporate',
  header_layout TEXT DEFAULT 'centered', -- centered, left-aligned, split
  footer_layout TEXT DEFAULT 'standard',
  watermark_text TEXT, -- custom watermark text
  watermark_opacity NUMERIC DEFAULT 0.06,
  show_guilloche BOOLEAN DEFAULT true,
  guilloche_color TEXT DEFAULT '#16a34a',
  show_qr BOOLEAN DEFAULT true,
  show_barcode BOOLEAN DEFAULT true,
  show_serial_number BOOLEAN DEFAULT true,
  show_sha256 BOOLEAN DEFAULT true,
  border_style TEXT DEFAULT 'double', -- none, single, double, ornate
  accent_color TEXT DEFAULT '#1a365d',
  
  -- Layout fields
  header_fields JSONB DEFAULT '["org_name","org_logo","date","serial"]'::jsonb,
  footer_fields JSONB DEFAULT '["signatures","qr","barcode","verification_code"]'::jsonb,
  
  preview_image_url TEXT,
  is_active BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.stationery_templates ENABLE ROW LEVEL SECURITY;

-- System templates visible to all, custom templates visible to org
CREATE POLICY "System templates visible to all authenticated"
  ON public.stationery_templates FOR SELECT
  USING (template_type = 'system' OR organization_id IN (
    SELECT organization_id FROM public.profiles WHERE id = auth.uid()
  ));

CREATE POLICY "Org admins can manage custom templates"
  ON public.stationery_templates FOR ALL
  USING (template_type = 'custom' AND organization_id IN (
    SELECT organization_id FROM public.profiles WHERE id = auth.uid()
  ));

-- Stationery subscription plans
CREATE TABLE public.stationery_plans (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  name_en TEXT,
  description TEXT,
  plan_tier TEXT NOT NULL DEFAULT 'basic', -- free, basic, professional, enterprise
  price_monthly NUMERIC NOT NULL DEFAULT 0,
  price_yearly NUMERIC,
  currency TEXT DEFAULT 'EGP',
  
  -- Limits
  monthly_prints_limit INTEGER DEFAULT 50,
  templates_access TEXT DEFAULT 'basic', -- basic (3), professional (all), enterprise (all+custom)
  custom_templates_limit INTEGER DEFAULT 0,
  watermark_customization BOOLEAN DEFAULT false,
  guilloche_enabled BOOLEAN DEFAULT false,
  sha256_enabled BOOLEAN DEFAULT false,
  priority_support BOOLEAN DEFAULT false,
  white_label BOOLEAN DEFAULT false, -- remove iRecycle branding
  
  features JSONB DEFAULT '[]'::jsonb,
  is_active BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.stationery_plans ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Plans visible to all" ON public.stationery_plans FOR SELECT USING (true);

-- Org subscriptions to stationery plans
CREATE TABLE public.stationery_subscriptions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES public.organizations(id),
  plan_id UUID NOT NULL REFERENCES public.stationery_plans(id),
  status TEXT NOT NULL DEFAULT 'active', -- active, expired, cancelled
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ,
  prints_used_this_month INTEGER DEFAULT 0,
  month_reset_at TIMESTAMPTZ DEFAULT (date_trunc('month', now()) + interval '1 month'),
  payment_reference TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.stationery_subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Org members view own subscriptions"
  ON public.stationery_subscriptions FOR SELECT
  USING (organization_id IN (
    SELECT organization_id FROM public.profiles WHERE id = auth.uid()
  ));

CREATE POLICY "Org members manage own subscriptions"
  ON public.stationery_subscriptions FOR ALL
  USING (organization_id IN (
    SELECT organization_id FROM public.profiles WHERE id = auth.uid()
  ));

-- Print usage log (each printed page)
CREATE TABLE public.stationery_print_log (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES public.organizations(id),
  user_id UUID NOT NULL,
  template_id UUID REFERENCES public.stationery_templates(id),
  subscription_id UUID REFERENCES public.stationery_subscriptions(id),
  
  document_title TEXT,
  serial_number TEXT NOT NULL,
  verification_code TEXT NOT NULL,
  sha256_hash TEXT,
  
  action_type TEXT DEFAULT 'print', -- print, pdf_export
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.stationery_print_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Org members view own print logs"
  ON public.stationery_print_log FOR SELECT
  USING (organization_id IN (
    SELECT organization_id FROM public.profiles WHERE id = auth.uid()
  ));

CREATE POLICY "Org members insert print logs"
  ON public.stationery_print_log FOR INSERT
  WITH CHECK (organization_id IN (
    SELECT organization_id FROM public.profiles WHERE id = auth.uid()
  ));

-- Insert default plans
INSERT INTO public.stationery_plans (name, name_en, description, plan_tier, price_monthly, price_yearly, monthly_prints_limit, templates_access, custom_templates_limit, watermark_customization, guilloche_enabled, sha256_enabled, priority_support, white_label, sort_order, features) VALUES
(
  'مجاني', 'Free', 'باقة تجريبية مع قوالب أساسية',
  'free', 0, 0, 20, 'basic', 0, false, false, false, false, false, 1,
  '["3 قوالب أساسية","20 طبعة/شهر","علامة مائية iRecycle","رمز QR للتحقق"]'::jsonb
),
(
  'أساسي', 'Basic', 'للجهات الصغيرة — قوالب متعددة مع علامة مائية',
  'basic', 149, 1490, 100, 'basic', 1, true, false, true, false, false, 2,
  '["6 قوالب احترافية","100 طبعة/شهر","علامة مائية مخصصة بالشعار","QR + باركود","بصمة SHA-256","قالب مخصص واحد"]'::jsonb
),
(
  'احترافي', 'Professional', 'للجهات المتوسطة — كل القوالب + نقوش أمنية',
  'professional', 399, 3990, 500, 'professional', 5, true, true, true, true, false, 3,
  '["جميع القوالب (16+)","500 طبعة/شهر","نقوش أمنية Guilloche","علامة مائية مخصصة","5 قوالب مخصصة","دعم فني أولوية","تقارير استخدام مفصلة"]'::jsonb
),
(
  'مؤسسي VIP', 'Enterprise VIP', 'للجهات الكبيرة — تخصيص كامل بدون حدود',
  'enterprise', 999, 9990, -1, 'enterprise', -1, true, true, true, true, true, 4,
  '["طبعات غير محدودة","قوالب مخصصة غير محدودة","إزالة علامة iRecycle","تصميم مخصص حسب الطلب","API للربط المباشر","مدير حساب مخصص","تقارير تحليلية متقدمة"]'::jsonb
);

-- Insert default system templates
INSERT INTO public.stationery_templates (name, name_en, description, category, template_type, theme_id, header_layout, watermark_text, show_guilloche, guilloche_color, accent_color, border_style, sort_order) VALUES
('ورق رسمي كلاسيكي', 'Classic Letterhead', 'ورقة رسمية بإطار مزدوج وتروسية كاملة', 'letterhead', 'system', 'corporate', 'centered', 'وثيقة رسمية', true, '#1a365d', '#1a365d', 'double', 1),
('ورق رسمي عصري', 'Modern Letterhead', 'تصميم عصري بخطوط نظيفة وألوان حيوية', 'letterhead', 'system', 'modern', 'split', 'OFFICIAL', false, '#6366f1', '#6366f1', 'single', 2),
('ورق رسمي بيئي', 'Eco Letterhead', 'تصميم صديق للبيئة بألوان خضراء طبيعية', 'letterhead', 'system', 'eco', 'centered', '♻️ وثيقة بيئية', true, '#16a34a', '#166534', 'single', 3),
('ورق رسمي ملكي', 'Royal Letterhead', 'تصميم فاخر بزخارف ذهبية وأرجوانية', 'letterhead', 'system', 'royal', 'centered', '👑 وثيقة رسمية', true, '#a855f7', '#581c87', 'ornate', 4),
('ورق رسمي صناعي', 'Industrial Letterhead', 'مخصص للمصانع والمنشآت الصناعية', 'letterhead', 'system', 'industrial', 'left-aligned', 'INDUSTRIAL', false, '#f59e0b', '#374151', 'single', 5),
('ورق رسمي محيطي', 'Ocean Letterhead', 'تدرجات زرقاء هادئة للمراسلات الرسمية', 'letterhead', 'system', 'ocean', 'centered', 'مستند مؤمّن', true, '#0ea5e9', '#0c4a6e', 'double', 6),
('شهادة فاخرة ذهبية', 'Gold Certificate', 'شهادة رسمية بإطار ذهبي مزخرف', 'certificate', 'system', 'elegant', 'centered', '🏅 شهادة رسمية', true, '#c9a84c', '#7c5e2c', 'ornate', 7),
('شهادة بيئية خضراء', 'Green Certificate', 'شهادة تدوير أو امتثال بيئي', 'certificate', 'system', 'eco', 'centered', '♻️ شهادة بيئية', true, '#22c55e', '#166534', 'double', 8),
('إيصال مؤمّن', 'Secured Receipt', 'إيصال مالي بتشفير وباركود', 'invoice', 'system', 'corporate', 'split', 'إيصال مالي', false, '#1a365d', '#1a365d', 'single', 9),
('تصريح رسمي', 'Official Permit', 'نموذج تصريح خروج/نقل/دخول', 'permit', 'system', 'industrial', 'left-aligned', '⚠️ تصريح رسمي', true, '#f59e0b', '#374151', 'double', 10);
