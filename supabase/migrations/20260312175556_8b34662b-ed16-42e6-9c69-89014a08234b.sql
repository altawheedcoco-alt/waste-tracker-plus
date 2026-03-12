-- Fix weight dispute trigger to use correct column names from shipments table
CREATE OR REPLACE FUNCTION public.auto_detect_weight_dispute()
RETURNS TRIGGER AS $$
DECLARE
  _org_id uuid;
  _source numeric;
  _dest numeric;
  _diff_pct numeric;
BEGIN
  _org_id := NEW.organization_id;
  
  -- Check if weight reconciliation is enabled
  IF NOT public.is_auto_action_enabled(_org_id, 'auto_weight_reconciliation') THEN
    RETURN NEW;
  END IF;

  _source := COALESCE(NEW.weight_at_source, NEW.quantity, 0);
  _dest := COALESCE(NEW.weight_at_destination, 0);

  IF _source > 0 AND _dest > 0 THEN
    _diff_pct := ABS(_source - _dest) / _source * 100;
    
    IF _diff_pct > 5 THEN
      NEW.weight_discrepancy_pct := round(_diff_pct, 2);
      
      INSERT INTO public.notifications (
        user_id, title, message, type, reference_id, reference_type, organization_id
      )
      SELECT p.user_id,
        'تنبيه: فارق وزن يتجاوز 5%',
        'الشحنة ' || COALESCE(NEW.shipment_number, NEW.id::text) || 
        ' — وزن المصدر: ' || _source || ' / وزن الوجهة: ' || _dest || 
        ' (فارق ' || round(_diff_pct, 1) || '%)',
        'weight_dispute',
        NEW.id::text,
        'shipment',
        _org_id
      FROM public.profiles p
      WHERE p.organization_id = _org_id
      LIMIT 5;
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Auto price calculation - check toggle
CREATE OR REPLACE FUNCTION public.auto_calculate_shipment_price()
RETURNS TRIGGER AS $$
BEGIN
  IF NOT public.is_auto_action_enabled(NEW.organization_id, 'auto_price_calculation') THEN
    RETURN NEW;
  END IF;

  IF NEW.status = 'approved' AND (OLD.status IS DISTINCT FROM 'approved') 
     AND COALESCE(NEW.total_cost, 0) = 0 THEN
    NEW.total_cost := COALESCE(NEW.quantity, 1) * 50;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create/update compliance check trigger
CREATE OR REPLACE FUNCTION public.auto_compliance_check_on_shipment()
RETURNS TRIGGER AS $$
BEGIN
  IF NOT public.is_auto_action_enabled(NEW.organization_id, 'auto_compliance_check') THEN
    RETURN NEW;
  END IF;

  -- Check if organization has valid environmental license
  IF NEW.status = 'approved' AND (OLD.status IS DISTINCT FROM 'approved') THEN
    IF NOT EXISTS (
      SELECT 1 FROM public.legal_licenses 
      WHERE organization_id = NEW.organization_id 
        AND license_type = 'environmental'
        AND status = 'active'
        AND COALESCE(expiry_date, now() + interval '1 day') > now()
    ) THEN
      INSERT INTO public.notifications (
        user_id, title, message, type, reference_id, reference_type, organization_id, priority
      )
      SELECT p.user_id,
        'تحذير امتثال: رخصة بيئية غير سارية',
        'تم الموافقة على الشحنة ' || COALESCE(NEW.shipment_number, '') || ' لكن الرخصة البيئية للجهة غير سارية أو منتهية.',
        'compliance_warning',
        NEW.id::text,
        'shipment',
        NEW.organization_id,
        'high'
      FROM public.profiles p
      WHERE p.organization_id = NEW.organization_id
      LIMIT 3;
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create triggers
DROP TRIGGER IF EXISTS trg_auto_detect_weight_dispute ON public.shipments;
CREATE TRIGGER trg_auto_detect_weight_dispute
  BEFORE UPDATE OF weight_at_destination ON public.shipments
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_detect_weight_dispute();

DROP TRIGGER IF EXISTS trg_auto_calculate_price ON public.shipments;
CREATE TRIGGER trg_auto_calculate_price
  BEFORE UPDATE OF status ON public.shipments
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_calculate_shipment_price();

DROP TRIGGER IF EXISTS trg_auto_compliance_check ON public.shipments;
CREATE TRIGGER trg_auto_compliance_check
  BEFORE UPDATE OF status ON public.shipments
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_compliance_check_on_shipment();

-- Update notification triggers to check toggles
CREATE OR REPLACE FUNCTION public.notify_shipment_status_change()
RETURNS TRIGGER AS $$
DECLARE
  _org_id uuid;
  _status_label text;
BEGIN
  _org_id := NEW.organization_id;
  
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
      WHEN 'approved' THEN 'تمت الموافقة'
      WHEN 'in_transit' THEN 'في الطريق'
      WHEN 'delivered' THEN 'تم التسليم'
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
    WHERE p.organization_id IN (_org_id, NEW.generator_id, NEW.transporter_id, NEW.recycler_id)
      AND p.organization_id IS NOT NULL
    LIMIT 20;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS trg_notify_shipment_status ON public.shipments;
CREATE TRIGGER trg_notify_shipment_status
  AFTER UPDATE OF status ON public.shipments
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_shipment_status_change();