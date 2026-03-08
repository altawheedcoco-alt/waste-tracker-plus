
-- =============================================
-- AI Platform Configuration Table
-- =============================================
CREATE TABLE public.ai_platform_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  auto_classify_waste BOOLEAN DEFAULT false,
  auto_analyze_shipments BOOLEAN DEFAULT false,
  auto_quality_inspect BOOLEAN DEFAULT false,
  auto_document_classify BOOLEAN DEFAULT false,
  auto_sentiment_analysis BOOLEAN DEFAULT false,
  preferred_model TEXT DEFAULT 'google/gemini-3-flash-preview',
  vision_model TEXT DEFAULT 'google/gemini-2.5-pro',
  fast_model TEXT DEFAULT 'google/gemini-2.5-flash-lite',
  max_requests_per_day INTEGER DEFAULT 500,
  max_requests_per_minute INTEGER DEFAULT 10,
  current_daily_usage INTEGER DEFAULT 0,
  usage_reset_at TIMESTAMPTZ DEFAULT now(),
  response_language TEXT DEFAULT 'ar',
  industry_context TEXT DEFAULT 'waste_management',
  custom_system_prompt TEXT,
  notify_on_anomaly BOOLEAN DEFAULT true,
  notify_on_quality_issue BOOLEAN DEFAULT true,
  anomaly_threshold NUMERIC DEFAULT 0.8,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(organization_id)
);

-- =============================================
-- AI Usage Tracking Table
-- =============================================
CREATE TABLE public.ai_usage_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES public.organizations(id) ON DELETE SET NULL,
  user_id UUID,
  function_name TEXT NOT NULL,
  model_used TEXT NOT NULL,
  request_type TEXT NOT NULL,
  tokens_input INTEGER DEFAULT 0,
  tokens_output INTEGER DEFAULT 0,
  total_tokens INTEGER DEFAULT 0,
  response_time_ms INTEGER DEFAULT 0,
  status TEXT DEFAULT 'success',
  error_message TEXT,
  estimated_cost_usd NUMERIC(10, 6) DEFAULT 0,
  resource_type TEXT,
  resource_id UUID,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- =============================================
-- AI Auto-Actions Queue
-- =============================================
CREATE TABLE public.ai_action_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
  action_type TEXT NOT NULL,
  resource_type TEXT NOT NULL,
  resource_id UUID NOT NULL,
  status TEXT DEFAULT 'pending',
  priority INTEGER DEFAULT 5,
  input_data JSONB DEFAULT '{}',
  output_data JSONB,
  attempts INTEGER DEFAULT 0,
  max_attempts INTEGER DEFAULT 3,
  last_error TEXT,
  processed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes
CREATE INDEX idx_ai_platform_config_org ON public.ai_platform_config(organization_id);
CREATE INDEX idx_ai_usage_log_org ON public.ai_usage_log(organization_id);
CREATE INDEX idx_ai_usage_log_created ON public.ai_usage_log(created_at DESC);
CREATE INDEX idx_ai_usage_log_function ON public.ai_usage_log(function_name);
CREATE INDEX idx_ai_action_queue_status ON public.ai_action_queue(status, priority DESC);
CREATE INDEX idx_ai_action_queue_org ON public.ai_action_queue(organization_id);

-- RLS
ALTER TABLE public.ai_platform_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_usage_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_action_queue ENABLE ROW LEVEL SECURITY;

-- ai_platform_config policies
CREATE POLICY "Org members can view AI config" ON public.ai_platform_config
  FOR SELECT TO authenticated
  USING (organization_id IN (
    SELECT organization_id FROM public.profiles WHERE user_id = auth.uid()
  ));

CREATE POLICY "Org admins can update AI config" ON public.ai_platform_config
  FOR UPDATE TO authenticated
  USING (organization_id IN (
    SELECT p.organization_id FROM public.profiles p
    WHERE p.user_id = auth.uid() 
      AND p.employee_type IN ('owner', 'admin', 'manager')
  ));

CREATE POLICY "Org admins can insert AI config" ON public.ai_platform_config
  FOR INSERT TO authenticated
  WITH CHECK (organization_id IN (
    SELECT p.organization_id FROM public.profiles p
    WHERE p.user_id = auth.uid()
      AND p.employee_type IN ('owner', 'admin', 'manager')
  ));

CREATE POLICY "Service role manages AI config" ON public.ai_platform_config
  FOR ALL TO service_role USING (true) WITH CHECK (true);

-- ai_usage_log policies
CREATE POLICY "Org members can view AI usage" ON public.ai_usage_log
  FOR SELECT TO authenticated
  USING (organization_id IN (
    SELECT organization_id FROM public.profiles WHERE user_id = auth.uid()
  ));

CREATE POLICY "Service role manages AI usage" ON public.ai_usage_log
  FOR ALL TO service_role USING (true) WITH CHECK (true);

-- ai_action_queue policies
CREATE POLICY "Org members can view AI queue" ON public.ai_action_queue
  FOR SELECT TO authenticated
  USING (organization_id IN (
    SELECT organization_id FROM public.profiles WHERE user_id = auth.uid()
  ));

CREATE POLICY "Service role manages AI queue" ON public.ai_action_queue
  FOR ALL TO service_role USING (true) WITH CHECK (true);

-- Enable realtime for action queue
ALTER PUBLICATION supabase_realtime ADD TABLE public.ai_action_queue;
