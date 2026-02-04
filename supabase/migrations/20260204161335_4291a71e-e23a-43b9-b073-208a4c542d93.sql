-- =============================================
-- تحسين سياسات RLS باستخدام وظائف SECURITY DEFINER
-- Optimized RLS Policies with SECURITY DEFINER Functions
-- =============================================

-- ============ وظائف مساعدة محسّنة ============

-- وظيفة للتحقق من انتماء السائق للمستخدم
CREATE OR REPLACE FUNCTION public.is_user_driver(_user_id uuid, _driver_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 
    FROM public.drivers d
    JOIN public.profiles p ON p.id = d.profile_id
    WHERE p.user_id = _user_id AND d.id = _driver_id
  )
$$;

-- وظيفة للحصول على معرف السائق للمستخدم
CREATE OR REPLACE FUNCTION public.get_user_driver_id(_user_id uuid)
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT d.id
  FROM public.drivers d
  JOIN public.profiles p ON p.id = d.profile_id
  WHERE p.user_id = _user_id
  LIMIT 1
$$;

-- وظيفة للتحقق من انتماء السائق لمؤسسة المستخدم
CREATE OR REPLACE FUNCTION public.driver_belongs_to_user_org(_user_id uuid, _driver_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 
    FROM public.drivers d
    JOIN public.profiles p ON p.user_id = _user_id AND p.is_active = true
    WHERE d.id = _driver_id AND d.organization_id = p.organization_id
  )
$$;

-- وظيفة للتحقق من المشاركة في غرفة محادثة
CREATE OR REPLACE FUNCTION public.is_chat_participant(_user_id uuid, _room_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 
    FROM public.chat_participants
    WHERE room_id = _room_id AND user_id = _user_id
  )
$$;

-- وظيفة للتحقق من الوصول للشحنة عبر غرفة المحادثة
CREATE OR REPLACE FUNCTION public.can_access_shipment_chat(_user_id uuid, _room_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 
    FROM public.chat_rooms cr
    JOIN public.shipments s ON s.id = cr.shipment_id
    JOIN public.profiles p ON p.user_id = _user_id AND p.is_active = true
    WHERE cr.id = _room_id 
      AND cr.type = 'shipment'
      AND (s.generator_id = p.organization_id 
           OR s.transporter_id = p.organization_id 
           OR s.recycler_id = p.organization_id)
  )
$$;

-- وظيفة للتحقق من انتماء الفاتورة للمستخدم
CREATE OR REPLACE FUNCTION public.can_access_invoice_by_id(_user_id uuid, _invoice_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 
    FROM public.invoices i
    JOIN public.profiles p ON p.user_id = _user_id AND p.is_active = true
    WHERE i.id = _invoice_id
      AND (i.organization_id = p.organization_id 
           OR i.partner_organization_id = p.organization_id)
  ) OR public.has_role(_user_id, 'admin')
$$;

-- وظيفة للتحقق من الوصول للمستند
CREATE OR REPLACE FUNCTION public.can_access_document(_user_id uuid, _doc_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 
    FROM public.organization_documents d
    JOIN public.profiles p ON p.user_id = _user_id AND p.is_active = true
    WHERE d.id = _doc_id AND d.organization_id = p.organization_id
  ) OR public.has_role(_user_id, 'admin')
$$;

-- وظيفة للتحقق من الوصول لتقرير التدوير
CREATE OR REPLACE FUNCTION public.can_access_recycling_report(_user_id uuid, _report_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 
    FROM public.recycling_reports r
    JOIN public.profiles p ON p.user_id = _user_id AND p.is_active = true
    WHERE r.id = _report_id
      AND r.recycler_organization_id = p.organization_id
  ) OR public.has_role(_user_id, 'admin')
$$;

-- وظيفة للتحقق من الوصول للإيداع
CREATE OR REPLACE FUNCTION public.can_access_deposit(_user_id uuid, _deposit_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 
    FROM public.deposits d
    JOIN public.profiles p ON p.user_id = _user_id AND p.is_active = true
    WHERE d.id = _deposit_id
      AND (d.organization_id = p.organization_id 
           OR d.partner_organization_id = p.organization_id)
  ) OR public.has_role(_user_id, 'admin')
$$;

