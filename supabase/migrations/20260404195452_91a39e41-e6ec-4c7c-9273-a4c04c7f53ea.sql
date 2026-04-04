
-- Add remaining regulatory authority permits for transporters & recyclers
ALTER TABLE public.organizations
  -- Civil Defense (الحماية المدنية) — transporter + recycler
  ADD COLUMN IF NOT EXISTS civil_defense_approval_number TEXT,
  ADD COLUMN IF NOT EXISTS civil_defense_approval_expiry DATE,
  ADD COLUMN IF NOT EXISTS civil_defense_approval_url TEXT,
  
  -- Veterinary Quarantine (المحاجر البيطرية) — transporter + recycler
  ADD COLUMN IF NOT EXISTS veterinary_quarantine_approval_number TEXT,
  ADD COLUMN IF NOT EXISTS veterinary_quarantine_approval_expiry DATE,
  ADD COLUMN IF NOT EXISTS veterinary_quarantine_approval_url TEXT,
  
  -- Ports Authority (هيئة الموانئ) — transporter
  ADD COLUMN IF NOT EXISTS ports_authority_approval_number TEXT,
  ADD COLUMN IF NOT EXISTS ports_authority_approval_expiry DATE,
  ADD COLUMN IF NOT EXISTS ports_authority_approval_url TEXT,
  
  -- Governorate License (ترخيص المحافظة المختصة) — transporter + recycler
  ADD COLUMN IF NOT EXISTS governorate_activity_license_number TEXT,
  ADD COLUMN IF NOT EXISTS governorate_activity_license_expiry DATE,
  ADD COLUMN IF NOT EXISTS governorate_activity_license_url TEXT,
  
  -- Occupational Safety & Health (السلامة والصحة المهنية) — transporter + recycler
  ADD COLUMN IF NOT EXISTS occupational_safety_approval_number TEXT,
  ADD COLUMN IF NOT EXISTS occupational_safety_approval_expiry DATE,
  ADD COLUMN IF NOT EXISTS occupational_safety_approval_url TEXT,
  
  -- ADR Certificate (شهادة النقل الدولي للبضائع الخطرة) — transporter
  ADD COLUMN IF NOT EXISTS adr_certificate_number TEXT,
  ADD COLUMN IF NOT EXISTS adr_certificate_expiry DATE,
  ADD COLUMN IF NOT EXISTS adr_certificate_url TEXT,
  
  -- Transport Risk Insurance (تأمين أخطار النقل) — transporter
  ADD COLUMN IF NOT EXISTS transport_insurance_policy_number TEXT,
  ADD COLUMN IF NOT EXISTS transport_insurance_expiry DATE,
  ADD COLUMN IF NOT EXISTS transport_insurance_url TEXT;

-- Comments
COMMENT ON COLUMN public.organizations.civil_defense_approval_number IS 'Civil Defense fire safety approval for hazardous/flammable waste — applies to transporter & recycler';
COMMENT ON COLUMN public.organizations.veterinary_quarantine_approval_number IS 'Veterinary Quarantine approval for animal/biological waste — applies to transporter & recycler';
COMMENT ON COLUMN public.organizations.ports_authority_approval_number IS 'Ports Authority approval for maritime waste transport — applies to transporter';
COMMENT ON COLUMN public.organizations.governorate_activity_license_number IS 'Governorate activity license for waste operations site — applies to transporter & recycler';
COMMENT ON COLUMN public.organizations.occupational_safety_approval_number IS 'Occupational Safety & Health approval for hazardous handling — applies to transporter & recycler';
COMMENT ON COLUMN public.organizations.adr_certificate_number IS 'ADR international dangerous goods road transport certificate — applies to transporter';
COMMENT ON COLUMN public.organizations.transport_insurance_policy_number IS 'Mandatory transport risk insurance policy — applies to transporter';
