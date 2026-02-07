-- =====================================================
-- نظام التدقيق الشامل - Database Triggers
-- يسجل تلقائياً كل التغييرات في الجداول الرئيسية
-- =====================================================

-- إنشاء دالة للحصول على معرف المؤسسة للمستخدم الحالي
CREATE OR REPLACE FUNCTION public.get_user_organization_id()
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT organization_id FROM public.profiles WHERE id = auth.uid() LIMIT 1;
$$;

-- دالة عامة لتسجيل التغييرات
CREATE OR REPLACE FUNCTION public.log_table_changes()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid;
  v_org_id uuid;
  v_action text;
  v_action_type text;
  v_resource_type text;
  v_resource_id uuid;
  v_details jsonb;
  v_changed_fields text[];
BEGIN
  -- الحصول على معرف المستخدم الحالي
  v_user_id := auth.uid();
  
  -- تحديد نوع المورد من اسم الجدول
  v_resource_type := TG_TABLE_NAME;
  
  -- تحديد نوع العملية
  IF TG_OP = 'INSERT' THEN
    v_action_type := v_resource_type || '_create';
    v_action := 'إنشاء ' || v_resource_type || ' جديد';
    v_resource_id := NEW.id;
    v_details := jsonb_build_object('operation', 'create');
    
    -- الحصول على organization_id إذا وجد
    IF TG_TABLE_NAME IN ('shipments', 'invoices', 'deposits', 'contracts', 'drivers') THEN
      v_org_id := COALESCE(NEW.organization_id, NEW.transporter_id, NEW.generator_id);
    END IF;
    
  ELSIF TG_OP = 'UPDATE' THEN
    v_action_type := v_resource_type || '_update';
    v_resource_id := NEW.id;
    
    -- تحديد الحقول التي تغيرت
    v_changed_fields := ARRAY[]::text[];
    
    -- للشحنات: تتبع تغيير الحالة
    IF TG_TABLE_NAME = 'shipments' AND OLD.status IS DISTINCT FROM NEW.status THEN
      v_action_type := 'shipment_status_change';
      v_action := 'تغيير حالة الشحنة ' || COALESCE(NEW.shipment_number, '') || 
                  ' من "' || COALESCE(OLD.status, 'غير محدد') || 
                  '" إلى "' || COALESCE(NEW.status, 'غير محدد') || '"';
      v_changed_fields := array_append(v_changed_fields, 'status');
    ELSE
      v_action := 'تحديث ' || v_resource_type;
    END IF;
    
    v_details := jsonb_build_object(
      'old_status', OLD.status,
      'new_status', NEW.status,
      'changed_fields', v_changed_fields
    );
    
    IF TG_TABLE_NAME IN ('shipments', 'invoices', 'deposits', 'contracts', 'drivers') THEN
      v_org_id := COALESCE(NEW.organization_id, NEW.transporter_id, NEW.generator_id);
    END IF;
    
  ELSIF TG_OP = 'DELETE' THEN
    v_action_type := v_resource_type || '_delete';
    v_action := 'حذف ' || v_resource_type;
    v_resource_id := OLD.id;
    v_details := jsonb_build_object('operation', 'delete');
    
    IF TG_TABLE_NAME IN ('shipments', 'invoices', 'deposits', 'contracts', 'drivers') THEN
      v_org_id := COALESCE(OLD.organization_id, OLD.transporter_id, OLD.generator_id);
    END IF;
  END IF;

  -- إضافة معلومات إضافية للشحنات
  IF TG_TABLE_NAME = 'shipments' THEN
    IF TG_OP != 'DELETE' THEN
      v_details := v_details || jsonb_build_object('shipment_number', NEW.shipment_number);
    ELSE
      v_details := v_details || jsonb_build_object('shipment_number', OLD.shipment_number);
    END IF;
  END IF;

  -- تسجيل النشاط
  INSERT INTO public.activity_logs (
    user_id,
    organization_id,
    action,
    action_type,
    resource_type,
    resource_id,
    details,
    ip_address,
    user_agent
  ) VALUES (
    v_user_id,
    v_org_id,
    v_action,
    v_action_type,
    v_resource_type,
    v_resource_id,
    v_details,
    NULL,
    'database_trigger'
  );

  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  ELSE
    RETURN NEW;
  END IF;
END;
$$;

-- =====================================================
-- إنشاء Triggers للجداول الرئيسية
-- =====================================================

-- Trigger للشحنات
DROP TRIGGER IF EXISTS audit_shipments_trigger ON public.shipments;
CREATE TRIGGER audit_shipments_trigger
  AFTER INSERT OR UPDATE OR DELETE ON public.shipments
  FOR EACH ROW EXECUTE FUNCTION public.log_table_changes();

-- Trigger للفواتير
DROP TRIGGER IF EXISTS audit_invoices_trigger ON public.invoices;
CREATE TRIGGER audit_invoices_trigger
  AFTER INSERT OR UPDATE OR DELETE ON public.invoices
  FOR EACH ROW EXECUTE FUNCTION public.log_table_changes();

-- Trigger للإيداعات
DROP TRIGGER IF EXISTS audit_deposits_trigger ON public.deposits;
CREATE TRIGGER audit_deposits_trigger
  AFTER INSERT OR UPDATE OR DELETE ON public.deposits
  FOR EACH ROW EXECUTE FUNCTION public.log_table_changes();

-- Trigger للعقود
DROP TRIGGER IF EXISTS audit_contracts_trigger ON public.contracts;
CREATE TRIGGER audit_contracts_trigger
  AFTER INSERT OR UPDATE OR DELETE ON public.contracts
  FOR EACH ROW EXECUTE FUNCTION public.log_table_changes();

