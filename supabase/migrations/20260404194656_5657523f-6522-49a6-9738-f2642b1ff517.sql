
-- Add sector-specific regulatory authority approvals for authorized transporters
ALTER TABLE public.organizations
  -- Land Transport Authority (هيئة النقل البري)
  ADD COLUMN IF NOT EXISTS land_transport_authority_approval_number TEXT,
  ADD COLUMN IF NOT EXISTS land_transport_authority_approval_expiry DATE,
  ADD COLUMN IF NOT EXISTS land_transport_authority_approval_url TEXT,
  
  -- Industrial Development Authority (هيئة التنمية الصناعية)  
  ADD COLUMN IF NOT EXISTS ida_approval_number TEXT,
  ADD COLUMN IF NOT EXISTS ida_approval_expiry DATE,
  ADD COLUMN IF NOT EXISTS ida_approval_url TEXT,
  
  -- Medical waste - Ministry of Health (وزارة الصحة)
  ADD COLUMN IF NOT EXISTS health_ministry_approval_number TEXT,
  ADD COLUMN IF NOT EXISTS health_ministry_approval_expiry DATE,
  ADD COLUMN IF NOT EXISTS health_ministry_approval_url TEXT,
  
  -- Petroleum waste - Petroleum Authority (هيئة البترول)
  ADD COLUMN IF NOT EXISTS petroleum_authority_approval_number TEXT,
  ADD COLUMN IF NOT EXISTS petroleum_authority_approval_expiry DATE,
  ADD COLUMN IF NOT EXISTS petroleum_authority_approval_url TEXT,
  
  -- Pharmaceutical waste - Drug Authority (هيئة الدواء المصرية)
  ADD COLUMN IF NOT EXISTS drug_authority_approval_number TEXT,
  ADD COLUMN IF NOT EXISTS drug_authority_approval_expiry DATE,
  ADD COLUMN IF NOT EXISTS drug_authority_approval_url TEXT,
  
  -- Nuclear/Radioactive - Nuclear Regulatory Authority (هيئة الرقابة النووية والإشعاعية)
  ADD COLUMN IF NOT EXISTS nuclear_regulatory_approval_number TEXT,
  ADD COLUMN IF NOT EXISTS nuclear_regulatory_approval_expiry DATE,
  ADD COLUMN IF NOT EXISTS nuclear_regulatory_approval_url TEXT,
  
  -- Food Safety Authority (هيئة سلامة الغذاء)
  ADD COLUMN IF NOT EXISTS food_safety_approval_number TEXT,
  ADD COLUMN IF NOT EXISTS food_safety_approval_expiry DATE,
  ADD COLUMN IF NOT EXISTS food_safety_approval_url TEXT,
  
  -- Civil Aviation (الطيران المدني - للنقل الجوي للمخلفات الخطرة)
  ADD COLUMN IF NOT EXISTS civil_aviation_approval_number TEXT,
  ADD COLUMN IF NOT EXISTS civil_aviation_approval_expiry DATE,
  ADD COLUMN IF NOT EXISTS civil_aviation_approval_url TEXT,
  
  -- Customs Authority (مصلحة الجمارك - للنقل عبر الحدود / اتفاقية بازل)
  ADD COLUMN IF NOT EXISTS customs_authority_approval_number TEXT,
  ADD COLUMN IF NOT EXISTS customs_authority_approval_expiry DATE,
  ADD COLUMN IF NOT EXISTS customs_authority_approval_url TEXT;

-- Descriptive comments
COMMENT ON COLUMN public.organizations.land_transport_authority_approval_number IS 'Land Transport Authority approval for waste transport vehicles';
COMMENT ON COLUMN public.organizations.ida_approval_number IS 'Industrial Development Authority (IDA) approval for industrial waste handling';
COMMENT ON COLUMN public.organizations.health_ministry_approval_number IS 'Ministry of Health approval for medical/clinical waste transport';
COMMENT ON COLUMN public.organizations.petroleum_authority_approval_number IS 'Petroleum Authority approval for oil & petroleum waste transport';
COMMENT ON COLUMN public.organizations.drug_authority_approval_number IS 'Egyptian Drug Authority (EDA) approval for pharmaceutical waste transport';
COMMENT ON COLUMN public.organizations.nuclear_regulatory_approval_number IS 'Nuclear and Radiological Regulatory Authority approval for radioactive waste';
COMMENT ON COLUMN public.organizations.food_safety_approval_number IS 'National Food Safety Authority approval for food/organic waste handling';
COMMENT ON COLUMN public.organizations.civil_aviation_approval_number IS 'Civil Aviation Authority approval for air transport of hazardous waste';
COMMENT ON COLUMN public.organizations.customs_authority_approval_number IS 'Customs Authority approval for cross-border waste transport (Basel Convention)';
