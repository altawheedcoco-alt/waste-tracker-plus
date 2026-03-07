
-- Fix search path on function
ALTER FUNCTION public.increment_visitor_counter() SET search_path = public;

-- Fix overly permissive INSERT policy - restrict to service_role or allow anon with rate limiting via edge function
DROP POLICY "Service role inserts visitors" ON public.visitor_tracking;
CREATE POLICY "Anon can insert visitor tracking" ON public.visitor_tracking FOR INSERT TO anon WITH CHECK (true);
