
CREATE TABLE public.driver_signal_status (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  driver_id UUID NOT NULL REFERENCES public.drivers(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES public.organizations(id),
  last_seen_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_latitude DOUBLE PRECISION,
  last_longitude DOUBLE PRECISION,
  is_online BOOLEAN NOT NULL DEFAULT true,
  signal_lost_at TIMESTAMPTZ,
  signal_lost_notified BOOLEAN DEFAULT false,
  battery_level INTEGER,
  tracking_mode TEXT DEFAULT 'background',
  consecutive_failures INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(driver_id)
);

ALTER TABLE public.driver_signal_status ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Org members can view signal status" ON public.driver_signal_status
  FOR SELECT USING (
    organization_id IN (SELECT organization_id FROM public.profiles WHERE id = auth.uid())
  );

CREATE POLICY "Drivers can update own signal" ON public.driver_signal_status
  FOR ALL USING (
    driver_id IN (SELECT id FROM public.drivers WHERE profile_id = auth.uid())
  );

CREATE POLICY "Admins can manage signal status" ON public.driver_signal_status
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role IN ('admin', 'company_admin'))
  );

CREATE OR REPLACE FUNCTION public.update_driver_signal()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.driver_signal_status (driver_id, organization_id, last_seen_at, last_latitude, last_longitude, is_online, signal_lost_at, signal_lost_notified, consecutive_failures)
  SELECT NEW.driver_id, d.organization_id, now(), NEW.latitude, NEW.longitude, true, NULL, false, 0
  FROM public.drivers d WHERE d.id = NEW.driver_id
  ON CONFLICT (driver_id) DO UPDATE SET
    last_seen_at = now(),
    last_latitude = NEW.latitude,
    last_longitude = NEW.longitude,
    is_online = true,
    signal_lost_at = NULL,
    signal_lost_notified = false,
    consecutive_failures = 0,
    updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER on_location_update_signal
  AFTER INSERT ON public.driver_location_logs
  FOR EACH ROW
  EXECUTE FUNCTION public.update_driver_signal();

CREATE OR REPLACE FUNCTION public.check_driver_signal_loss(timeout_minutes INTEGER DEFAULT 3)
RETURNS TABLE(driver_id UUID, driver_name TEXT, organization_id UUID, last_seen_at TIMESTAMPTZ, minutes_offline DOUBLE PRECISION) AS $$
BEGIN
  UPDATE public.driver_signal_status
  SET is_online = false,
      signal_lost_at = COALESCE(signal_lost_at, now()),
      updated_at = now()
  WHERE last_seen_at < now() - (timeout_minutes || ' minutes')::INTERVAL
    AND is_online = true;

  RETURN QUERY
  SELECT
    dss.driver_id,
    d.full_name AS driver_name,
    dss.organization_id,
    dss.last_seen_at,
    EXTRACT(EPOCH FROM (now() - dss.last_seen_at)) / 60 AS minutes_offline
  FROM public.driver_signal_status dss
  JOIN public.drivers d ON d.id = dss.driver_id
  WHERE dss.is_online = false
    AND dss.signal_lost_notified = false;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

ALTER PUBLICATION supabase_realtime ADD TABLE public.driver_signal_status;
