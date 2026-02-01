
-- Create table for external weight/quantity records
CREATE TABLE public.external_weight_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  company_name TEXT NOT NULL,
  company_id UUID REFERENCES public.organizations(id) ON DELETE SET NULL,
  quantity NUMERIC NOT NULL CHECK (quantity > 0),
  unit TEXT NOT NULL DEFAULT 'كجم',
  waste_type TEXT NOT NULL,
  waste_description TEXT,
  record_date DATE NOT NULL,
  is_linked_to_system BOOLEAN NOT NULL DEFAULT false,
  linked_at TIMESTAMP WITH TIME ZONE,
  linked_by UUID REFERENCES public.profiles(id),
  notes TEXT,
  created_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.external_weight_records ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their organization records"
ON public.external_weight_records
FOR SELECT
USING (organization_id = get_user_org_id_safe(auth.uid()) OR has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Users can create records for their organization"
ON public.external_weight_records
FOR INSERT
WITH CHECK (organization_id = get_user_org_id_safe(auth.uid()));

CREATE POLICY "Users can update their organization records"
ON public.external_weight_records
FOR UPDATE
USING (organization_id = get_user_org_id_safe(auth.uid()));

CREATE POLICY "Users can delete their organization records"
ON public.external_weight_records
FOR DELETE
USING (organization_id = get_user_org_id_safe(auth.uid()));

-- Trigger for updated_at
CREATE TRIGGER update_external_weight_records_updated_at
BEFORE UPDATE ON public.external_weight_records
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create index for better query performance
CREATE INDEX idx_external_weight_records_org ON public.external_weight_records(organization_id);
CREATE INDEX idx_external_weight_records_date ON public.external_weight_records(record_date);
CREATE INDEX idx_external_weight_records_linked ON public.external_weight_records(is_linked_to_system);
