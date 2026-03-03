-- Auto-create whatsapp_config for new organizations
CREATE OR REPLACE FUNCTION public.auto_enable_whatsapp_for_new_org()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO whatsapp_config (organization_id, is_active, auto_send_notifications, auto_send_otp, auto_send_subscription_reminders, auto_send_marketing)
  VALUES (NEW.id, true, true, true, true, true)
  ON CONFLICT DO NOTHING;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_auto_whatsapp_config
AFTER INSERT ON organizations
FOR EACH ROW
EXECUTE FUNCTION auto_enable_whatsapp_for_new_org();