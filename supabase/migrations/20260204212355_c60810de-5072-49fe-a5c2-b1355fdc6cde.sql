-- Create enum for call direction
CREATE TYPE public.call_direction AS ENUM ('inbound', 'outbound');

-- Create enum for call status
CREATE TYPE public.call_status AS ENUM ('initiated', 'ringing', 'in-progress', 'completed', 'busy', 'no-answer', 'failed', 'canceled');

-- Create enum for sentiment
CREATE TYPE public.call_sentiment AS ENUM ('positive', 'neutral', 'negative');

-- ============================================
-- 1. Call Logs Table - سجل المكالمات
-- ============================================
CREATE TABLE public.call_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  agent_id UUID REFERENCES public.profiles(id),
  customer_id UUID REFERENCES public.customers(id),
  shipment_id UUID REFERENCES public.shipments(id),
  external_weight_record_id UUID REFERENCES public.external_weight_records(id),
  driver_id UUID REFERENCES public.drivers(id),
  
  -- Twilio specific fields
  call_sid TEXT UNIQUE,
  parent_call_sid TEXT,
  account_sid TEXT,
  
  -- Call details
  direction call_direction NOT NULL DEFAULT 'outbound',
  from_number TEXT NOT NULL,
  to_number TEXT NOT NULL,
  status call_status NOT NULL DEFAULT 'initiated',
  
  -- Timing
  started_at TIMESTAMPTZ DEFAULT now(),
  answered_at TIMESTAMPTZ,
  ended_at TIMESTAMPTZ,
  duration_seconds INTEGER DEFAULT 0,
  
  -- Recording
  recording_url TEXT,
  recording_sid TEXT,
  recording_duration INTEGER,
  
  -- GPS snapshot at call time
  gps_snapshot JSONB,
  
  -- Notes and tags
  notes TEXT,
  tags TEXT[],
  
  -- Auto-linking metadata
  auto_linked BOOLEAN DEFAULT false,
  link_confidence FLOAT,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================
-- 2. Call Transcriptions Table - تحويل الصوت لنص
-- ============================================
CREATE TABLE public.call_transcriptions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  call_log_id UUID NOT NULL REFERENCES public.call_logs(id) ON DELETE CASCADE,
  
  full_text TEXT,
  words_with_timestamps JSONB, -- [{word, start, end, speaker}]
  language TEXT DEFAULT 'ar',
  confidence_score FLOAT,
  
  -- Processing status
  processing_status TEXT DEFAULT 'pending', -- pending, processing, completed, failed
  error_message TEXT,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================