-- وظيفة للتحقق من الوصول للمصروفات
CREATE OR REPLACE FUNCTION public.can_access_expense(_user_id uuid, _expense_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 
    FROM public.expenses e
    JOIN public.profiles p ON p.user_id = _user_id AND p.is_active = true
    WHERE e.id = _expense_id AND e.organization_id = p.organization_id
  ) OR public.has_role(_user_id, 'admin')
$$;

-- وظيفة للتحقق من أن المستخدم company_admin أو admin
CREATE OR REPLACE FUNCTION public.is_company_or_system_admin(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 
    FROM public.user_roles
    WHERE user_id = _user_id AND role IN ('admin', 'company_admin')
  )
$$;

-- وظيفة للتحقق من الوصول للرسائل المباشرة
CREATE OR REPLACE FUNCTION public.can_access_direct_message(_user_id uuid, _sender_org_id uuid, _receiver_org_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 
    FROM public.profiles p
    WHERE p.user_id = _user_id 
      AND p.is_active = true
      AND (p.organization_id = _sender_org_id OR p.organization_id = _receiver_org_id)
  )
$$;

-- وظيفة للتحقق من الوصول لتذكرة الدعم
CREATE OR REPLACE FUNCTION public.can_access_ticket(_user_id uuid, _ticket_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 
    FROM public.support_tickets t
    JOIN public.profiles p ON p.user_id = _user_id AND p.is_active = true
    WHERE t.id = _ticket_id AND t.organization_id = p.organization_id
  ) OR public.has_role(_user_id, 'admin')
$$;

-- وظيفة للتحقق من الوصول للخطة التشغيلية
CREATE OR REPLACE FUNCTION public.can_access_operational_plan(_user_id uuid, _plan_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 
    FROM public.operational_plans op
    JOIN public.profiles p ON p.user_id = _user_id AND p.is_active = true
    WHERE op.id = _plan_id AND op.organization_id = p.organization_id
  ) OR public.has_role(_user_id, 'admin')
$$;

-- وظيفة للتحقق من الوصول للبوست
CREATE OR REPLACE FUNCTION public.can_access_org_post(_user_id uuid, _post_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 
    FROM public.organization_posts p
    JOIN public.profiles pr ON pr.user_id = _user_id AND pr.is_active = true
    WHERE p.id = _post_id AND p.organization_id = pr.organization_id
  ) OR public.has_role(_user_id, 'admin')
$$;

-- وظيفة للتحقق من الوصول للملاحظة
CREATE OR REPLACE FUNCTION public.can_access_partner_note(_user_id uuid, _note_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 
    FROM public.partner_notes n
    JOIN public.profiles p ON p.user_id = _user_id AND p.is_active = true
    WHERE n.id = _note_id 
      AND (n.sender_organization_id = p.organization_id 
           OR n.receiver_organization_id = p.organization_id)
  ) OR public.has_role(_user_id, 'admin')
$$;

-- وظيفة للتحقق من الوصول لسجلات الوزن الخارجية
CREATE OR REPLACE FUNCTION public.can_access_external_record(_user_id uuid, _record_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 
    FROM public.external_weight_records r
    JOIN public.profiles p ON p.user_id = _user_id AND p.is_active = true
    WHERE r.id = _record_id AND r.organization_id = p.organization_id
  ) OR public.has_role(_user_id, 'admin')
$$;

-- إضافة فهارس للوظائف الجديدة
CREATE INDEX IF NOT EXISTS idx_chat_participants_room_user 
ON public.chat_participants (room_id, user_id);

CREATE INDEX IF NOT EXISTS idx_chat_rooms_type_shipment 
ON public.chat_rooms (type, shipment_id) 
WHERE type = 'shipment';

-- توثيق الوظائف
COMMENT ON FUNCTION public.is_user_driver IS 'SECURITY DEFINER: Check if user owns driver record';
COMMENT ON FUNCTION public.driver_belongs_to_user_org IS 'SECURITY DEFINER: Check if driver belongs to user org';
COMMENT ON FUNCTION public.is_chat_participant IS 'SECURITY DEFINER: Check chat room participation';
COMMENT ON FUNCTION public.can_access_shipment_chat IS 'SECURITY DEFINER: Check shipment chat access';
COMMENT ON FUNCTION public.is_company_or_system_admin IS 'SECURITY DEFINER: Check admin role';