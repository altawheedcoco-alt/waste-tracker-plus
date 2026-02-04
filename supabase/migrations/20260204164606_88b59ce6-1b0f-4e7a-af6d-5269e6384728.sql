-- Create security audit results table
CREATE TABLE IF NOT EXISTS public.security_audits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  audit_type TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('passed', 'warning', 'failed', 'error')),
  findings JSONB NOT NULL DEFAULT '[]',
  summary TEXT,
  checks_passed INTEGER DEFAULT 0,
  checks_failed INTEGER DEFAULT 0,
  checks_warning INTEGER DEFAULT 0,
  run_duration_ms INTEGER,
  triggered_by TEXT DEFAULT 'scheduled',
  organization_id UUID REFERENCES organizations(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_security_audits_type ON security_audits(audit_type, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_security_audits_status ON security_audits(status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_security_audits_org ON security_audits(organization_id, created_at DESC);

-- Enable RLS
ALTER TABLE public.security_audits ENABLE ROW LEVEL SECURITY;

-- Users can view their org's audits
CREATE POLICY "Users can view own org security audits"
  ON public.security_audits
  FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id FROM profiles 
      WHERE id = auth.uid()
    )
    OR organization_id IS NULL
  );

-- Create security check settings table
CREATE TABLE IF NOT EXISTS public.security_check_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  check_name TEXT NOT NULL UNIQUE,
  is_enabled BOOLEAN DEFAULT true,
  severity TEXT NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  check_interval_hours INTEGER DEFAULT 24,
  last_run_at TIMESTAMPTZ,
  next_run_at TIMESTAMPTZ,
  config JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Insert default security checks
INSERT INTO security_check_settings (check_name, severity, check_interval_hours, config) VALUES
  ('inactive_users', 'medium', 24, '{"inactive_days": 90}'),
  ('expired_api_keys', 'high', 6, '{}'),
  ('failed_login_attempts', 'high', 1, '{"threshold": 10, "window_hours": 1}'),
  ('expired_licenses', 'medium', 24, '{}'),
  ('expired_contracts', 'medium', 24, '{"warning_days": 30}'),
  ('weak_passwords', 'critical', 168, '{}'),
  ('2fa_adoption', 'medium', 24, '{"target_percentage": 80}'),
  ('stale_sessions', 'low', 6, '{"max_age_days": 7}'),
  ('api_abuse_detection', 'high', 1, '{"requests_threshold": 1000, "window_minutes": 60}'),
  ('permission_anomalies', 'high', 24, '{}')
ON CONFLICT (check_name) DO NOTHING;

-- Enable RLS on settings
ALTER TABLE public.security_check_settings ENABLE ROW LEVEL SECURITY;

-- Only authenticated users can view settings
CREATE POLICY "Authenticated users can view security settings"
  ON public.security_check_settings
  FOR SELECT
  TO authenticated
  USING (true);

-- Function to run security audit
CREATE OR REPLACE FUNCTION public.run_security_audit()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_start_time TIMESTAMPTZ := clock_timestamp();
  v_findings JSONB := '[]';
  v_passed INTEGER := 0;
  v_failed INTEGER := 0;
  v_warning INTEGER := 0;
  v_status TEXT := 'passed';
  v_audit_id UUID;
  v_check RECORD;
  v_result JSONB;
BEGIN
  -- Check 1: Inactive users (no login in 90 days)
  SELECT jsonb_build_object(
    'check', 'inactive_users',
    'severity', 'medium',
    'count', COUNT(*),
    'status', CASE WHEN COUNT(*) > 10 THEN 'warning' ELSE 'passed' END,
    'details', jsonb_agg(jsonb_build_object('user_id', user_id, 'email', email))
  ) INTO v_result
  FROM (
    SELECT p.user_id, p.email
    FROM profiles p
    WHERE p.is_active = true
    AND p.updated_at < now() - interval '90 days'
    LIMIT 50
  ) inactive;
  
  v_findings := v_findings || v_result;
  IF v_result->>'status' = 'warning' THEN v_warning := v_warning + 1; ELSE v_passed := v_passed + 1; END IF;

  -- Check 2: Expired API keys still active
  SELECT jsonb_build_object(
    'check', 'expired_api_keys',
    'severity', 'high',
    'count', COUNT(*),
    'status', CASE WHEN COUNT(*) > 0 THEN 'failed' ELSE 'passed' END,
    'details', jsonb_agg(jsonb_build_object('key_id', id, 'key_prefix', key_prefix, 'expired_at', expires_at))
  ) INTO v_result
  FROM api_keys
  WHERE is_active = true
  AND expires_at IS NOT NULL
  AND expires_at < now();
  
  v_findings := v_findings || v_result;
  IF v_result->>'status' = 'failed' THEN v_failed := v_failed + 1; ELSE v_passed := v_passed + 1; END IF;

  -- Check 3: High failed login attempts
  SELECT jsonb_build_object(
    'check', 'failed_login_attempts',
    'severity', 'high',
    'count', COUNT(*),
    'status', CASE WHEN COUNT(*) > 50 THEN 'failed' WHEN COUNT(*) > 20 THEN 'warning' ELSE 'passed' END,
    'details', jsonb_build_object('last_hour', COUNT(*))
  ) INTO v_result
  FROM security_events
  WHERE event_type = 'login_failed'
  AND created_at > now() - interval '1 hour';
  
  v_findings := v_findings || v_result;
  IF v_result->>'status' = 'failed' THEN v_failed := v_failed + 1; 
  ELSIF v_result->>'status' = 'warning' THEN v_warning := v_warning + 1;
  ELSE v_passed := v_passed + 1; END IF;

  -- Check 4: Expired driver licenses
  SELECT jsonb_build_object(
    'check', 'expired_licenses',
    'severity', 'medium',
    'count', COUNT(*),
    'status', CASE WHEN COUNT(*) > 5 THEN 'warning' ELSE 'passed' END,
    'details', jsonb_agg(jsonb_build_object('driver_id', id, 'license_expiry', license_expiry))
  ) INTO v_result
  FROM drivers
  WHERE license_expiry < now()::date;
  
  v_findings := v_findings || v_result;
  IF v_result->>'status' = 'warning' THEN v_warning := v_warning + 1; ELSE v_passed := v_passed + 1; END IF;

  -- Check 5: Contracts expiring soon
  SELECT jsonb_build_object(
    'check', 'expiring_contracts',
    'severity', 'medium',
    'count', COUNT(*),
    'status', CASE WHEN COUNT(*) > 10 THEN 'warning' ELSE 'passed' END,
    'details', jsonb_agg(jsonb_build_object('contract_id', id, 'title', title, 'end_date', end_date))
  ) INTO v_result
  FROM contracts
  WHERE status = 'active'
  AND end_date BETWEEN now()::date AND (now() + interval '30 days')::date;
  
  v_findings := v_findings || v_result;
  IF v_result->>'status' = 'warning' THEN v_warning := v_warning + 1; ELSE v_passed := v_passed + 1; END IF;

  -- Check 6: 2FA adoption rate
  SELECT jsonb_build_object(
    'check', '2fa_adoption',
    'severity', 'medium',
    'adoption_rate', ROUND(
      (COUNT(*) FILTER (WHERE EXISTS (
        SELECT 1 FROM user_two_factor_auth t WHERE t.user_id = p.user_id AND t.is_enabled = true
      )) * 100.0 / NULLIF(COUNT(*), 0))::numeric, 2
    ),
    'status', CASE 
      WHEN COUNT(*) FILTER (WHERE EXISTS (
        SELECT 1 FROM user_two_factor_auth t WHERE t.user_id = p.user_id AND t.is_enabled = true
      )) * 100.0 / NULLIF(COUNT(*), 0) < 50 THEN 'warning'
      ELSE 'passed'
    END,
    'total_users', COUNT(*),
    '2fa_enabled', COUNT(*) FILTER (WHERE EXISTS (
      SELECT 1 FROM user_two_factor_auth t WHERE t.user_id = p.user_id AND t.is_enabled = true
    ))
  ) INTO v_result
  FROM profiles p
  WHERE p.is_active = true;
  
  v_findings := v_findings || v_result;
  IF v_result->>'status' = 'warning' THEN v_warning := v_warning + 1; ELSE v_passed := v_passed + 1; END IF;

  -- Check 7: Suspicious activity in last 24h
  SELECT jsonb_build_object(
    'check', 'suspicious_activity',
    'severity', 'critical',
    'count', COUNT(*),
    'status', CASE WHEN COUNT(*) > 0 THEN 'failed' ELSE 'passed' END,
    'unresolved', COUNT(*) FILTER (WHERE is_resolved = false)
  ) INTO v_result
  FROM security_events
  WHERE is_suspicious = true
  AND created_at > now() - interval '24 hours';
  
  v_findings := v_findings || v_result;
  IF v_result->>'status' = 'failed' THEN v_failed := v_failed + 1; ELSE v_passed := v_passed + 1; END IF;

  -- Check 8: API rate limit violations
  SELECT jsonb_build_object(
    'check', 'api_rate_violations',
    'severity', 'high',
    'count', COUNT(*),
    'status', CASE WHEN COUNT(*) > 10 THEN 'warning' ELSE 'passed' END,
    'top_offenders', (
      SELECT jsonb_agg(jsonb_build_object('api_key_id', api_key_id, 'violations', cnt))
      FROM (
        SELECT api_key_id, COUNT(*) as cnt
        FROM api_request_logs
        WHERE status_code = 429
        AND created_at > now() - interval '24 hours'
        GROUP BY api_key_id
        ORDER BY cnt DESC
        LIMIT 5
      ) top
    )
  ) INTO v_result
  FROM api_request_logs
  WHERE status_code = 429
  AND created_at > now() - interval '24 hours';
  
  v_findings := v_findings || v_result;
  IF v_result->>'status' = 'warning' THEN v_warning := v_warning + 1; ELSE v_passed := v_passed + 1; END IF;

  -- Determine overall status
  IF v_failed > 0 THEN
    v_status := 'failed';
  ELSIF v_warning > 0 THEN
    v_status := 'warning';
  ELSE
    v_status := 'passed';
  END IF;

  -- Save audit result
  INSERT INTO security_audits (
    audit_type, status, findings, summary,
    checks_passed, checks_failed, checks_warning,
    run_duration_ms, triggered_by
  ) VALUES (
    'full_scan', v_status, v_findings,
    format('فحص أمني شامل: %s ناجح، %s تحذير، %s فشل', v_passed, v_warning, v_failed),
    v_passed, v_failed, v_warning,
    EXTRACT(MILLISECONDS FROM clock_timestamp() - v_start_time)::integer,
    'scheduled'
  )
  RETURNING id INTO v_audit_id;

  -- Log critical findings as security events
  IF v_failed > 0 THEN
    PERFORM log_security_event(
      'suspicious_activity',
      'high',
      NULL, NULL, NULL, NULL,
      jsonb_build_object('audit_id', v_audit_id, 'failed_checks', v_failed),
      true
    );
  END IF;

  RETURN jsonb_build_object(
    'audit_id', v_audit_id,
    'status', v_status,
    'passed', v_passed,
    'warning', v_warning,
    'failed', v_failed,
    'duration_ms', EXTRACT(MILLISECONDS FROM clock_timestamp() - v_start_time)::integer
  );
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.run_security_audit TO authenticated;