
-- Visitor tracking table
CREATE TABLE public.visitor_tracking (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  visitor_fingerprint text,
  ip_address text,
  country text,
  city text,
  region text,
  latitude double precision,
  longitude double precision,
  user_agent text,
  browser text,
  os text,
  device_type text,
  screen_resolution text,
  language text,
  referrer text,
  page_url text,
  session_id text,
  is_returning boolean DEFAULT false,
  visit_count integer DEFAULT 1,
  user_id uuid,
  organization_id uuid,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Index for fast counting and admin queries
CREATE INDEX idx_visitor_tracking_created ON public.visitor_tracking(created_at DESC);
CREATE INDEX idx_visitor_tracking_fingerprint ON public.visitor_tracking(visitor_fingerprint);
CREATE INDEX idx_visitor_tracking_country ON public.visitor_tracking(country);

-- Aggregated counter for fast display
CREATE TABLE public.visitor_counter (
  id text PRIMARY KEY DEFAULT 'global',
  total_visits bigint DEFAULT 0,
  unique_visitors bigint DEFAULT 0,
  updated_at timestamptz DEFAULT now()
);

INSERT INTO public.visitor_counter (id, total_visits, unique_visitors) VALUES ('global', 0, 0);

-- Function to increment counter on new visit
CREATE OR REPLACE FUNCTION public.increment_visitor_counter()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE public.visitor_counter 
  SET total_visits = total_visits + 1,
      unique_visitors = CASE 
        WHEN NOT NEW.is_returning THEN unique_visitors + 1 
        ELSE unique_visitors 
      END,
      updated_at = now()
  WHERE id = 'global';
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_increment_visitor_counter
AFTER INSERT ON public.visitor_tracking
FOR EACH ROW EXECUTE FUNCTION public.increment_visitor_counter();

-- RLS: anyone can insert (tracking), only admins can read
ALTER TABLE public.visitor_tracking ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.visitor_counter ENABLE ROW LEVEL SECURITY;

-- Allow insert from edge functions (service role) and anon for counter read
CREATE POLICY "Anyone can read visitor counter" ON public.visitor_counter FOR SELECT USING (true);
CREATE POLICY "Service role inserts visitors" ON public.visitor_tracking FOR INSERT WITH CHECK (true);
CREATE POLICY "Admins can read visitor tracking" ON public.visitor_tracking FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Enable realtime for counter
ALTER PUBLICATION supabase_realtime ADD TABLE public.visitor_counter;
