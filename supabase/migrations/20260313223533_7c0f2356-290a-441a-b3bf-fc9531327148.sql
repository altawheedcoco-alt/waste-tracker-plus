
CREATE OR REPLACE FUNCTION public.trigger_whatsapp_on_invoice_created()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  -- Invoices don't have shipment_id, so just send basic invoice notification
  BEGIN
    PERFORM net.http_post(
      url := current_setting('app.settings.supabase_url', true) || '/functions/v1/whatsapp-event',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key', true)
      ),
      body := jsonb_build_object(
        'event_type', 'invoice_generated',
        'organization_id', NEW.organization_id,
        'extra', jsonb_build_object('invoice_number', NEW.invoice_number, 'amount', NEW.total_amount)
      )
    );
  EXCEPTION WHEN OTHERS THEN
    -- Non-blocking: don't fail the insert if WhatsApp notification fails
    NULL;
  END;

  RETURN NEW;
END;
$$;
