
-- Smart Document Analysis Results
CREATE TABLE public.document_analysis (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  document_id UUID, -- reference to entity_documents if exists
  file_name TEXT NOT NULL,
  file_url TEXT,
  storage_path TEXT,
  
  -- NLP Analysis Results
  document_type TEXT, -- contract, invoice, license, permit, report, letter, certificate, manifest
  document_language TEXT DEFAULT 'ar',
  summary TEXT,
  key_entities JSONB DEFAULT '[]', -- extracted entities: names, dates, amounts, organizations
  keywords TEXT[] DEFAULT '{}',
  sentiment TEXT, -- positive, neutral, negative, formal
  compliance_flags JSONB DEFAULT '[]', -- regulatory compliance issues detected
  risk_level TEXT DEFAULT 'low', -- low, medium, high, critical
  risk_details TEXT,
  
  -- Classification & Archiving
  category TEXT, -- legal, financial, operational, environmental, hr, compliance
  subcategory TEXT,
  auto_tags TEXT[] DEFAULT '{}',
  suggested_expiry_date DATE,
  requires_action BOOLEAN DEFAULT false,
  action_description TEXT,
  action_deadline DATE,
  
  -- Relationships extracted
  related_parties JSONB DEFAULT '[]', -- organizations/people mentioned
  referenced_laws TEXT[] DEFAULT '{}', -- legal references found
  financial_amounts JSONB DEFAULT '[]', -- amounts extracted
  dates_mentioned JSONB DEFAULT '[]', -- important dates found
  
  -- Metadata
  analyzed_by TEXT DEFAULT 'ai', -- ai or manual
  analysis_model TEXT,
  confidence_score NUMERIC DEFAULT 0,
  analysis_status TEXT DEFAULT 'pending', -- pending, analyzing, completed, failed
  analyzed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  created_by UUID REFERENCES public.profiles(id),
  
  -- Search
  search_text TEXT -- full text for search
);

-- Smart Archive Collections
CREATE TABLE public.smart_archive_collections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  collection_name TEXT NOT NULL,
  collection_name_en TEXT,
  description TEXT,
  icon TEXT DEFAULT 'folder',
  color TEXT DEFAULT 'blue',
  auto_rules JSONB DEFAULT '{}', -- auto-classification rules
  document_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  created_by UUID REFERENCES public.profiles(id)
);

-- Document-Collection mapping
CREATE TABLE public.document_collection_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  collection_id UUID NOT NULL REFERENCES public.smart_archive_collections(id) ON DELETE CASCADE,
  analysis_id UUID NOT NULL REFERENCES public.document_analysis(id) ON DELETE CASCADE,
  added_at TIMESTAMPTZ DEFAULT now(),
  added_by TEXT DEFAULT 'auto', -- auto or manual
  UNIQUE(collection_id, analysis_id)
);

-- Enable RLS
ALTER TABLE public.document_analysis ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.smart_archive_collections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.document_collection_items ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "org_members_read_analysis" ON public.document_analysis FOR SELECT USING (public.is_org_member(auth.uid(), organization_id));
CREATE POLICY "org_members_insert_analysis" ON public.document_analysis FOR INSERT WITH CHECK (public.is_org_member(auth.uid(), organization_id));
CREATE POLICY "org_members_update_analysis" ON public.document_analysis FOR UPDATE USING (public.is_org_member(auth.uid(), organization_id));
CREATE POLICY "admin_full_access_analysis" ON public.document_analysis FOR ALL USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "org_members_read_collections" ON public.smart_archive_collections FOR SELECT USING (public.is_org_member(auth.uid(), organization_id));
CREATE POLICY "org_members_manage_collections" ON public.smart_archive_collections FOR ALL USING (public.is_org_member(auth.uid(), organization_id));
CREATE POLICY "admin_full_access_collections" ON public.smart_archive_collections FOR ALL USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "members_read_collection_items" ON public.document_collection_items FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.smart_archive_collections c WHERE c.id = collection_id AND public.is_org_member(auth.uid(), c.organization_id))
);
CREATE POLICY "members_manage_collection_items" ON public.document_collection_items FOR ALL USING (
  EXISTS (SELECT 1 FROM public.smart_archive_collections c WHERE c.id = collection_id AND public.is_org_member(auth.uid(), c.organization_id))
);

-- Indexes
CREATE INDEX idx_doc_analysis_org ON public.document_analysis(organization_id);
CREATE INDEX idx_doc_analysis_type ON public.document_analysis(document_type);
CREATE INDEX idx_doc_analysis_category ON public.document_analysis(category);
CREATE INDEX idx_doc_analysis_status ON public.document_analysis(analysis_status);
CREATE INDEX idx_doc_analysis_risk ON public.document_analysis(risk_level);
CREATE INDEX idx_doc_analysis_search ON public.document_analysis USING gin(to_tsvector('arabic', coalesce(search_text, '')));
CREATE INDEX idx_smart_collections_org ON public.smart_archive_collections(organization_id);
