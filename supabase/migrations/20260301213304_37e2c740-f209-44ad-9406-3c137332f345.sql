CREATE OR REPLACE FUNCTION public.notify_shipment_status_change()
RETURNS TRIGGER AS $$
DECLARE
    _trigger_org_name TEXT;
    _status_label TEXT;
BEGIN
    IF OLD.status IS DISTINCT FROM NEW.status THEN
        SELECT name INTO _trigger_org_name FROM organizations WHERE id = NEW.transporter_id;
        
        _status_label := CASE NEW.status::text
            WHEN 'new' THEN 'جديدة'
            WHEN 'registered' THEN 'مسجلة'
            WHEN 'approved' THEN 'معتمدة'
            WHEN 'collecting' THEN 'جاري الجمع'
            WHEN 'in_transit' THEN 'في الطريق'
            WHEN 'delivered' THEN 'تم التسليم'
            WHEN 'confirmed' THEN 'مؤكدة'
            WHEN 'cancelled' THEN 'ملغاة'
            ELSE NEW.status::text
        END;

        -- إشعار المولد
        IF NEW.generator_id IS NOT NULL AND NEW.generator_id IS DISTINCT FROM NEW.transporter_id THEN
            INSERT INTO chain_notifications (shipment_id, trigger_event, trigger_organization_id, target_organization_id, notification_type, title, message, metadata)
            VALUES (NEW.id, 'status_change', COALESCE(NEW.transporter_id, NEW.generator_id), NEW.generator_id, 
                CASE WHEN NEW.status IN ('delivered', 'confirmed') THEN 'success' WHEN NEW.status = 'cancelled' THEN 'warning' ELSE 'info' END,
                'تحديث حالة الشحنة #' || NEW.shipment_number,
                'تم تغيير حالة الشحنة إلى: ' || _status_label,
                jsonb_build_object('old_status', OLD.status::text, 'new_status', NEW.status::text, 'shipment_number', NEW.shipment_number));
        END IF;

        -- إشعار المدور
        IF NEW.recycler_id IS NOT NULL AND NEW.recycler_id IS DISTINCT FROM NEW.transporter_id THEN
            INSERT INTO chain_notifications (shipment_id, trigger_event, trigger_organization_id, target_organization_id, notification_type, title, message, metadata)
            VALUES (NEW.id, 'status_change', COALESCE(NEW.transporter_id, NEW.generator_id), NEW.recycler_id,
                CASE WHEN NEW.status IN ('in_transit', 'delivered') THEN 'action_required' WHEN NEW.status = 'confirmed' THEN 'success' ELSE 'info' END,
                'تحديث حالة الشحنة #' || NEW.shipment_number,
                'تم تغيير حالة الشحنة إلى: ' || _status_label || CASE WHEN NEW.status = 'in_transit' THEN ' - يرجى الاستعداد للاستلام' ELSE '' END,
                jsonb_build_object('old_status', OLD.status::text, 'new_status', NEW.status::text, 'shipment_number', NEW.shipment_number));
        END IF;

        -- إشعار الناقل (فقط إذا كان المولد موجود وليس نفس الناقل)
        IF NEW.transporter_id IS NOT NULL AND NEW.generator_id IS NOT NULL AND NEW.transporter_id IS DISTINCT FROM NEW.generator_id THEN
            INSERT INTO chain_notifications (shipment_id, trigger_event, trigger_organization_id, target_organization_id, notification_type, title, message, metadata)
            VALUES (NEW.id, 'status_change', NEW.generator_id, NEW.transporter_id,
                'info',
                'تحديث حالة الشحنة #' || NEW.shipment_number,
                'تم تغيير حالة الشحنة إلى: ' || _status_label,
                jsonb_build_object('old_status', OLD.status::text, 'new_status', NEW.status::text, 'shipment_number', NEW.shipment_number));
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;