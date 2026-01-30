-- Create table for custom report templates
CREATE TABLE public.report_templates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  created_by UUID REFERENCES public.profiles(id),
  
  -- Template info
  name TEXT NOT NULL,
  description TEXT,
  template_type TEXT NOT NULL DEFAULT 'custom', -- 'system', 'custom'
  waste_category TEXT NOT NULL, -- 'hazardous', 'non_hazardous', 'medical_hazardous', 'all'
  waste_types JSONB DEFAULT '[]'::jsonb, -- specific waste types this template applies to
  
  -- Template content
  opening_declaration TEXT, -- الإقرار الافتتاحي
  processing_details_template TEXT, -- قالب تفاصيل المعالجة
  closing_declaration TEXT, -- الإقرار الختامي
  custom_fields JSONB DEFAULT '[]'::jsonb, -- حقول مخصصة إضافية
  
  -- Settings
  include_qr_code BOOLEAN DEFAULT true,
  include_barcode BOOLEAN DEFAULT true,
  include_stamp BOOLEAN DEFAULT true,
  include_signature BOOLEAN DEFAULT true,
  
  -- Metadata
  is_active BOOLEAN DEFAULT true,
  usage_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.report_templates ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their organization templates"
ON public.report_templates FOR SELECT
USING (
  organization_id = get_user_org_id_safe(auth.uid()) 
  OR template_type = 'system'
  OR has_role(auth.uid(), 'admin'::app_role)
);

CREATE POLICY "Users can create templates for their organization"
ON public.report_templates FOR INSERT
WITH CHECK (
  organization_id = get_user_org_id_safe(auth.uid())
  AND (has_role(auth.uid(), 'company_admin'::app_role) OR has_role(auth.uid(), 'admin'::app_role))
);

CREATE POLICY "Users can update their organization templates"
ON public.report_templates FOR UPDATE
USING (
  organization_id = get_user_org_id_safe(auth.uid())
  AND template_type = 'custom'
  AND (has_role(auth.uid(), 'company_admin'::app_role) OR has_role(auth.uid(), 'admin'::app_role))
);

CREATE POLICY "Users can delete their organization templates"
ON public.report_templates FOR DELETE
USING (
  organization_id = get_user_org_id_safe(auth.uid())
  AND template_type = 'custom'
  AND (has_role(auth.uid(), 'company_admin'::app_role) OR has_role(auth.uid(), 'admin'::app_role))
);

-- Create trigger for updated_at
CREATE TRIGGER update_report_templates_updated_at
BEFORE UPDATE ON public.report_templates
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();