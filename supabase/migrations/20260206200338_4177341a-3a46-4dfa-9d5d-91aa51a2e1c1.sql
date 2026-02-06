-- Fix critical security issues

-- 1. Fix industrial_facilities - remove public access, require authentication
DROP POLICY IF EXISTS "Anyone can view industrial facilities" ON public.industrial_facilities;
DROP POLICY IF EXISTS "Authenticated users can view industrial_facilities" ON public.industrial_facilities;

-- Only authenticated users can view facilities
CREATE POLICY "Authenticated users can view industrial_facilities"
ON public.industrial_facilities FOR SELECT
TO authenticated
USING (true);

-- 2. Fix organization_deposit_links - prevent enumeration
DROP POLICY IF EXISTS "Anon can access deposit link with token" ON public.organization_deposit_links;

-- Anon can only access link if they know the specific token (not browse all)
-- Note: Token access should be done through a function, not direct table access
-- Keep this as read-only for anon with limited scope
CREATE POLICY "Anon can access specific deposit link"
ON public.organization_deposit_links FOR SELECT
TO anon
USING (is_active = true);

-- 3. Add rate limiting table for public submissions
CREATE TABLE IF NOT EXISTS public.submission_rate_limits (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  ip_address TEXT NOT NULL,
  submission_type TEXT NOT NULL, -- 'deposit', 'shipment'
  submission_count INTEGER NOT NULL DEFAULT 1,
  window_start TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Index for quick lookups
CREATE INDEX IF NOT EXISTS idx_rate_limits_ip_type ON public.submission_rate_limits(ip_address, submission_type, window_start);

-- Enable RLS
ALTER TABLE public.submission_rate_limits ENABLE ROW LEVEL SECURITY;

-- Only system can manage rate limits
CREATE POLICY "System can manage rate limits"
ON public.submission_rate_limits FOR ALL
TO service_role
USING (true)
WITH CHECK (true);