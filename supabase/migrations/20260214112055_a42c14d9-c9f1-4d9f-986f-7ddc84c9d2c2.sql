
-- WhatsApp configuration per organization
CREATE TABLE public.whatsapp_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  phone_number_id TEXT,
  business_account_id TEXT,
  display_phone_number TEXT,
  is_active BOOLEAN DEFAULT false,
  auto_send_notifications BOOLEAN DEFAULT true,
  auto_send_otp BOOLEAN DEFAULT false,
  auto_send_subscription_reminders BOOLEAN DEFAULT true,
  auto_send_marketing BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(organization_id)
);

-- WhatsApp message templates
CREATE TABLE public.whatsapp_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
  template_name TEXT NOT NULL,
  template_language TEXT DEFAULT 'ar',
  category TEXT NOT NULL DEFAULT 'UTILITY',
  header_text TEXT,
  body_text TEXT NOT NULL,
  footer_text TEXT,
  buttons JSONB,
  meta_template_id TEXT,
  meta_status TEXT DEFAULT 'draft',
  is_system BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- WhatsApp message log
CREATE TABLE public.whatsapp_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES public.organizations(id) ON DELETE SET NULL,
  direction TEXT NOT NULL DEFAULT 'outbound' CHECK (direction IN ('inbound', 'outbound')),
  to_phone TEXT,
  from_phone TEXT,
  user_id UUID,
  template_id UUID REFERENCES public.whatsapp_templates(id) ON DELETE SET NULL,
  message_type TEXT NOT NULL DEFAULT 'text' CHECK (message_type IN ('text', 'template', 'image', 'document', 'otp', 'interactive')),
  content TEXT,
  template_params JSONB,
  meta_message_id TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'delivered', 'read', 'failed')),
  error_message TEXT,
  notification_id UUID REFERENCES public.notifications(id) ON DELETE SET NULL,
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.whatsapp_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.whatsapp_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.whatsapp_messages ENABLE ROW LEVEL SECURITY;

-- RLS for whatsapp_config
CREATE POLICY "Users can view own org config" ON public.whatsapp_config
  FOR SELECT TO authenticated
  USING (organization_id IN (
    SELECT organization_id FROM public.profiles WHERE id = auth.uid()
  ));

CREATE POLICY "Admins can manage config" ON public.whatsapp_config
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR organization_id IN (
    SELECT organization_id FROM public.profiles WHERE id = auth.uid()
  ));

-- RLS for whatsapp_templates
CREATE POLICY "Anyone can view system templates" ON public.whatsapp_templates
  FOR SELECT TO authenticated
  USING (is_system = true OR organization_id IN (
    SELECT organization_id FROM public.profiles WHERE id = auth.uid()
  ));

CREATE POLICY "Org users can manage templates" ON public.whatsapp_templates
  FOR ALL TO authenticated
  USING (organization_id IN (
    SELECT organization_id FROM public.profiles WHERE id = auth.uid()
  ));

-- RLS for whatsapp_messages
CREATE POLICY "Users can view own org messages" ON public.whatsapp_messages
  FOR SELECT TO authenticated
  USING (organization_id IN (
    SELECT organization_id FROM public.profiles WHERE id = auth.uid()
  ) OR user_id = auth.uid());

CREATE POLICY "System can insert messages" ON public.whatsapp_messages
  FOR INSERT TO authenticated
  WITH CHECK (true);

-- Indexes
CREATE INDEX idx_whatsapp_messages_org ON public.whatsapp_messages(organization_id);
CREATE INDEX idx_whatsapp_messages_user ON public.whatsapp_messages(user_id);
CREATE INDEX idx_whatsapp_messages_status ON public.whatsapp_messages(status);
CREATE INDEX idx_whatsapp_messages_created ON public.whatsapp_messages(created_at DESC);
CREATE INDEX idx_whatsapp_config_org ON public.whatsapp_config(organization_id);

-- Insert system templates
INSERT INTO public.whatsapp_templates (template_name, category, body_text, is_system, is_active) VALUES
('otp_verification', 'AUTHENTICATION', 'رمز التحقق الخاص بك هو: {{1}}. صالح لمدة {{2}} دقائق. لا تشاركه مع أحد.', true, true),
('shipment_update', 'UTILITY', 'تحديث شحنة #{{1}}: {{2}}. الحالة: {{3}}.', true, true),
('subscription_reminder', 'UTILITY', 'تذكير: اشتراكك في {{1}} ينتهي خلال {{2}} يوم. جدد الآن لتجنب انقطاع الخدمة.', true, true),
('welcome_message', 'MARKETING', 'مرحباً {{1}}! شكراً لانضمامك إلى منصتنا. نحن سعداء بخدمتك.', true, true),
('payment_confirmation', 'UTILITY', 'تم استلام دفعتك بنجاح. المبلغ: {{1}} جنيه. رقم المرجع: {{2}}.', true, true),
('account_suspended', 'UTILITY', 'تنبيه: تم تعليق حسابك في {{1}}. السبب: {{2}}. تواصل مع الدعم لإعادة التفعيل.', true, true),
('driver_assignment', 'UTILITY', 'تم تعيينك لشحنة #{{1}}. نقطة التحميل: {{2}}. موعد التحميل: {{3}}.', true, true);

-- Trigger for updated_at
CREATE TRIGGER update_whatsapp_config_updated_at BEFORE UPDATE ON public.whatsapp_config
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_whatsapp_templates_updated_at BEFORE UPDATE ON public.whatsapp_templates
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_whatsapp_messages_updated_at BEFORE UPDATE ON public.whatsapp_messages
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
