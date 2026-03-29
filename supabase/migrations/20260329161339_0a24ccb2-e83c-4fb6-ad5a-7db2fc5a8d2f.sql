
-- Health measurements history table
CREATE TABLE public.health_measurements (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  organization_id UUID REFERENCES public.organizations(id),
  measurement_type TEXT NOT NULL DEFAULT 'ppg',
  heart_rate INTEGER,
  hrv NUMERIC,
  stress INTEGER,
  energy INTEGER,
  productivity INTEGER,
  spo2 INTEGER,
  breathing_rate INTEGER,
  voice_stress INTEGER,
  voice_fatigue INTEGER,
  voice_energy INTEGER,
  confidence INTEGER,
  metadata JSONB DEFAULT '{}',
  measured_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.health_measurements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own measurements"
  ON public.health_measurements FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own measurements"
  ON public.health_measurements FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Team health: managers can see org measurements (anonymized via query)
CREATE POLICY "Org members can read org measurements"
  ON public.health_measurements FOR SELECT
  TO authenticated
  USING (
    organization_id IN (
      SELECT organization_id FROM public.profiles WHERE id = auth.uid()
    )
  );

-- Index for fast queries
CREATE INDEX idx_health_measurements_user ON public.health_measurements(user_id, measured_at DESC);
CREATE INDEX idx_health_measurements_org ON public.health_measurements(organization_id, measured_at DESC);

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.health_measurements;
