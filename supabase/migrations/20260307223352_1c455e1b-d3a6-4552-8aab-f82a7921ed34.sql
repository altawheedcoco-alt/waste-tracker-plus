
-- جدول تسجيل الآثار المتقاطعة بين الجهات
CREATE TABLE public.cross_impact_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  -- مصدر الأثر
  source_organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE NOT NULL,
  source_org_type TEXT NOT NULL,
  source_command_id TEXT NOT NULL,
  source_user_id UUID NOT NULL,
  -- هدف الأثر
  target_organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
  target_org_type TEXT,
  -- تفاصيل الأثر
  impact_type TEXT NOT NULL,
  impact_label_ar TEXT NOT NULL,
  impact_label_en TEXT,
  -- المورد المرتبط
  resource_type TEXT NOT NULL,
  resource_id TEXT NOT NULL,
  resource_label TEXT,
  -- سلسلة الأوامر
  chain_id TEXT,
  node_id TEXT,
  -- البيانات والحالة
  status TEXT NOT NULL DEFAULT 'completed',
  impact_data JSONB DEFAULT '{}'::jsonb,
  metadata JSONB DEFAULT '{}'::jsonb,
  -- الأثر المالي
  financial_amount NUMERIC,
  financial_currency TEXT DEFAULT 'EGP',
  -- الطوابع الزمنية
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at TIMESTAMPTZ
);

-- فهارس للأداء
CREATE INDEX idx_cross_impact_source_org ON public.cross_impact_log(source_organization_id);
CREATE INDEX idx_cross_impact_target_org ON public.cross_impact_log(target_organization_id);
CREATE INDEX idx_cross_impact_resource ON public.cross_impact_log(resource_type, resource_id);
CREATE INDEX idx_cross_impact_type ON public.cross_impact_log(impact_type);
CREATE INDEX idx_cross_impact_created ON public.cross_impact_log(created_at DESC);
CREATE INDEX idx_cross_impact_chain ON public.cross_impact_log(chain_id, node_id);

-- تفعيل RLS
ALTER TABLE public.cross_impact_log ENABLE ROW LEVEL SECURITY;

-- سياسة: المنظمة تشوف الآثار المرتبطة بها (مصدر أو هدف)
CREATE POLICY "org_can_view_own_impacts" ON public.cross_impact_log
  FOR SELECT TO authenticated
  USING (
    source_organization_id IN (
      SELECT organization_id FROM public.profiles WHERE id = auth.uid()
    )
    OR target_organization_id IN (
      SELECT organization_id FROM public.profiles WHERE id = auth.uid()
    )
  );

-- سياسة: المستخدم المسجل يقدر يسجل أثر لمنظمته
CREATE POLICY "user_can_insert_own_org_impacts" ON public.cross_impact_log
  FOR INSERT TO authenticated
  WITH CHECK (
    source_organization_id IN (
      SELECT organization_id FROM public.profiles WHERE id = auth.uid()
    )
  );

-- تفعيل Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.cross_impact_log;
