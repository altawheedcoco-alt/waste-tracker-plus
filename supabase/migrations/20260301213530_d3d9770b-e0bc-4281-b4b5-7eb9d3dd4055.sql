CREATE OR REPLACE FUNCTION public.fn_cascade_shipment_impact()
RETURNS TRIGGER AS $$
DECLARE
  v_org_id uuid;
  v_step_key text;
  v_action_label text;
  v_result_label text;
  v_impact_label text;
BEGIN
  IF OLD.status = NEW.status THEN
    RETURN NEW;
  END IF;

  v_org_id := COALESCE(NEW.transporter_id, NEW.generator_id);
  IF v_org_id IS NULL THEN
    RETURN NEW;
  END IF;

  CASE NEW.status::text
    WHEN 'new' THEN
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

  BEGIN
    INSERT INTO public.impact_events (
      organization_id, chain_key, step_key, resource_type, resource_id,
      actor_id, action_label, result_label, impact_label, impact_data,
      cascade_triggered, cascade_targets, metadata
    ) VALUES (
      v_org_id, 'shipment_lifecycle', v_step_key, 'shipment', NEW.id::text,
      NEW.created_by, v_action_label, v_result_label, v_impact_label,
      jsonb_build_object('old_status', OLD.status::text, 'new_status', NEW.status::text, 'waste_type', NEW.waste_type, 'quantity', NEW.quantity, 'unit', NEW.unit),
      true,
      CASE 
        WHEN NEW.status = 'delivered' THEN '["invoicing", "compliance"]'::jsonb
        WHEN NEW.status = 'confirmed' THEN '["esg_update", "certificate"]'::jsonb
        ELSE '[]'::jsonb
      END,
      jsonb_build_object('trigger', 'cascade_automation', 'shipment_number', NEW.shipment_number)
    );
  EXCEPTION WHEN OTHERS THEN
    RAISE WARNING 'Impact event insert failed: %', SQLERRM;
  END;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;