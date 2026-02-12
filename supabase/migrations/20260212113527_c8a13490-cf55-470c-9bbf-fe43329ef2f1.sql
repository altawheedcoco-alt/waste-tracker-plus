
-- Document print log - tracks every printed/exported document
CREATE TABLE public.document_print_log (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES public.organizations(id),
  user_id UUID NOT NULL,
  document_type TEXT NOT NULL, -- 'shipment', 'invoice', 'certificate', 'contract', 'receipt', 'report'
  document_id TEXT, -- reference to the actual document
  document_number TEXT, -- the document's own number
  print_tracking_code TEXT NOT NULL UNIQUE, -- unique tracking code on the printed doc
  template_id TEXT NOT NULL DEFAULT 'standard', -- which layout template was used
  theme_id TEXT NOT NULL DEFAULT 'corporate', -- which color theme was used
  action_type TEXT NOT NULL DEFAULT 'print', -- 'print', 'pdf_export', 'email', 'whatsapp', 'save'
  printed_by_name TEXT,
  printed_by_employee_code TEXT, -- employee code shown on document
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Entity print preferences - stores default template/theme per entity
CREATE TABLE public.entity_print_preferences (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES public.organizations(id),
  user_id UUID, -- null = org-wide default
  default_template_id TEXT NOT NULL DEFAULT 'standard',
  default_theme_id TEXT NOT NULL DEFAULT 'corporate',
  default_font TEXT NOT NULL DEFAULT 'Cairo',
  show_qr_code BOOLEAN DEFAULT true,
  show_barcode BOOLEAN DEFAULT true,
  show_watermark BOOLEAN DEFAULT false,
  watermark_text TEXT DEFAULT 'سري',
  header_layout TEXT DEFAULT 'centered', -- 'centered', 'left-aligned', 'split'
  table_style TEXT DEFAULT 'striped', -- 'striped', 'bordered', 'minimal', 'modern'
  employee_code_prefix TEXT DEFAULT 'EMP',
  auto_print_tracking BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(organization_id, user_id)
);

-- Enable RLS
ALTER TABLE public.document_print_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.entity_print_preferences ENABLE ROW LEVEL SECURITY;

-- RLS policies for document_print_log
CREATE POLICY "Users can view their org print logs" ON public.document_print_log
  FOR SELECT USING (
    organization_id IN (
      SELECT organization_id FROM public.profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "Users can insert print logs" ON public.document_print_log
  FOR INSERT WITH CHECK (
    organization_id IN (
      SELECT organization_id FROM public.profiles WHERE id = auth.uid()
    )
  );

-- RLS policies for entity_print_preferences  
CREATE POLICY "Users can view their org print prefs" ON public.entity_print_preferences
  FOR SELECT USING (
    organization_id IN (
      SELECT organization_id FROM public.profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "Users can manage their org print prefs" ON public.entity_print_preferences
  FOR ALL USING (
    organization_id IN (
      SELECT organization_id FROM public.profiles WHERE id = auth.uid()
    )
  );

-- Index for fast lookups
CREATE INDEX idx_print_log_org ON public.document_print_log(organization_id, created_at DESC);
CREATE INDEX idx_print_log_tracking ON public.document_print_log(print_tracking_code);
CREATE INDEX idx_print_prefs_org ON public.entity_print_preferences(organization_id);
