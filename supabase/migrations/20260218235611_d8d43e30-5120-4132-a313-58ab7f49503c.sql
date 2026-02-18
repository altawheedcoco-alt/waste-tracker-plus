
-- Add failed attempts tracking to portal_clients
ALTER TABLE public.portal_clients
ADD COLUMN IF NOT EXISTS failed_login_attempts INTEGER NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS locked_until TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS last_failed_attempt TIMESTAMPTZ;

-- Create rate limiting table for portal auth (IP-based)
CREATE TABLE IF NOT EXISTS public.portal_auth_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ip_address TEXT NOT NULL,
  portal_slug TEXT NOT NULL,
  attempted_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.portal_auth_attempts ENABLE ROW LEVEL SECURITY;
-- No SELECT policy for authenticated users - only service role access

-- Index for fast lookups
CREATE INDEX IF NOT EXISTS idx_portal_auth_attempts_lookup 
ON public.portal_auth_attempts (ip_address, portal_slug, attempted_at);

-- Auto-cleanup old attempts (older than 1 hour)
CREATE OR REPLACE FUNCTION public.cleanup_portal_auth_attempts()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  DELETE FROM public.portal_auth_attempts
  WHERE attempted_at < now() - INTERVAL '1 hour';
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_cleanup_portal_auth_attempts
AFTER INSERT ON public.portal_auth_attempts
FOR EACH STATEMENT
EXECUTE FUNCTION public.cleanup_portal_auth_attempts();
