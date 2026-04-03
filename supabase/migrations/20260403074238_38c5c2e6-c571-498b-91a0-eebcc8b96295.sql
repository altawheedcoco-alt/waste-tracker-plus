
-- 1. Create access_attempts table for logging all access attempts
CREATE TABLE public.shared_link_access_attempts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  shared_link_id uuid REFERENCES public.shared_links(id) ON DELETE CASCADE NOT NULL,
  ip_address text,
  user_agent text,
  viewer_user_id uuid,
  attempt_type text NOT NULL DEFAULT 'view',
  success boolean NOT NULL DEFAULT false,
  failure_reason text,
  pin_attempted boolean DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- 2. Add failed_pin_attempts and locked_until to shared_links for brute-force protection
ALTER TABLE public.shared_links 
  ADD COLUMN IF NOT EXISTS failed_pin_attempts integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS locked_until timestamptz;

-- 3. Index for fast lookups
CREATE INDEX idx_access_attempts_link ON public.shared_link_access_attempts(shared_link_id);
CREATE INDEX idx_access_attempts_ip ON public.shared_link_access_attempts(ip_address);
CREATE INDEX idx_shared_links_locked ON public.shared_links(locked_until) WHERE locked_until IS NOT NULL;

-- 4. RLS on access_attempts - only service role writes, org members read
ALTER TABLE public.shared_link_access_attempts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role full access on access_attempts"
  ON public.shared_link_access_attempts
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Org members can view access attempts for their links"
  ON public.shared_link_access_attempts
  FOR SELECT
  TO authenticated
  USING (
    shared_link_id IN (
      SELECT id FROM public.shared_links 
      WHERE organization_id IN (
        SELECT organization_id FROM public.profiles WHERE id = auth.uid()
      )
    )
  );
