
-- Contact preferences for opt-out management
CREATE TABLE public.whatsapp_contact_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  phone TEXT NOT NULL,
  contact_name TEXT,
  opted_out_categories TEXT[] DEFAULT '{}',
  opted_out_all BOOLEAN DEFAULT false,
  opt_out_reason TEXT,
  opted_out_at TIMESTAMPTZ,
  sentiment_summary TEXT,
  last_ai_analysis JSONB,
  last_analyzed_at TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(phone)
);

ALTER TABLE public.whatsapp_contact_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage contact preferences"
  ON public.whatsapp_contact_preferences
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- AI analysis results table
CREATE TABLE public.whatsapp_ai_analysis (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  phone TEXT NOT NULL,
  analysis_type TEXT NOT NULL DEFAULT 'sentiment',
  sentiment TEXT,
  sentiment_score NUMERIC(3,2),
  customer_opinion TEXT,
  suggestions TEXT[],
  opt_out_detected BOOLEAN DEFAULT false,
  opt_out_category TEXT,
  key_topics TEXT[],
  raw_analysis JSONB,
  messages_analyzed INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.whatsapp_ai_analysis ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage ai analysis"
  ON public.whatsapp_ai_analysis
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);
