
-- Cyber Threat Intelligence & Auto-Response System

-- Detected threats and attacks
CREATE TABLE public.cyber_threats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
  threat_type TEXT NOT NULL, -- brute_force, sql_injection, xss, data_exfiltration, privilege_escalation, anomalous_access, rate_abuse, suspicious_login, api_abuse
  severity TEXT NOT NULL DEFAULT 'medium', -- low, medium, high, critical
  status TEXT NOT NULL DEFAULT 'detected', -- detected, analyzing, mitigated, resolved, false_positive
  source_ip TEXT,
  source_user_id UUID,
  target_resource TEXT,
  target_table TEXT,
  description TEXT NOT NULL,
  description_en TEXT,
  attack_vector TEXT,
  pattern_signature TEXT, -- fingerprint for deduplication
  evidence JSONB DEFAULT '{}',
  ai_analysis TEXT,
  ai_confidence NUMERIC DEFAULT 0,
  auto_response_taken TEXT, -- what auto-action was taken
  auto_response_at TIMESTAMPTZ,
  resolved_by UUID REFERENCES public.profiles(id),
  resolved_at TIMESTAMPTZ,
  resolution_notes TEXT,
  detected_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Auto-response rules
CREATE TABLE public.cyber_defense_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rule_name TEXT NOT NULL,
  rule_name_en TEXT,
  description TEXT,
  threat_type TEXT NOT NULL,
  severity_trigger TEXT NOT NULL DEFAULT 'high', -- minimum severity to trigger
  action_type TEXT NOT NULL, -- block_ip, lock_account, rate_limit, notify_admin, revoke_token, quarantine_data
  action_config JSONB DEFAULT '{}',
  is_enabled BOOLEAN DEFAULT true,
  cooldown_minutes INTEGER DEFAULT 30,
  last_triggered_at TIMESTAMPTZ,
  trigger_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Threat patterns learned over time
CREATE TABLE public.threat_patterns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pattern_name TEXT NOT NULL,
  pattern_type TEXT NOT NULL, -- access, query, frequency, geographic, behavioral
  pattern_signature JSONB NOT NULL,
  risk_score NUMERIC DEFAULT 0,
  occurrence_count INTEGER DEFAULT 1,
  first_seen_at TIMESTAMPTZ DEFAULT now(),
  last_seen_at TIMESTAMPTZ DEFAULT now(),
  is_whitelisted BOOLEAN DEFAULT false,
  notes TEXT
);

-- Enable RLS
ALTER TABLE public.cyber_threats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cyber_defense_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.threat_patterns ENABLE ROW LEVEL SECURITY;

-- RLS: Only admins can see all threats, org members see their org threats
CREATE POLICY "admins_full_access_threats" ON public.cyber_threats FOR ALL USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "org_members_read_threats" ON public.cyber_threats FOR SELECT USING (public.is_org_member(auth.uid(), organization_id));

CREATE POLICY "admins_full_access_defense_rules" ON public.cyber_defense_rules FOR ALL USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "authenticated_read_defense_rules" ON public.cyber_defense_rules FOR SELECT TO authenticated USING (true);

CREATE POLICY "admins_full_access_patterns" ON public.threat_patterns FOR ALL USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "authenticated_read_patterns" ON public.threat_patterns FOR SELECT TO authenticated USING (true);

-- Indexes
CREATE INDEX idx_cyber_threats_org ON public.cyber_threats(organization_id);
CREATE INDEX idx_cyber_threats_type ON public.cyber_threats(threat_type);
CREATE INDEX idx_cyber_threats_severity ON public.cyber_threats(severity);
CREATE INDEX idx_cyber_threats_status ON public.cyber_threats(status);
CREATE INDEX idx_cyber_threats_detected ON public.cyber_threats(detected_at DESC);
CREATE INDEX idx_threat_patterns_type ON public.threat_patterns(pattern_type);

-- Enable realtime for threats
ALTER PUBLICATION supabase_realtime ADD TABLE public.cyber_threats;

-- Seed default defense rules
INSERT INTO public.cyber_defense_rules (rule_name, rule_name_en, description, threat_type, severity_trigger, action_type, action_config) VALUES
('حظر القوة الغاشمة', 'Block Brute Force', 'حظر IP بعد 10 محاولات فاشلة في 5 دقائق', 'brute_force', 'high', 'block_ip', '{"block_duration_hours": 24}'),
('قفل الحساب المشبوه', 'Lock Suspicious Account', 'قفل الحساب عند اكتشاف تصعيد صلاحيات', 'privilege_escalation', 'critical', 'lock_account', '{"notify_user": true}'),
('تقييد معدل API', 'Rate Limit API', 'تقييد الطلبات عند اكتشاف إساءة استخدام', 'api_abuse', 'medium', 'rate_limit', '{"requests_per_minute": 10}'),
('إخطار المشرفين', 'Notify Admins', 'إرسال تنبيه فوري للمشرفين عند اكتشاف تهديد حرج', 'sql_injection', 'high', 'notify_admin', '{"channels": ["in_app", "email"]}'),
('إلغاء الرموز المسربة', 'Revoke Leaked Tokens', 'إلغاء رموز الوصول عند اكتشاف تسريب بيانات', 'data_exfiltration', 'critical', 'revoke_token', '{"revoke_all_sessions": true}');
