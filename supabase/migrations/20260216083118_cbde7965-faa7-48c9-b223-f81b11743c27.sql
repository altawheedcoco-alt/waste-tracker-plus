
-- Companies table for Ministry of Environment regulated companies
CREATE TABLE public.regulated_companies (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_name TEXT NOT NULL,
  company_name_ar TEXT,
  license_type TEXT NOT NULL CHECK (license_type IN ('medical', 'solid', 'electronic', 'hazardous', 'construction', 'other')),
  license_number TEXT,
  license_expiry_date DATE,
  license_status TEXT NOT NULL DEFAULT 'active' CHECK (license_status IN ('active', 'expired', 'suspended', 'pending')),
  governorate TEXT NOT NULL,
  city TEXT,
  address TEXT,
  contact_person TEXT,
  contact_phone TEXT,
  contact_email TEXT,
  commercial_register TEXT,
  tax_number TEXT,
  activity_description TEXT,
  notes TEXT,
  is_compliant BOOLEAN DEFAULT true,
  last_inspection_date DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id),
  organization_id UUID REFERENCES public.organizations(id)
);

-- Enable RLS
ALTER TABLE public.regulated_companies ENABLE ROW LEVEL SECURITY;

-- Admin can see all
CREATE POLICY "Admins can manage regulated companies"
  ON public.regulated_companies
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.user_organizations uo
      JOIN public.user_roles ur ON ur.user_id = uo.user_id
      WHERE uo.user_id = auth.uid() AND ur.role = 'admin'
    )
  );

-- Org members can view their own org's companies
CREATE POLICY "Org members can view their companies"
  ON public.regulated_companies
  FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id FROM public.user_organizations WHERE user_id = auth.uid()
    )
  );

-- Trigger for updated_at
CREATE TRIGGER update_regulated_companies_updated_at
  BEFORE UPDATE ON public.regulated_companies
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
