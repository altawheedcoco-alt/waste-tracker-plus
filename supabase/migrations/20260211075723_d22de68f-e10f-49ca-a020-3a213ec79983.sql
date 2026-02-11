
-- Disposal automation rules engine
CREATE TABLE public.disposal_automation_rules (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES public.organizations(id),
  rule_name TEXT NOT NULL,
  description TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  priority INTEGER NOT NULL DEFAULT 10,
  -- Conditions (JSON for flexibility)
  conditions JSONB NOT NULL DEFAULT '{}', -- e.g. {"waste_type": "chemical", "weight_min": 10, "hazard_level": "hazardous"}
  -- Actions
  action_type TEXT NOT NULL, -- 'route_to_method', 'auto_invoice', 'notify', 'auto_certificate'
  action_config JSONB NOT NULL DEFAULT '{}', -- e.g. {"disposal_method": "incineration", "incinerator_id": "1"}
  -- Audit
  times_triggered INTEGER NOT NULL DEFAULT 0,
  last_triggered_at TIMESTAMPTZ,
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.disposal_automation_rules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their org rules"
  ON public.disposal_automation_rules FOR ALL
  USING (organization_id IN (
    SELECT organization_id FROM public.profiles WHERE id = auth.uid()
  ));

-- Automation audit log
CREATE TABLE public.disposal_automation_log (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES public.organizations(id),
  operation_id UUID,
  rule_id UUID REFERENCES public.disposal_automation_rules(id),
  execution_mode TEXT NOT NULL, -- 'ai', 'auto', 'manual', 'hybrid'
  action_taken TEXT NOT NULL,
  action_details JSONB,
  ai_suggestion TEXT, -- AI's recommendation (if AI mode)
  human_approved BOOLEAN, -- true if human confirmed, null if auto
  approved_by UUID,
  approved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.disposal_automation_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their org automation logs"
  ON public.disposal_automation_log FOR SELECT
  USING (organization_id IN (
    SELECT organization_id FROM public.profiles WHERE id = auth.uid()
  ));

CREATE POLICY "Users can insert automation logs for their org"
  ON public.disposal_automation_log FOR INSERT
  WITH CHECK (organization_id IN (
    SELECT organization_id FROM public.profiles WHERE id = auth.uid()
  ));

-- Add operation_mode to disposal_facilities for global toggle
ALTER TABLE public.disposal_facilities
  ADD COLUMN IF NOT EXISTS operation_mode TEXT NOT NULL DEFAULT 'hybrid'; -- 'ai', 'auto', 'manual', 'hybrid'

CREATE INDEX idx_disposal_automation_rules_org ON public.disposal_automation_rules(organization_id, is_active);
CREATE INDEX idx_disposal_automation_log_org ON public.disposal_automation_log(organization_id, created_at DESC);
