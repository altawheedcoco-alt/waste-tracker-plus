
-- ══════════════════════════════════════════════════════════════
-- Cascading Impact Automation Trigger
-- When a shipment status changes, automatically record impact events
-- and trigger downstream actions
-- ══════════════════════════════════════════════════════════════

-- Function: Auto-record impact events on shipment status change
CREATE OR REPLACE FUNCTION public.fn_cascade_shipment_impact()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_org_id uuid;
  v_step_key text;
  v_action_label text;
  v_result_label text;
  v_impact_label text;
BEGIN
  -- Only fire on status changes
  IF OLD.status = NEW.status THEN
    RETURN NEW;
  END IF;

  -- Determine organization
  v_org_id := COALESCE(NEW.transporter_id, NEW.generator_id);
  IF v_org_id IS NULL THEN
    RETURN NEW;
  END IF;

  -- Map status to step key and labels
  CASE NEW.status
    WHEN 'pending' THEN
      v_step_key := 'create';
      v_action_label := 'إنشاء شحنة';
      v_result_label := 'تم إنشاء الشحنة وإشعار الأطراف';
      v_impact_label := 'بدء دورة حياة شحنة جديدة';
    WHEN 'approved' THEN
      v_step_key := 'approve';
      v_action_label := 'اعتماد الشحنة';
      v_result_label := 'تم اعتماد الشحنة من المولد';
      v_impact_label := 'فتح بوابة النقل والتوثيق';
    WHEN 'in_transit' THEN
      v_step_key := 'pickup';
      v_action_label := 'بدء النقل';
      v_result_label := 'الشحنة في الطريق';
      v_impact_label := 'تفعيل التتبع اللحظي والجيوفنس';
    WHEN 'delivered' THEN
      v_step_key := 'deliver';
      v_action_label := 'تسليم الشحنة';
      v_result_label := 'تم تسليم الشحنة للمستلم';
      v_impact_label := 'فتح بوابة الفوترة والامتثال';
    WHEN 'confirmed' THEN
      v_step_key := 'confirm';
      v_action_label := 'تأكيد الاستلام';
      v_result_label := 'تم تأكيد الاستلام والوزن';
      v_impact_label := 'تحديث ESG + إغلاق دورة الحياة';
    ELSE
      RETURN NEW;
  END CASE;

  -- Insert impact event (non-blocking)
  BEGIN
    INSERT INTO public.impact_events (
      organization_id,
      chain_key,
      step_key,
      resource_type,
      resource_id,
      actor_id,
      action_label,
      result_label,
      impact_label,
      impact_data,
      cascade_triggered,
      cascade_targets,
      metadata
    ) VALUES (
      v_org_id,
      'shipment_lifecycle',
      v_step_key,
      'shipment',
      NEW.id::text,
      NEW.created_by,
      v_action_label,
      v_result_label,
      v_impact_label,
      jsonb_build_object(
        'old_status', OLD.status,
        'new_status', NEW.status,
        'waste_type', NEW.waste_type,
        'quantity', NEW.quantity,
        'unit', NEW.unit
      ),
      true,
      CASE 
        WHEN NEW.status = 'delivered' THEN '["invoicing", "compliance"]'::jsonb
        WHEN NEW.status = 'confirmed' THEN '["esg_update", "certificate"]'::jsonb
        ELSE '[]'::jsonb
      END,
      jsonb_build_object('trigger', 'cascade_automation', 'shipment_number', NEW.shipment_number)
    );
  EXCEPTION WHEN OTHERS THEN
    -- Don't block the main operation
    RAISE WARNING 'Impact event insert failed: %', SQLERRM;
  END;

  RETURN NEW;
END;
$$;

-- Create the trigger
DROP TRIGGER IF EXISTS trg_cascade_shipment_impact ON public.shipments;
CREATE TRIGGER trg_cascade_shipment_impact
  AFTER UPDATE ON public.shipments
  FOR EACH ROW
  EXECUTE FUNCTION public.fn_cascade_shipment_impact();

-- ══════════════════════════════════════════════════════════════
-- Cascading Impact for Deposits
-- ══════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION public.fn_cascade_deposit_impact()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  BEGIN
    INSERT INTO public.impact_events (
      organization_id,
      chain_key,
      step_key,
      resource_type,
      resource_id,
      actor_id,
      action_label,
      result_label,
      impact_label,
      impact_data,
      cascade_triggered,
      cascade_targets,
      metadata
    ) VALUES (
      NEW.organization_id,
      'deposit_flow',
      'record',
      'deposit',
      NEW.id::text,
      NEW.created_by,
      'تسجيل إيداع مالي',
      'تم تسجيل إيداع بقيمة ' || NEW.amount,
      'تحديث الرصيد المالي للشريك',
      jsonb_build_object(
        'amount', NEW.amount,
        'transfer_method', NEW.transfer_method,
        'partner_org_id', NEW.partner_organization_id,
        'external_partner_id', NEW.external_partner_id
      ),
      true,
      '["balance_update", "accounting_ledger"]'::jsonb,
      jsonb_build_object('trigger', 'cascade_automation')
    );
  EXCEPTION WHEN OTHERS THEN
    RAISE WARNING 'Deposit impact event insert failed: %', SQLERRM;
  END;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_cascade_deposit_impact ON public.deposits;
CREATE TRIGGER trg_cascade_deposit_impact
  AFTER INSERT ON public.deposits
  FOR EACH ROW
  EXECUTE FUNCTION public.fn_cascade_deposit_impact();
