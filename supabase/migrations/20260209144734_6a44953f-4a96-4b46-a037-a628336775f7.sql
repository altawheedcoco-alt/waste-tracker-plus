
-- Fix the log_table_changes function to handle tables without status column
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
  v_old_status text;
  v_new_status text;
BEGIN
  v_user_id := auth.uid();
  v_resource_type := TG_TABLE_NAME;

  -- Safely get status if column exists
  BEGIN
    IF TG_OP = 'UPDATE' OR TG_OP = 'DELETE' THEN
      EXECUTE format('SELECT ($1).%I::text', 'status') INTO v_old_status USING OLD;
    END IF;
    IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
      EXECUTE format('SELECT ($1).%I::text', 'status') INTO v_new_status USING NEW;
    END IF;
  EXCEPTION WHEN undefined_column THEN
    v_old_status := NULL;
    v_new_status := NULL;
  END;

  IF TG_OP = 'INSERT' THEN
    v_action_type := v_resource_type || '_create';
    v_action := 'إنشاء ' || v_resource_type || ' جديد';
    v_resource_id := NEW.id;
    v_details := jsonb_build_object('operation', 'create');
    
    IF TG_TABLE_NAME = 'shipments' THEN
      v_org_id := NEW.transporter_id;
    ELSIF TG_TABLE_NAME IN ('invoices', 'deposits', 'contracts', 'drivers') THEN
      v_org_id := NEW.organization_id;
    END IF;
    
  ELSIF TG_OP = 'UPDATE' THEN
    v_action_type := v_resource_type || '_update';
    v_resource_id := NEW.id;
    v_changed_fields := ARRAY[]::text[];
    
    IF TG_TABLE_NAME = 'shipments' AND v_old_status IS DISTINCT FROM v_new_status THEN
      v_action_type := 'shipment_status_change';
      v_action := 'تغيير حالة الشحنة ' || COALESCE(NEW.shipment_number, '') || 
                  ' من "' || COALESCE(v_old_status, 'غير محدد') || 
                  '" إلى "' || COALESCE(v_new_status, 'غير محدد') || '"';
      v_changed_fields := array_append(v_changed_fields, 'status');
    ELSE
      v_action := 'تحديث ' || v_resource_type;
    END IF;
    
    v_details := jsonb_build_object(
      'old_status', v_old_status,
      'new_status', v_new_status,
      'changed_fields', v_changed_fields
    );
    
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
    
    IF TG_TABLE_NAME = 'shipments' THEN
      v_org_id := OLD.transporter_id;
    ELSIF TG_TABLE_NAME IN ('invoices', 'deposits', 'contracts', 'drivers') THEN
      v_org_id := OLD.organization_id;
    END IF;
  END IF;

  IF TG_TABLE_NAME = 'shipments' THEN
    IF TG_OP != 'DELETE' THEN
      v_details := v_details || jsonb_build_object('shipment_number', NEW.shipment_number);
    ELSE
      v_details := v_details || jsonb_build_object('shipment_number', OLD.shipment_number);
    END IF;
  END IF;

  INSERT INTO public.activity_logs (
    user_id, organization_id, action, action_type,
    resource_type, resource_id, details, ip_address, user_agent
  ) VALUES (
    v_user_id, v_org_id, v_action, v_action_type,
    v_resource_type, v_resource_id, v_details, NULL, 'database_trigger'
  );

  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  ELSE
    RETURN NEW;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Now safely add the columns
ALTER TABLE public.shipments ADD COLUMN IF NOT EXISTS delay_notified BOOLEAN DEFAULT false;
ALTER TABLE public.shipments ADD COLUMN IF NOT EXISTS delay_reason TEXT;
