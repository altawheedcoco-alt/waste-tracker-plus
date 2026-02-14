
-- Table to store AI document analysis results
CREATE TABLE public.document_ai_analysis (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES public.organizations(id),
  document_id UUID, -- entity_documents id if applicable
  document_type TEXT NOT NULL, -- source type: entity_document, shipment_document, etc.
  source_url TEXT, -- file URL
  file_name TEXT,
  
  -- Classification
  ai_document_type TEXT,
  ai_confidence NUMERIC,
  ai_suggested_folder TEXT,
  
  -- Extracted Data
  extracted_data JSONB DEFAULT '{}',
  extracted_fields JSONB DEFAULT '{}', -- key-value pairs
  
  -- Summary
  ai_summary TEXT,
  
  -- Risk & Compliance
  risk_level TEXT, -- low, medium, high, critical
  compliance_score NUMERIC,
  compliance_checks JSONB DEFAULT '[]',
  recommendations JSONB DEFAULT '[]',
  
  -- Tags
  ai_tags TEXT[] DEFAULT '{}',
  
  -- Metadata
  analyzed_by UUID REFERENCES auth.users(id),
  analysis_model TEXT DEFAULT 'gemini-3-flash-preview',
  analysis_duration_ms INTEGER,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.document_ai_analysis ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view analysis for their org"
ON public.document_ai_analysis FOR SELECT TO authenticated
USING (organization_id IN (SELECT organization_id FROM profiles WHERE user_id = auth.uid()));

CREATE POLICY "Users can create analysis for their org"
ON public.document_ai_analysis FOR INSERT TO authenticated
WITH CHECK (organization_id IN (SELECT organization_id FROM profiles WHERE user_id = auth.uid()));

CREATE POLICY "Users can update analysis for their org"
ON public.document_ai_analysis FOR UPDATE TO authenticated
USING (organization_id IN (SELECT organization_id FROM profiles WHERE user_id = auth.uid()));

CREATE INDEX idx_doc_ai_analysis_org ON public.document_ai_analysis(organization_id);
CREATE INDEX idx_doc_ai_analysis_doc ON public.document_ai_analysis(document_id);