-- 3. Call Analysis Table - تحليل المكالمات
-- ============================================
CREATE TABLE public.call_analysis (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  call_log_id UUID NOT NULL REFERENCES public.call_logs(id) ON DELETE CASCADE,
  
  -- Keywords extraction
  keywords JSONB, -- [{keyword, count, relevance}]
  
  -- Sentiment analysis
  sentiment call_sentiment,
  sentiment_score FLOAT, -- -1 to 1
  sentiment_breakdown JSONB, -- {positive_phrases: [], negative_phrases: []}
  
  -- KPI scores
  kpi_scores JSONB, -- {greeting: 0-100, professionalism: 0-100, resolution: 0-100, etc}
  overall_score FLOAT,
  
  -- AI Summary
  ai_summary TEXT,
  action_items JSONB, -- [{item, priority, assigned_to}]
  
  -- Issue detection
  detected_issues JSONB, -- [{issue_type, severity, description}]
  escalation_required BOOLEAN DEFAULT false,
  
  -- Customer satisfaction prediction
  predicted_satisfaction FLOAT, -- 0-100
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================
-- 4. Agent Performance Table - أداء الموظفين
-- ============================================
CREATE TABLE public.agent_performance (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  agent_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  
  period_date DATE NOT NULL,
  period_type TEXT DEFAULT 'daily', -- daily, weekly, monthly
  
  -- Call metrics
  total_calls INTEGER DEFAULT 0,
  inbound_calls INTEGER DEFAULT 0,
  outbound_calls INTEGER DEFAULT 0,
  answered_calls INTEGER DEFAULT 0,
  missed_calls INTEGER DEFAULT 0,
  
  -- Duration metrics
  total_duration_seconds INTEGER DEFAULT 0,
  avg_duration_seconds INTEGER DEFAULT 0,
  avg_wait_time_seconds INTEGER DEFAULT 0,
  
  -- Quality metrics
  avg_sentiment_score FLOAT,
  avg_kpi_score FLOAT,
  customer_satisfaction FLOAT,
  
  -- Detailed KPI breakdown
  kpi_breakdown JSONB,
  
  -- Ranking
  rank_in_team INTEGER,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  
  UNIQUE(agent_id, period_date, period_type)
);

-- ============================================
-- 5. Call Center Settings Table - إعدادات مركز الاتصال
-- ============================================
CREATE TABLE public.call_center_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE UNIQUE,
  
  -- Twilio settings
  twilio_phone_number TEXT,
  twilio_configured BOOLEAN DEFAULT false,
  
  -- Auto-linking settings
  auto_link_by_phone BOOLEAN DEFAULT true,
  auto_link_by_active_shipment BOOLEAN DEFAULT true,
  
  -- Recording settings
  record_all_calls BOOLEAN DEFAULT true,
  transcribe_all_calls BOOLEAN DEFAULT true,
  analyze_all_calls BOOLEAN DEFAULT true,
  
  -- KPI thresholds
  kpi_thresholds JSONB DEFAULT '{"greeting": 80, "professionalism": 75, "resolution": 70}'::jsonb,
  
  -- Keywords to track
  tracked_keywords TEXT[],
  
  -- Working hours
  working_hours JSONB,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================
-- Indexes for performance
-- ============================================
CREATE INDEX idx_call_logs_organization ON public.call_logs(organization_id);
CREATE INDEX idx_call_logs_agent ON public.call_logs(agent_id);
CREATE INDEX idx_call_logs_customer ON public.call_logs(customer_id);
CREATE INDEX idx_call_logs_shipment ON public.call_logs(shipment_id);
CREATE INDEX idx_call_logs_driver ON public.call_logs(driver_id);
CREATE INDEX idx_call_logs_call_sid ON public.call_logs(call_sid);
CREATE INDEX idx_call_logs_from_number ON public.call_logs(from_number);
CREATE INDEX idx_call_logs_to_number ON public.call_logs(to_number);
CREATE INDEX idx_call_logs_started_at ON public.call_logs(started_at DESC);
CREATE INDEX idx_call_logs_status ON public.call_logs(status);

CREATE INDEX idx_call_transcriptions_call_log ON public.call_transcriptions(call_log_id);
CREATE INDEX idx_call_analysis_call_log ON public.call_analysis(call_log_id);
CREATE INDEX idx_agent_performance_agent ON public.agent_performance(agent_id);
CREATE INDEX idx_agent_performance_date ON public.agent_performance(period_date DESC);

-- ============================================
-- Enable RLS
-- ============================================
ALTER TABLE public.call_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.call_transcriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.call_analysis ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agent_performance ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.call_center_settings ENABLE ROW LEVEL SECURITY;

-- ============================================
-- RLS Policies
-- ============================================

-- Call Logs policies
CREATE POLICY "Users can view their organization call logs"
ON public.call_logs FOR SELECT
USING (
  public.user_belongs_to_org(auth.uid(), organization_id)
  OR public.has_role(auth.uid(), 'admin')
);

CREATE POLICY "Users can create call logs for their organization"
ON public.call_logs FOR INSERT
WITH CHECK (
  public.user_belongs_to_org(auth.uid(), organization_id)
  OR public.has_role(auth.uid(), 'admin')
);

CREATE POLICY "Users can update their organization call logs"
ON public.call_logs FOR UPDATE
USING (
  public.user_belongs_to_org(auth.uid(), organization_id)
  OR public.has_role(auth.uid(), 'admin')
);

-- Call Transcriptions policies
CREATE POLICY "Users can view transcriptions for their organization calls"
ON public.call_transcriptions FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.call_logs cl
    WHERE cl.id = call_log_id
    AND (public.user_belongs_to_org(auth.uid(), cl.organization_id) OR public.has_role(auth.uid(), 'admin'))
  )
);

