-- Update log_table_changes function to handle shipments table correctly
CREATE OR REPLACE FUNCTION public.log_table_changes()
RETURNS TRIGGER AS $$
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
    
    -- الحصول على organization_id بناءً على نوع الجدول
    IF TG_TABLE_NAME = 'shipments' THEN
      -- جدول الشحنات يستخدم transporter_id بدلاً من organization_id
      v_org_id := NEW.transporter_id;
    ELSIF TG_TABLE_NAME IN ('invoices', 'deposits', 'contracts', 'drivers') THEN
      v_org_id := NEW.organization_id;
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
                  ' من "' || COALESCE(OLD.status::text, 'غير محدد') || 
                  '" إلى "' || COALESCE(NEW.status::text, 'غير محدد') || '"';
      v_changed_fields := array_append(v_changed_fields, 'status');
    ELSE
      v_action := 'تحديث ' || v_resource_type;
    END IF;
    
    v_details := jsonb_build_object(
      'old_status', OLD.status,
      'new_status', NEW.status,
      'changed_fields', v_changed_fields
    );
    
    -- الحصول على organization_id بناءً على نوع الجدول
    IF TG_TABLE_NAME = 'shipments' THEN
      v_org_id := NEW.transporter_id;
    ELSIF TG_TABLE_NAME IN ('invoices', 'deposits', 'contracts', 'drivers') THEN
      v_org_id := NEW.organization_id;
    END IF;
    
  ELSIF TG_OP = 'DELETE' THEN
    v_action_type := v_resource_type || '_delete';
    v_action := 'حذف ' || v_resource_type;
    v_resource_id := OLD.id;
    v_details := jsonb_build_object('operation', 'delete');
    
    -- الحصول على organization_id بناءً على نوع الجدول
    IF TG_TABLE_NAME = 'shipments' THEN
      v_org_id := OLD.transporter_id;
    ELSIF TG_TABLE_NAME IN ('invoices', 'deposits', 'contracts', 'drivers') THEN
      v_org_id := OLD.organization_id;
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
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;