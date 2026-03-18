CREATE OR REPLACE FUNCTION public.notify_shipment_status_change()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  _org_id uuid;
  _status_label text;
BEGIN
  -- shipments table uses transporter_id/generator_id, NOT organization_id
  _org_id := COALESCE(NEW.transporter_id, NEW.generator_id);
  
  -- Check if shipment notifications and status change alerts are enabled
  IF NOT public.is_auto_action_enabled(_org_id, 'auto_shipment_notifications') THEN
    RETURN NEW;
  END IF;

  IF NOT public.is_auto_action_enabled(_org_id, 'auto_status_change_alerts') THEN
    RETURN NEW;
  END IF;

  IF OLD.status IS DISTINCT FROM NEW.status THEN
    _status_label := CASE NEW.status
      WHEN 'pending' THEN 'قيد الانتظار'
      WHEN 'registered' THEN 'مسجل'
      WHEN 'approved' THEN 'تمت الموافقة'
      WHEN 'loading' THEN 'قيد التحميل'
      WHEN 'picked_up' THEN 'تم الاستلام'
      WHEN 'in_transit' THEN 'في الطريق'
      WHEN 'delivering' THEN 'قيد التسليم'
      WHEN 'delivered' THEN 'تم التسليم'
      WHEN 'confirmed' THEN 'تم التأكيد'
      WHEN 'completed' THEN 'مكتمل'
      WHEN 'cancelled' THEN 'ملغي'
      ELSE NEW.status
    END;

    -- Notify org members
    INSERT INTO public.notifications (
      user_id, title, message, type, reference_id, reference_type, organization_id
    )
    SELECT p.user_id,
      'تحديث حالة شحنة',
      'الشحنة ' || COALESCE(NEW.shipment_number, '') || ' — الحالة الجديدة: ' || _status_label,
      'shipment_status_change',
      NEW.id::text,
      'shipment',
      _org_id
    FROM public.profiles p
    WHERE p.organization_id IN (NEW.generator_id, NEW.transporter_id, NEW.recycler_id)
      AND p.organization_id IS NOT NULL
    LIMIT 20;
  END IF;

  RETURN NEW;
END;
$function$;