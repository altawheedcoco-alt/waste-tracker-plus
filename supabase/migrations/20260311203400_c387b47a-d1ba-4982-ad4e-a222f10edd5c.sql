
-- ═══════════════════════════════════════════════════════════════
-- نظام الحوكمة السيادية لمدير النظام
-- 1) الأدوار السيادية الفرعية
-- 2) التفويض السيادي
-- 3) الإنذار المبكر
-- 4) سجل القرارات الذكية
-- ═══════════════════════════════════════════════════════════════

-- 1) Sovereign Sub-Roles
CREATE TYPE public.sovereign_role AS ENUM (
  'super_admin',
  'financial_auditor', 
  'compliance_officer',
  'technical_supervisor',
  'operations_monitor'
);

CREATE TABLE public.admin_sovereign_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  role sovereign_role NOT NULL,
  granted_by UUID,
  permissions JSONB DEFAULT '[]'::jsonb,
  is_active BOOLEAN DEFAULT true,
  notes TEXT,
  granted_at TIMESTAMPTZ DEFAULT now(),
  revoked_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, role)
);

ALTER TABLE public.admin_sovereign_roles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage sovereign roles"
ON public.admin_sovereign_roles
FOR ALL TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles p
    JOIN public.user_roles ur ON ur.user_id = p.user_id
    WHERE p.user_id = auth.uid() AND ur.role = 'admin'
  )
);

-- 2) Sovereign Delegation System
CREATE TABLE public.sovereign_delegations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  delegator_id UUID NOT NULL,
  delegate_id UUID NOT NULL,
  scope TEXT[] NOT NULL DEFAULT '{}',
  reason TEXT,
  is_active BOOLEAN DEFAULT true,
  starts_at TIMESTAMPTZ DEFAULT now(),
  expires_at TIMESTAMPTZ,
  revoked_at TIMESTAMPTZ,
  revoked_reason TEXT,
  audit_trail JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.sovereign_delegations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage delegations"
ON public.sovereign_delegations
FOR ALL TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = auth.uid() AND ur.role = 'admin'
  )
);

-- 3) Early Warning System
CREATE TYPE public.alert_severity AS ENUM ('info', 'warning', 'critical', 'emergency');
CREATE TYPE public.alert_category AS ENUM (
  'compliance_breach', 'financial_anomaly', 'security_threat',
  'operational_risk', 'license_expiry', 'performance_decline',
  'data_integrity', 'system_health'
);

CREATE TABLE public.early_warning_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category alert_category NOT NULL,
  severity alert_severity NOT NULL DEFAULT 'warning',
  title TEXT NOT NULL,
  description TEXT,
  affected_entity_id UUID,
  affected_entity_type TEXT,
  affected_organization_id UUID,
  detection_method TEXT DEFAULT 'automated',
  suggested_actions JSONB DEFAULT '[]'::jsonb,
  is_resolved BOOLEAN DEFAULT false,
  resolved_by UUID,
  resolved_at TIMESTAMPTZ,
  resolution_notes TEXT,
  auto_action_taken JSONB,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.early_warning_alerts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage early warnings"
ON public.early_warning_alerts
FOR ALL TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = auth.uid() AND ur.role = 'admin'
  )
);

-- 4) AI Decision Log
CREATE TABLE public.ai_sovereign_decisions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  decision_type TEXT NOT NULL,
  title TEXT NOT NULL,
  analysis TEXT,
  risk_level TEXT DEFAULT 'medium',
  recommendations JSONB DEFAULT '[]'::jsonb,
  data_sources JSONB DEFAULT '[]'::jsonb,
  accepted_by UUID,
  accepted_at TIMESTAMPTZ,
  status TEXT DEFAULT 'pending',
  outcome_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.ai_sovereign_decisions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage AI decisions"
ON public.ai_sovereign_decisions
FOR ALL TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = auth.uid() AND ur.role = 'admin'
  )
);

-- Enable realtime for early warnings
ALTER PUBLICATION supabase_realtime ADD TABLE public.early_warning_alerts;
