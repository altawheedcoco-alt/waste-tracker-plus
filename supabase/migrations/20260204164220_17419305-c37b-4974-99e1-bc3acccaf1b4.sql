-- Create security events table for specialized security logging
CREATE TABLE IF NOT EXISTS public.security_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type TEXT NOT NULL,
  severity TEXT NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  organization_id UUID REFERENCES organizations(id) ON DELETE SET NULL,
  ip_address TEXT,
  user_agent TEXT,
  location_info JSONB,
  event_data JSONB NOT NULL DEFAULT '{}',
  is_suspicious BOOLEAN DEFAULT false,
  is_resolved BOOLEAN DEFAULT false,
  resolved_by UUID REFERENCES auth.users(id),
  resolved_at TIMESTAMPTZ,
  resolution_notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_security_events_user ON security_events(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_security_events_org ON security_events(organization_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_security_events_type ON security_events(event_type, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_security_events_severity ON security_events(severity, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_security_events_suspicious ON security_events(is_suspicious, is_resolved, created_at DESC);

-- Enable RLS
ALTER TABLE public.security_events ENABLE ROW LEVEL SECURITY;

-- Users can view their own security events
CREATE POLICY "Users can view own security events"
  ON public.security_events
  FOR SELECT
  USING (user_id = auth.uid());

-- Organization members can view their org's events
CREATE POLICY "Org members can view own org security events"
  ON public.security_events
  FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id FROM profiles 
      WHERE id = auth.uid()
    )
  );

-- Create enum-like values for event types
COMMENT ON TABLE security_events IS 'Security event types: login_success, login_failed, logout, password_change, password_reset_request, 2fa_enabled, 2fa_disabled, 2fa_failed, api_key_created, api_key_revoked, permission_change, suspicious_activity, brute_force_detected, session_hijack_attempt, unauthorized_access, data_export, bulk_delete, admin_action';

-- Function to log security events
CREATE OR REPLACE FUNCTION public.log_security_event(
  p_event_type TEXT,
  p_severity TEXT,
  p_user_id UUID DEFAULT NULL,
  p_organization_id UUID DEFAULT NULL,
  p_ip_address TEXT DEFAULT NULL,
  p_user_agent TEXT DEFAULT NULL,
  p_event_data JSONB DEFAULT '{}',
  p_is_suspicious BOOLEAN DEFAULT false
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_event_id UUID;
BEGIN
  INSERT INTO security_events (
    event_type, severity, user_id, organization_id, 
    ip_address, user_agent, event_data, is_suspicious
  ) VALUES (
    p_event_type, p_severity, p_user_id, p_organization_id,
    p_ip_address, p_user_agent, p_event_data, p_is_suspicious
  )
  RETURNING id INTO v_event_id;
  
  RETURN v_event_id;
END;
$$;

-- Function to detect brute force attempts
CREATE OR REPLACE FUNCTION public.check_brute_force(
  p_user_id UUID DEFAULT NULL,
  p_ip_address TEXT DEFAULT NULL,
  p_threshold INTEGER DEFAULT 5,
  p_window_minutes INTEGER DEFAULT 15
)
RETURNS TABLE (
  is_blocked BOOLEAN,
  failed_attempts INTEGER,
  last_attempt TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COUNT(*) >= p_threshold AS is_blocked,
    COUNT(*)::INTEGER AS failed_attempts,
    MAX(created_at) AS last_attempt
  FROM security_events
  WHERE event_type = 'login_failed'
    AND created_at > now() - (p_window_minutes || ' minutes')::INTERVAL
    AND (
      (p_user_id IS NOT NULL AND user_id = p_user_id) OR
      (p_ip_address IS NOT NULL AND ip_address = p_ip_address)
    );
END;
$$;

-- Function to get security summary
CREATE OR REPLACE FUNCTION public.get_security_summary(
  p_organization_id UUID DEFAULT NULL,
  p_days INTEGER DEFAULT 7
)
RETURNS TABLE (
  total_events BIGINT,
  critical_events BIGINT,
  high_events BIGINT,
  suspicious_events BIGINT,
  unresolved_events BIGINT,
  login_failures BIGINT,
  api_key_events BIGINT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COUNT(*) AS total_events,
    COUNT(*) FILTER (WHERE severity = 'critical') AS critical_events,
    COUNT(*) FILTER (WHERE severity = 'high') AS high_events,
    COUNT(*) FILTER (WHERE is_suspicious = true) AS suspicious_events,
    COUNT(*) FILTER (WHERE is_suspicious = true AND is_resolved = false) AS unresolved_events,
    COUNT(*) FILTER (WHERE event_type = 'login_failed') AS login_failures,
    COUNT(*) FILTER (WHERE event_type LIKE 'api_key%') AS api_key_events
  FROM security_events
  WHERE created_at > now() - (p_days || ' days')::INTERVAL
    AND (p_organization_id IS NULL OR organization_id = p_organization_id);
END;
$$;

-- Function to resolve security event
CREATE OR REPLACE FUNCTION public.resolve_security_event(
  p_event_id UUID,
  p_resolution_notes TEXT DEFAULT NULL
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE security_events
  SET 
    is_resolved = true,
    resolved_by = auth.uid(),
    resolved_at = now(),
    resolution_notes = p_resolution_notes
  WHERE id = p_event_id;
  
  RETURN FOUND;
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION public.log_security_event TO authenticated;
GRANT EXECUTE ON FUNCTION public.check_brute_force TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_security_summary TO authenticated;
GRANT EXECUTE ON FUNCTION public.resolve_security_event TO authenticated;