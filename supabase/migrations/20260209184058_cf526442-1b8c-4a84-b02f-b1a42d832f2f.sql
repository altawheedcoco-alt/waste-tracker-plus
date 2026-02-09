
-- ===== نظام Gamification =====

-- جدول نقاط المستخدمين
CREATE TABLE public.user_points (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  organization_id UUID REFERENCES public.organizations(id),
  total_points INTEGER NOT NULL DEFAULT 0,
  current_level INTEGER NOT NULL DEFAULT 1,
  level_name TEXT NOT NULL DEFAULT 'مبتدئ',
  points_this_month INTEGER NOT NULL DEFAULT 0,
  points_this_week INTEGER NOT NULL DEFAULT 0,
  streak_days INTEGER NOT NULL DEFAULT 0,
  longest_streak INTEGER NOT NULL DEFAULT 0,
  last_activity_date DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

-- جدول سجل النقاط
CREATE TABLE public.points_transactions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  organization_id UUID REFERENCES public.organizations(id),
  points INTEGER NOT NULL,
  action_type TEXT NOT NULL,
  action_description TEXT,
  reference_type TEXT,
  reference_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- جدول الشارات
CREATE TABLE public.badges (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  name_ar TEXT NOT NULL,
  description TEXT,
  description_ar TEXT,
  icon TEXT NOT NULL DEFAULT 'award',
  color TEXT NOT NULL DEFAULT '#FFD700',
  category TEXT NOT NULL DEFAULT 'general',
  requirement_type TEXT NOT NULL,
  requirement_value INTEGER NOT NULL DEFAULT 1,
  points_reward INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  rarity TEXT NOT NULL DEFAULT 'common',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- جدول شارات المستخدمين
CREATE TABLE public.user_badges (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  badge_id UUID NOT NULL REFERENCES public.badges(id) ON DELETE CASCADE,
  earned_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  is_featured BOOLEAN NOT NULL DEFAULT false,
  UNIQUE(user_id, badge_id)
);

-- جدول المتصدرين
CREATE TABLE public.leaderboard_cache (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  organization_id UUID REFERENCES public.organizations(id),
  user_name TEXT,
  rank INTEGER,
  total_points INTEGER NOT NULL DEFAULT 0,
  badges_count INTEGER NOT NULL DEFAULT 0,
  level INTEGER NOT NULL DEFAULT 1,
  period_type TEXT NOT NULL DEFAULT 'monthly',
  period_key TEXT NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ===== تكامل IoT =====

CREATE TABLE public.iot_devices (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES public.organizations(id),
  device_name TEXT NOT NULL,
  device_type TEXT NOT NULL,
  device_serial TEXT UNIQUE,
  protocol TEXT NOT NULL DEFAULT 'mqtt',
  location_name TEXT,
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,
  vehicle_id UUID,
  is_active BOOLEAN NOT NULL DEFAULT true,
  last_reading_at TIMESTAMPTZ,
  battery_level INTEGER,
  firmware_version TEXT,
  config JSON,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.iot_readings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  device_id UUID NOT NULL REFERENCES public.iot_devices(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES public.organizations(id),
  reading_type TEXT NOT NULL,
  value DOUBLE PRECISION NOT NULL,
  unit TEXT NOT NULL,
  metadata JSON,
  recorded_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  received_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.iot_alerts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  device_id UUID NOT NULL REFERENCES public.iot_devices(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES public.organizations(id),
  alert_type TEXT NOT NULL,
  severity TEXT NOT NULL DEFAULT 'warning',
  message TEXT NOT NULL,
  reading_id UUID REFERENCES public.iot_readings(id),
  is_acknowledged BOOLEAN NOT NULL DEFAULT false,
  acknowledged_by UUID,
  acknowledged_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ===== الفاتورة الإلكترونية المصرية =====

CREATE TABLE public.e_invoice_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) UNIQUE,
  tax_registration_number TEXT,
  branch_id TEXT,
  activity_code TEXT,
  client_id TEXT,
  client_secret_encrypted TEXT,
  environment TEXT NOT NULL DEFAULT 'preprod',
  is_active BOOLEAN NOT NULL DEFAULT false,
  last_sync_at TIMESTAMPTZ,
  token_expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.e_invoice_submissions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES public.organizations(id),
  invoice_id UUID REFERENCES public.invoices(id),
  submission_uuid TEXT,
  internal_id TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  eta_status TEXT,
  eta_response JSON,
  signed_document JSON,
  error_message TEXT,
  submitted_at TIMESTAMPTZ,
  last_checked_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ===== بوابة العملاء الخارجية =====

CREATE TABLE public.customer_portal_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) UNIQUE,
  is_enabled BOOLEAN NOT NULL DEFAULT false,
  portal_name TEXT,
  portal_logo_url TEXT,
  primary_color TEXT DEFAULT '#10b981',
  welcome_message TEXT,
  allow_service_requests BOOLEAN NOT NULL DEFAULT true,
  allow_shipment_tracking BOOLEAN NOT NULL DEFAULT true,
  allow_document_download BOOLEAN NOT NULL DEFAULT true,
  allow_invoices_view BOOLEAN NOT NULL DEFAULT false,
  require_approval_for_requests BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.portal_access_tokens (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES public.organizations(id),
  customer_id UUID REFERENCES public.customers(id),
  external_partner_id UUID REFERENCES public.external_partners(id),
  token_hash TEXT NOT NULL,
  token_prefix TEXT NOT NULL,
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  last_used_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  permissions TEXT[] DEFAULT ARRAY['track_shipments'],
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.portal_service_requests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES public.organizations(id),
  portal_token_id UUID REFERENCES public.portal_access_tokens(id),
  request_number TEXT NOT NULL,
  request_type TEXT NOT NULL,
  description TEXT NOT NULL,
  priority TEXT NOT NULL DEFAULT 'normal',
  status TEXT NOT NULL DEFAULT 'pending',
  waste_type TEXT,
  estimated_quantity DOUBLE PRECISION,
  pickup_address TEXT,
  pickup_date DATE,
  notes TEXT,
  admin_notes TEXT,
  handled_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ===== RLS Policies =====

ALTER TABLE public.user_points ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.points_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leaderboard_cache ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.iot_devices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.iot_readings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.iot_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.e_invoice_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.e_invoice_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customer_portal_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.portal_access_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.portal_service_requests ENABLE ROW LEVEL SECURITY;

-- Gamification policies
CREATE POLICY "Users can view their own points" ON public.user_points FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "System can manage points" ON public.user_points FOR ALL USING (true);
CREATE POLICY "Users can view their transactions" ON public.points_transactions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "System can insert transactions" ON public.points_transactions FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can view badges" ON public.badges FOR SELECT USING (true);
CREATE POLICY "Users can view their badges" ON public.user_badges FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "System can manage user badges" ON public.user_badges FOR ALL USING (true);
CREATE POLICY "Anyone can view leaderboard" ON public.leaderboard_cache FOR SELECT USING (true);
CREATE POLICY "System can manage leaderboard" ON public.leaderboard_cache FOR ALL USING (true);

-- IoT policies
CREATE POLICY "Org members can view devices" ON public.iot_devices FOR SELECT USING (
  organization_id IN (SELECT organization_id FROM public.profiles WHERE user_id = auth.uid())
);
CREATE POLICY "Org members can manage devices" ON public.iot_devices FOR ALL USING (
  organization_id IN (SELECT organization_id FROM public.profiles WHERE user_id = auth.uid())
);
CREATE POLICY "Org members can view readings" ON public.iot_readings FOR SELECT USING (
  organization_id IN (SELECT organization_id FROM public.profiles WHERE user_id = auth.uid())
);
CREATE POLICY "System can insert readings" ON public.iot_readings FOR INSERT WITH CHECK (true);
CREATE POLICY "Org members can view alerts" ON public.iot_alerts FOR SELECT USING (
  organization_id IN (SELECT organization_id FROM public.profiles WHERE user_id = auth.uid())
);
CREATE POLICY "Org members can manage alerts" ON public.iot_alerts FOR ALL USING (
  organization_id IN (SELECT organization_id FROM public.profiles WHERE user_id = auth.uid())
);

-- E-Invoice policies
CREATE POLICY "Org members can view e-invoice settings" ON public.e_invoice_settings FOR SELECT USING (
  organization_id IN (SELECT organization_id FROM public.profiles WHERE user_id = auth.uid())
);
CREATE POLICY "Org members can manage e-invoice settings" ON public.e_invoice_settings FOR ALL USING (
  organization_id IN (SELECT organization_id FROM public.profiles WHERE user_id = auth.uid())
);
CREATE POLICY "Org members can view submissions" ON public.e_invoice_submissions FOR SELECT USING (
  organization_id IN (SELECT organization_id FROM public.profiles WHERE user_id = auth.uid())
);
CREATE POLICY "Org members can manage submissions" ON public.e_invoice_submissions FOR ALL USING (
  organization_id IN (SELECT organization_id FROM public.profiles WHERE user_id = auth.uid())
);

-- Portal policies
CREATE POLICY "Org members can view portal settings" ON public.customer_portal_settings FOR SELECT USING (
  organization_id IN (SELECT organization_id FROM public.profiles WHERE user_id = auth.uid())
);
CREATE POLICY "Org members can manage portal settings" ON public.customer_portal_settings FOR ALL USING (
  organization_id IN (SELECT organization_id FROM public.profiles WHERE user_id = auth.uid())
);
CREATE POLICY "Org members can view access tokens" ON public.portal_access_tokens FOR SELECT USING (
  organization_id IN (SELECT organization_id FROM public.profiles WHERE user_id = auth.uid())
);
CREATE POLICY "Org members can manage access tokens" ON public.portal_access_tokens FOR ALL USING (
  organization_id IN (SELECT organization_id FROM public.profiles WHERE user_id = auth.uid())
);
CREATE POLICY "Org members can view service requests" ON public.portal_service_requests FOR SELECT USING (
  organization_id IN (SELECT organization_id FROM public.profiles WHERE user_id = auth.uid())
);
CREATE POLICY "Org members can manage service requests" ON public.portal_service_requests FOR ALL USING (
  organization_id IN (SELECT organization_id FROM public.profiles WHERE user_id = auth.uid())
);

-- Insert default badges
INSERT INTO public.badges (name, name_ar, description_ar, icon, color, category, requirement_type, requirement_value, points_reward, rarity) VALUES
('First Shipment', 'الشحنة الأولى', 'أكمل أول شحنة في النظام', 'package', '#4CAF50', 'shipments', 'shipments_completed', 1, 50, 'common'),
('Speed Demon', 'سريع البرق', 'أكمل 10 شحنات في أسبوع واحد', 'zap', '#FF9800', 'shipments', 'weekly_shipments', 10, 200, 'rare'),
('Recycling Hero', 'بطل إعادة التدوير', 'ساهم في إعادة تدوير 100 طن', 'recycle', '#2196F3', 'environment', 'tons_recycled', 100, 500, 'epic'),
('Perfect Score', 'تقييم مثالي', 'احصل على تقييم 5 نجوم من 10 شركاء', 'star', '#FFD700', 'ratings', 'perfect_ratings', 10, 300, 'rare'),
('Safety First', 'السلامة أولاً', '30 يوم بدون حوادث', 'shield', '#9C27B0', 'safety', 'safe_days', 30, 150, 'uncommon'),
('Early Bird', 'الطائر المبكر', 'أكمل 20 شحنة قبل الموعد', 'sunrise', '#E91E63', 'performance', 'early_deliveries', 20, 250, 'rare'),
('Team Player', 'لاعب فريق', 'تعاون مع 5 جهات مختلفة', 'users', '#00BCD4', 'collaboration', 'unique_partners', 5, 100, 'uncommon'),
('Marathon Runner', 'عداء الماراثون', '100 يوم نشاط متتالي', 'flame', '#FF5722', 'streaks', 'streak_days', 100, 1000, 'legendary'),
('Data Master', 'سيد البيانات', 'أكمل جميع بيانات الملف الشخصي', 'database', '#607D8B', 'profile', 'profile_completion', 100, 75, 'common'),
('Green Champion', 'بطل البيئة', 'ساهم في خفض الانبعاثات بنسبة 20%', 'leaf', '#4CAF50', 'environment', 'emissions_reduced', 20, 750, 'epic');

-- Indexes
CREATE INDEX idx_points_transactions_user ON public.points_transactions(user_id, created_at DESC);
CREATE INDEX idx_iot_readings_device ON public.iot_readings(device_id, recorded_at DESC);
CREATE INDEX idx_iot_readings_org ON public.iot_readings(organization_id, recorded_at DESC);
CREATE INDEX idx_e_invoice_submissions_org ON public.e_invoice_submissions(organization_id, created_at DESC);
CREATE INDEX idx_portal_service_requests_org ON public.portal_service_requests(organization_id, created_at DESC);
CREATE INDEX idx_leaderboard_period ON public.leaderboard_cache(period_type, period_key, total_points DESC);

-- Enable realtime for alerts and service requests
ALTER PUBLICATION supabase_realtime ADD TABLE public.iot_alerts;
ALTER PUBLICATION supabase_realtime ADD TABLE public.portal_service_requests;
