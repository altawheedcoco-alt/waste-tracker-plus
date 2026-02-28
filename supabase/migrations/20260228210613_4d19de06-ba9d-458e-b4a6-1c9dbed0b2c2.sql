
-- ══════════════════════════════════════════════════════════
-- Impact Chain Engine — Core Tables
-- ══════════════════════════════════════════════════════════

-- 1. تعريفات السلاسل (قوالب ثابتة لكل نوع عملية)
CREATE TABLE public.impact_chain_definitions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  chain_key TEXT NOT NULL UNIQUE,               -- e.g. 'shipment_lifecycle', 'deposit_flow'
  chain_name_ar TEXT NOT NULL,
  chain_name_en TEXT,
  description_ar TEXT,
  category TEXT NOT NULL DEFAULT 'operations',   -- operations, financial, compliance, environmental
  is_active BOOLEAN NOT NULL DEFAULT true,
  steps JSONB NOT NULL DEFAULT '[]',             -- ordered array of {step_key, button_ar, function_ar, result_ar, impact_ar, icon, order}
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. أحداث الأثر الفعلية (كل إجراء يسجل هنا)
CREATE TABLE public.impact_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  chain_key TEXT NOT NULL,                       -- references impact_chain_definitions.chain_key
  step_key TEXT NOT NULL,                        -- which step in the chain
  resource_type TEXT NOT NULL,                   -- 'shipment', 'deposit', 'invoice', 'work_order', etc.
  resource_id UUID NOT NULL,                     -- the entity id
  actor_id UUID,                                 -- user who triggered the action
  action_label TEXT NOT NULL,                    -- human-readable: 'إنشاء شحنة', 'تأكيد التسليم'
  result_label TEXT,                             -- 'إشعار الناقل', 'فتح بوابة الفاتورة'
  impact_label TEXT,                             -- '+1 شحنة في KPI', '+5 طن في ESG'
  impact_data JSONB DEFAULT '{}',               -- structured impact: {kpi_delta, esg_delta, financial_delta, compliance_delta}
  cascade_triggered BOOLEAN DEFAULT false,       -- did this event trigger downstream actions?
  cascade_targets JSONB DEFAULT '[]',           -- [{event_id, type}] downstream events triggered
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3. ملخصات الأثر التراكمية (لكل منظمة — يُحدَّث دورياً)
CREATE TABLE public.impact_summaries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  period_type TEXT NOT NULL DEFAULT 'monthly',   -- daily, weekly, monthly, quarterly, yearly
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  category TEXT NOT NULL,                        -- operations, financial, compliance, environmental
  total_events INTEGER DEFAULT 0,
  total_cascades INTEGER DEFAULT 0,
  kpi_summary JSONB DEFAULT '{}',               -- {shipments_created, shipments_completed, avg_completion_days...}
  financial_summary JSONB DEFAULT '{}',          -- {total_revenue, total_deposits, balance_change...}
  compliance_summary JSONB DEFAULT '{}',         -- {gates_passed, certificates_issued, incidents...}
  esg_summary JSONB DEFAULT '{}',               -- {tons_recycled, carbon_saved_kg, trees_equivalent...}
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(organization_id, period_type, period_start, category)
);

-- Indexes for performance
CREATE INDEX idx_impact_events_org ON public.impact_events(organization_id, created_at DESC);
CREATE INDEX idx_impact_events_resource ON public.impact_events(resource_type, resource_id);
CREATE INDEX idx_impact_events_chain ON public.impact_events(chain_key, step_key);
CREATE INDEX idx_impact_summaries_org_period ON public.impact_summaries(organization_id, period_type, period_start);

-- Enable RLS
ALTER TABLE public.impact_chain_definitions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.impact_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.impact_summaries ENABLE ROW LEVEL SECURITY;

-- RLS: Definitions are readable by all authenticated users (template data)
CREATE POLICY "Authenticated users can read chain definitions"
  ON public.impact_chain_definitions FOR SELECT
  TO authenticated USING (true);

-- RLS: Only admins can manage definitions
CREATE POLICY "Admins can manage chain definitions"
  ON public.impact_chain_definitions FOR ALL
  TO authenticated USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- RLS: Events — org members can read their org's events
CREATE POLICY "Org members can read impact events"
  ON public.impact_events FOR SELECT
  TO authenticated USING (
    organization_id IN (
      SELECT organization_id FROM public.user_organizations WHERE user_id = auth.uid()
    )
  );

-- RLS: Events — org members can insert events for their org
CREATE POLICY "Org members can create impact events"
  ON public.impact_events FOR INSERT
  TO authenticated WITH CHECK (
    organization_id IN (
      SELECT organization_id FROM public.user_organizations WHERE user_id = auth.uid()
    )
  );

-- RLS: Admins can manage all events
CREATE POLICY "Admins can manage all impact events"
  ON public.impact_events FOR ALL
  TO authenticated USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- RLS: Summaries — org members can read their org's summaries
CREATE POLICY "Org members can read impact summaries"
  ON public.impact_summaries FOR SELECT
  TO authenticated USING (
    organization_id IN (
      SELECT organization_id FROM public.user_organizations WHERE user_id = auth.uid()
    )
  );

-- RLS: Admins can manage all summaries
CREATE POLICY "Admins can manage all impact summaries"
  ON public.impact_summaries FOR ALL
  TO authenticated USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Trigger for updated_at
CREATE TRIGGER update_impact_chain_definitions_updated_at
  BEFORE UPDATE ON public.impact_chain_definitions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_impact_summaries_updated_at
  BEFORE UPDATE ON public.impact_summaries
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
