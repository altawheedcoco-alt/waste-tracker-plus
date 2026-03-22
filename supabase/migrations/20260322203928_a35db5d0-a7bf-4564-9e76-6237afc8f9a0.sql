
-- جدول المهام الخارجية (الرابط المؤقت للسائق المؤجر)
CREATE TABLE public.external_missions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  token TEXT NOT NULL UNIQUE DEFAULT encode(gen_random_bytes(24), 'hex'),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  created_by UUID NOT NULL REFERENCES public.profiles(id),
  
  -- تفاصيل الشحنة
  pickup_address TEXT NOT NULL,
  delivery_address TEXT NOT NULL,
  waste_type TEXT,
  estimated_weight NUMERIC,
  notes TEXT,
  
  -- بيانات السائق الخارجي
  driver_name TEXT,
  driver_phone TEXT,
  driver_vehicle_plate TEXT,
  
  -- الحالة
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'opened', 'in_progress', 'completed', 'expired', 'cancelled')),
  
  -- بيانات التنفيذ (يملأها السائق)
  actual_weight NUMERIC,
  execution_notes TEXT,
  completion_photo_url TEXT,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  
  -- انتهاء الصلاحية
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (now() + interval '48 hours'),
  
  -- الشحنة المرتبطة (اختياري)
  linked_shipment_id UUID REFERENCES public.shipments(id),
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- فهرس للبحث بالتوكن
CREATE INDEX idx_external_missions_token ON public.external_missions(token);
CREATE INDEX idx_external_missions_org ON public.external_missions(organization_id);

-- RLS
ALTER TABLE public.external_missions ENABLE ROW LEVEL SECURITY;

-- سياسة: أعضاء المنظمة يقرأون ويكتبون
CREATE POLICY "org_members_manage_external_missions"
ON public.external_missions
FOR ALL
TO authenticated
USING (
  organization_id IN (
    SELECT organization_id FROM public.organization_members WHERE user_id = auth.uid()
  )
);

-- سياسة: قراءة عامة بالتوكن (للسائق الخارجي)
CREATE POLICY "public_read_by_token"
ON public.external_missions
FOR SELECT
TO anon, authenticated
USING (true);

-- سياسة: تحديث بالتوكن (السائق الخارجي يحدث بيانات التنفيذ)
CREATE POLICY "public_update_by_token"
ON public.external_missions
FOR UPDATE
TO anon, authenticated
USING (true)
WITH CHECK (true);
