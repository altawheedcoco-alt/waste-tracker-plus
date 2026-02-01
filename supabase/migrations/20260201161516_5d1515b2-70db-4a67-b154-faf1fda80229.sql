-- Create contract templates table for transporters
CREATE TABLE public.contract_templates (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    created_by UUID REFERENCES public.profiles(id),
    name TEXT NOT NULL,
    description TEXT,
    partner_type TEXT NOT NULL DEFAULT 'generator' CHECK (partner_type IN ('generator', 'recycler', 'both')),
    template_type TEXT NOT NULL DEFAULT 'custom' CHECK (template_type IN ('system', 'custom')),
    contract_category TEXT NOT NULL DEFAULT 'collection' CHECK (contract_category IN ('collection', 'transport', 'collection_transport', 'recycling', 'other')),
    header_text TEXT,
    introduction_text TEXT,
    terms_template TEXT,
    obligations_party_one TEXT,
    obligations_party_two TEXT,
    payment_terms_template TEXT,
    duration_clause TEXT,
    termination_clause TEXT,
    dispute_resolution TEXT,
    closing_text TEXT,
    include_stamp BOOLEAN DEFAULT true,
    include_signature BOOLEAN DEFAULT true,
    include_header_logo BOOLEAN DEFAULT true,
    is_active BOOLEAN DEFAULT true,
    usage_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.contract_templates ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their organization templates"
ON public.contract_templates FOR SELECT
USING (
    organization_id = get_user_org_id_safe(auth.uid()) 
    OR has_role(auth.uid(), 'admin'::app_role)
    OR template_type = 'system'
);

CREATE POLICY "Users can create templates for their organization"
ON public.contract_templates FOR INSERT
WITH CHECK (
    organization_id = get_user_org_id_safe(auth.uid()) 
    OR has_role(auth.uid(), 'admin'::app_role)
);

CREATE POLICY "Users can update their organization templates"
ON public.contract_templates FOR UPDATE
USING (
    organization_id = get_user_org_id_safe(auth.uid()) 
    OR has_role(auth.uid(), 'admin'::app_role)
);

CREATE POLICY "Users can delete their organization templates"
ON public.contract_templates FOR DELETE
USING (
    organization_id = get_user_org_id_safe(auth.uid()) 
    OR has_role(auth.uid(), 'admin'::app_role)
);

-- Create trigger for updated_at
CREATE TRIGGER update_contract_templates_updated_at
    BEFORE UPDATE ON public.contract_templates
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();