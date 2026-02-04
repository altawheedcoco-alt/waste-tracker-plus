-- Create system health metrics table
CREATE TABLE public.system_health_metrics (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  metric_type TEXT NOT NULL,
  metric_name TEXT NOT NULL,
  metric_value NUMERIC NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'healthy' CHECK (status IN ('healthy', 'warning', 'critical', 'unknown')),
  details JSONB DEFAULT '{}',
  recorded_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create system health summary table for aggregated data
CREATE TABLE public.system_health_summary (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  overall_health_score NUMERIC NOT NULL DEFAULT 100,
  total_checks INTEGER NOT NULL DEFAULT 0,
  passed_checks INTEGER NOT NULL DEFAULT 0,
  warning_checks INTEGER NOT NULL DEFAULT 0,
  critical_checks INTEGER NOT NULL DEFAULT 0,
  modules_status JSONB DEFAULT '{}',
  edge_functions_status JSONB DEFAULT '{}',
  database_status JSONB DEFAULT '{}',
  last_check_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create indexes for performance
CREATE INDEX idx_system_health_metrics_type ON public.system_health_metrics(metric_type);
CREATE INDEX idx_system_health_metrics_recorded ON public.system_health_metrics(recorded_at DESC);
CREATE INDEX idx_system_health_metrics_status ON public.system_health_metrics(status);

-- Enable RLS
ALTER TABLE public.system_health_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_health_summary ENABLE ROW LEVEL SECURITY;

-- RLS policies - only admins can view
CREATE POLICY "Admins can view health metrics"
ON public.system_health_metrics
FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can view health summary"
ON public.system_health_summary
FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));

-- Service role can insert/update (for edge functions)
CREATE POLICY "Service role can manage health metrics"
ON public.system_health_metrics
FOR ALL
USING (true)
WITH CHECK (true);

CREATE POLICY "Service role can manage health summary"
ON public.system_health_summary
FOR ALL
USING (true)
WITH CHECK (true);

-- Enable realtime for live updates
ALTER PUBLICATION supabase_realtime ADD TABLE public.system_health_summary;

-- Insert initial summary record
INSERT INTO public.system_health_summary (
  overall_health_score,
  total_checks,
  passed_checks,
  modules_status
) VALUES (
  100,
  0,
  0,
  '{}'::jsonb
);