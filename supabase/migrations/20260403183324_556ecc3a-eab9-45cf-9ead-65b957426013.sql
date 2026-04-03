
-- Enable pg_net for HTTP calls from DB
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;

-- Function to call edge function on shipment confirm
CREATE OR REPLACE FUNCTION public.notify_gamification_on_shipment()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _user_id UUID;
  _org_id UUID;
  _quantity NUMERIC;
  _supabase_url TEXT;
  _anon_key TEXT;
BEGIN
  -- Only trigger on status change to 'confirmed'
  IF NEW.status = 'confirmed' AND (OLD.status IS DISTINCT FROM 'confirmed') THEN
    _user_id := COALESCE(NEW.created_by, NEW.generator_id::UUID);
    _org_id := NEW.generator_id;
    _quantity := COALESCE(NEW.quantity, 0);

    -- Get project URL from vault or hardcode
    _supabase_url := current_setting('app.settings.supabase_url', true);
    
    IF _supabase_url IS NULL OR _supabase_url = '' THEN
      _supabase_url := 'https://dgununqfxohodimmgxuk.supabase.co';
    END IF;

    _anon_key := current_setting('app.settings.anon_key', true);
    IF _anon_key IS NULL OR _anon_key = '' THEN
      _anon_key := 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRndW51bnFmeG9ob2RpbW1neHVrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM5Mzc4MDMsImV4cCI6MjA4OTUxMzgwM30.sGJm0IxrxHN_LV54s2M7xvgm7iQ1SK9KycR3jBu02Ug';
    END IF;

    -- Call edge function via pg_net
    PERFORM extensions.http_post(
      url := _supabase_url || '/functions/v1/update-gamification',
      body := json_build_object(
        'user_id', _user_id,
        'organization_id', _org_id,
        'quantity_tons', _quantity
      )::text,
      headers := json_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || _anon_key
      )::jsonb
    );
  END IF;

  RETURN NEW;
END;
$$;

-- Create trigger
DROP TRIGGER IF EXISTS trg_gamification_on_shipment_confirm ON public.shipments;
CREATE TRIGGER trg_gamification_on_shipment_confirm
  AFTER UPDATE ON public.shipments
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_gamification_on_shipment();