CREATE POLICY "Users can create transcriptions for their organization calls"
ON public.call_transcriptions FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.call_logs cl
    WHERE cl.id = call_log_id
    AND (public.user_belongs_to_org(auth.uid(), cl.organization_id) OR public.has_role(auth.uid(), 'admin'))
  )
);

-- Call Analysis policies
CREATE POLICY "Users can view analysis for their organization calls"
ON public.call_analysis FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.call_logs cl
    WHERE cl.id = call_log_id
    AND (public.user_belongs_to_org(auth.uid(), cl.organization_id) OR public.has_role(auth.uid(), 'admin'))
  )
);

CREATE POLICY "Users can create analysis for their organization calls"
ON public.call_analysis FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.call_logs cl
    WHERE cl.id = call_log_id
    AND (public.user_belongs_to_org(auth.uid(), cl.organization_id) OR public.has_role(auth.uid(), 'admin'))
  )
);

-- Agent Performance policies
CREATE POLICY "Users can view their organization agent performance"
ON public.agent_performance FOR SELECT
USING (
  public.user_belongs_to_org(auth.uid(), organization_id)
  OR public.has_role(auth.uid(), 'admin')
);

CREATE POLICY "System can manage agent performance"
ON public.agent_performance FOR ALL
USING (public.has_role(auth.uid(), 'admin'));

-- Call Center Settings policies
CREATE POLICY "Users can view their organization settings"
ON public.call_center_settings FOR SELECT
USING (
  public.user_belongs_to_org(auth.uid(), organization_id)
  OR public.has_role(auth.uid(), 'admin')
);

CREATE POLICY "Admins can manage call center settings"
ON public.call_center_settings FOR ALL
USING (
  public.is_company_or_system_admin(auth.uid())
  OR public.has_role(auth.uid(), 'admin')
);

-- ============================================
-- Triggers
-- ============================================
CREATE TRIGGER update_call_logs_updated_at
  BEFORE UPDATE ON public.call_logs
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_call_transcriptions_updated_at
  BEFORE UPDATE ON public.call_transcriptions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_call_analysis_updated_at
  BEFORE UPDATE ON public.call_analysis
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_agent_performance_updated_at
  BEFORE UPDATE ON public.agent_performance
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_call_center_settings_updated_at
  BEFORE UPDATE ON public.call_center_settings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================
-- Function to auto-link calls
-- ============================================
CREATE OR REPLACE FUNCTION public.auto_link_call_to_entities()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_customer_id UUID;
  v_shipment_id UUID;
  v_driver_id UUID;
  v_driver_profile_id UUID;
  v_weight_record_id UUID;
  v_gps_data JSONB;
  v_confidence FLOAT := 0;
