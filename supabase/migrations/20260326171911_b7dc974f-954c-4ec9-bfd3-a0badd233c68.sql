
-- ============================================================
-- مدير النظام يستقبل نسخة من كل إشعار يتم إنشاؤه
-- عبر trigger واحد شامل على جدول notifications نفسه
-- ============================================================

CREATE OR REPLACE FUNCTION public.copy_notification_to_admins()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  -- أرسل نسخة لكل مدير سيادي نشط لم يكن هو المستلم الأصلي
  INSERT INTO public.notifications(user_id, title, message, type, priority, shipment_id, request_id, pdf_url, organization_id, metadata, is_read)
    SELECT asr.user_id,
      NEW.title,
      NEW.message,
      NEW.type,
      NEW.priority,
      NEW.shipment_id,
      NEW.request_id,
      NEW.pdf_url,
      NEW.organization_id,
      COALESCE(NEW.metadata::jsonb, '{}'::jsonb) || jsonb_build_object('original_recipient', NEW.user_id, 'is_admin_copy', true),
      false
    FROM public.admin_sovereign_roles asr
    WHERE asr.is_active = true
      AND asr.user_id IS DISTINCT FROM NEW.user_id
      -- تجنب النسخ اللانهائي: لا تنسخ إشعاراً هو نفسه نسخة
      AND (NEW.metadata IS NULL OR NOT (NEW.metadata::jsonb ? 'is_admin_copy'));
  RETURN NEW;
END;$$;

DROP TRIGGER IF EXISTS trg_copy_to_admins ON public.notifications;
CREATE TRIGGER trg_copy_to_admins AFTER INSERT ON public.notifications
  FOR EACH ROW EXECUTE FUNCTION public.copy_notification_to_admins();