-- Trigger للسائقين
DROP TRIGGER IF EXISTS audit_drivers_trigger ON public.drivers;
CREATE TRIGGER audit_drivers_trigger
  AFTER INSERT OR UPDATE OR DELETE ON public.drivers
  FOR EACH ROW EXECUTE FUNCTION public.log_table_changes();

-- Trigger لتقارير إعادة التدوير
DROP TRIGGER IF EXISTS audit_recycling_reports_trigger ON public.recycling_reports;
CREATE TRIGGER audit_recycling_reports_trigger
  AFTER INSERT OR UPDATE OR DELETE ON public.recycling_reports
  FOR EACH ROW EXECUTE FUNCTION public.log_table_changes();

-- Trigger لإيصالات الشحنات
DROP TRIGGER IF EXISTS audit_shipment_receipts_trigger ON public.shipment_receipts;
CREATE TRIGGER audit_shipment_receipts_trigger
  AFTER INSERT OR UPDATE OR DELETE ON public.shipment_receipts
  FOR EACH ROW EXECUTE FUNCTION public.log_table_changes();

-- Trigger لخطابات الترسية
DROP TRIGGER IF EXISTS audit_award_letters_trigger ON public.award_letters;
CREATE TRIGGER audit_award_letters_trigger
  AFTER INSERT OR UPDATE OR DELETE ON public.award_letters
  FOR EACH ROW EXECUTE FUNCTION public.log_table_changes();

-- Trigger للشركاء الخارجيين
DROP TRIGGER IF EXISTS audit_external_partners_trigger ON public.external_partners;
CREATE TRIGGER audit_external_partners_trigger
  AFTER INSERT OR UPDATE OR DELETE ON public.external_partners
  FOR EACH ROW EXECUTE FUNCTION public.log_table_changes();

-- Trigger للقيود المحاسبية
DROP TRIGGER IF EXISTS audit_accounting_ledger_trigger ON public.accounting_ledger;
CREATE TRIGGER audit_accounting_ledger_trigger
  AFTER INSERT OR UPDATE OR DELETE ON public.accounting_ledger
  FOR EACH ROW EXECUTE FUNCTION public.log_table_changes();

-- Trigger لمفاتيح API
DROP TRIGGER IF EXISTS audit_api_keys_trigger ON public.api_keys;
CREATE TRIGGER audit_api_keys_trigger
  AFTER INSERT OR UPDATE OR DELETE ON public.api_keys
  FOR EACH ROW EXECUTE FUNCTION public.log_table_changes();

-- =====================================================
-- دالة خاصة لتسجيل تغييرات الأدوار
-- =====================================================
CREATE OR REPLACE FUNCTION public.log_role_changes()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid;
  v_action text;
  v_details jsonb;
BEGIN
  v_user_id := auth.uid();
  
  IF TG_OP = 'INSERT' THEN
    v_action := 'إضافة دور "' || NEW.role::text || '" للمستخدم';
    v_details := jsonb_build_object(
      'target_user_id', NEW.user_id,
      'role', NEW.role::text
    );
  ELSIF TG_OP = 'DELETE' THEN
    v_action := 'إزالة دور "' || OLD.role::text || '" من المستخدم';
    v_details := jsonb_build_object(
      'target_user_id', OLD.user_id,
      'role', OLD.role::text
    );
  END IF;

  INSERT INTO public.activity_logs (
    user_id,
    action,
    action_type,
    resource_type,
    resource_id,
    details,
    user_agent
  ) VALUES (
    v_user_id,
    v_action,
    'user_role_change',
    'user',
    COALESCE(NEW.user_id, OLD.user_id),
    v_details,
    'database_trigger'
  );

  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  ELSE
    RETURN NEW;
  END IF;
END;
$$;

-- Trigger لتغييرات الأدوار
DROP TRIGGER IF EXISTS audit_user_roles_trigger ON public.user_roles;
CREATE TRIGGER audit_user_roles_trigger
  AFTER INSERT OR DELETE ON public.user_roles
  FOR EACH ROW EXECUTE FUNCTION public.log_role_changes();

-- =====================================================
-- إضافة index لتحسين أداء البحث في سجل الأنشطة
-- =====================================================
CREATE INDEX IF NOT EXISTS idx_activity_logs_user_id ON public.activity_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_org_id ON public.activity_logs(organization_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_action_type ON public.activity_logs(action_type);
CREATE INDEX IF NOT EXISTS idx_activity_logs_resource ON public.activity_logs(resource_type, resource_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_created_at ON public.activity_logs(created_at DESC);

-- =====================================================
-- تحديث سياسات RLS لجدول activity_logs
-- =====================================================

-- السماح بالإدراج لكل المستخدمين المصادق عليهم
DROP POLICY IF EXISTS "Users can insert activity logs" ON public.activity_logs;
CREATE POLICY "Users can insert activity logs"
  ON public.activity_logs
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- السماح للمسؤولين بقراءة كل السجلات
DROP POLICY IF EXISTS "Admins can view all activity logs" ON public.activity_logs;
CREATE POLICY "Admins can view all activity logs"
  ON public.activity_logs
  FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- السماح للمستخدمين برؤية سجلاتهم الخاصة
DROP POLICY IF EXISTS "Users can view own activity logs" ON public.activity_logs;
CREATE POLICY "Users can view own activity logs"
  ON public.activity_logs
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- السماح لأعضاء المؤسسة برؤية سجلات مؤسستهم
DROP POLICY IF EXISTS "Org members can view org activity logs" ON public.activity_logs;
CREATE POLICY "Org members can view org activity logs"
  ON public.activity_logs
  FOR SELECT
  TO authenticated
  USING (organization_id = public.get_user_organization_id());