BEGIN
  -- Try to find customer by phone number
  SELECT c.id INTO v_customer_id
  FROM public.customers c
  WHERE c.organization_id = NEW.organization_id
  AND (c.phone = NEW.from_number OR c.phone = NEW.to_number)
  LIMIT 1;
  
  IF v_customer_id IS NOT NULL THEN
    NEW.customer_id := v_customer_id;
    v_confidence := v_confidence + 0.3;
  END IF;

  -- Try to find driver by phone number
  SELECT d.id, p.id INTO v_driver_id, v_driver_profile_id
  FROM public.drivers d
  JOIN public.profiles p ON p.id = d.profile_id
  WHERE d.organization_id = NEW.organization_id
  AND (p.phone = NEW.from_number OR p.phone = NEW.to_number)
  LIMIT 1;
  
  IF v_driver_id IS NOT NULL THEN
    NEW.driver_id := v_driver_id;
    v_confidence := v_confidence + 0.3;
    
    -- Get latest GPS location for the driver
    SELECT jsonb_build_object(
      'latitude', latitude,
      'longitude', longitude,
      'recorded_at', recorded_at,
      'speed', speed
    ) INTO v_gps_data
    FROM public.driver_location_logs
    WHERE driver_id = v_driver_id
    ORDER BY recorded_at DESC
    LIMIT 1;
    
    NEW.gps_snapshot := v_gps_data;
  END IF;

  -- Try to find active shipment
  SELECT s.id INTO v_shipment_id
  FROM public.shipments s
  WHERE s.organization_id = NEW.organization_id
  AND s.status IN ('pending', 'approved', 'collecting', 'in_transit')
  AND (
    s.driver_id = v_driver_id
    OR EXISTS (
      SELECT 1 FROM public.customers c
      WHERE c.id = v_customer_id
      AND (s.generator_id = c.organization_id OR s.recycler_id = c.organization_id)
    )
  )
  ORDER BY s.created_at DESC
  LIMIT 1;
  
  IF v_shipment_id IS NOT NULL THEN
    NEW.shipment_id := v_shipment_id;
    v_confidence := v_confidence + 0.4;
    
    -- Try to find weight record for this shipment
    SELECT id INTO v_weight_record_id
    FROM public.external_weight_records
    WHERE shipment_id = v_shipment_id
    ORDER BY created_at DESC
    LIMIT 1;
    
    IF v_weight_record_id IS NOT NULL THEN
      NEW.external_weight_record_id := v_weight_record_id;
    END IF;
  END IF;

  NEW.auto_linked := (v_confidence > 0);
  NEW.link_confidence := v_confidence;

  RETURN NEW;
END;
$$;

CREATE TRIGGER auto_link_call_on_insert
  BEFORE INSERT ON public.call_logs
  FOR EACH ROW EXECUTE FUNCTION public.auto_link_call_to_entities();

-- ============================================
-- Function to update agent performance
-- ============================================
CREATE OR REPLACE FUNCTION public.update_agent_performance_on_call()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.status = 'completed' AND NEW.agent_id IS NOT NULL THEN
    INSERT INTO public.agent_performance (
      agent_id, organization_id, period_date, period_type,
      total_calls, inbound_calls, outbound_calls, answered_calls,
      total_duration_seconds
    )
    VALUES (
      NEW.agent_id, NEW.organization_id, CURRENT_DATE, 'daily',
      1,
      CASE WHEN NEW.direction = 'inbound' THEN 1 ELSE 0 END,
      CASE WHEN NEW.direction = 'outbound' THEN 1 ELSE 0 END,
      1,
      COALESCE(NEW.duration_seconds, 0)
    )
    ON CONFLICT (agent_id, period_date, period_type)
    DO UPDATE SET
      total_calls = agent_performance.total_calls + 1,
      inbound_calls = agent_performance.inbound_calls + 
        CASE WHEN NEW.direction = 'inbound' THEN 1 ELSE 0 END,
      outbound_calls = agent_performance.outbound_calls + 
        CASE WHEN NEW.direction = 'outbound' THEN 1 ELSE 0 END,
      answered_calls = agent_performance.answered_calls + 1,
      total_duration_seconds = agent_performance.total_duration_seconds + COALESCE(NEW.duration_seconds, 0),
      avg_duration_seconds = (agent_performance.total_duration_seconds + COALESCE(NEW.duration_seconds, 0)) / (agent_performance.total_calls + 1),
      updated_at = now();
  END IF;
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER update_performance_on_call_complete
  AFTER UPDATE ON public.call_logs
  FOR EACH ROW
  WHEN (OLD.status IS DISTINCT FROM NEW.status AND NEW.status = 'completed')
  EXECUTE FUNCTION public.update_agent_performance_on_call();