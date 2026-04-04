
-- Disposal-specific regulatory permits
ALTER TABLE public.organizations
  -- EIA Certificate (شهادة تقييم الأثر البيئي) — disposal
  ADD COLUMN IF NOT EXISTS eia_certificate_number TEXT,
  ADD COLUMN IF NOT EXISTS eia_certificate_expiry DATE,
  ADD COLUMN IF NOT EXISTS eia_certificate_url TEXT,
  
  -- Incineration Permit (تصريح الحرق) — disposal
  ADD COLUMN IF NOT EXISTS incineration_permit_number TEXT,
  ADD COLUMN IF NOT EXISTS incineration_permit_expiry DATE,
  ADD COLUMN IF NOT EXISTS incineration_permit_url TEXT,
  
  -- Landfill Operating License (ترخيص تشغيل المدفن الصحي) — disposal
  ADD COLUMN IF NOT EXISTS landfill_license_number TEXT,
  ADD COLUMN IF NOT EXISTS landfill_license_expiry DATE,
  ADD COLUMN IF NOT EXISTS landfill_license_url TEXT,
  
  -- Chemical Treatment Permit (تصريح المعالجة الكيميائية) — disposal
  ADD COLUMN IF NOT EXISTS chemical_treatment_permit_number TEXT,
  ADD COLUMN IF NOT EXISTS chemical_treatment_permit_expiry DATE,
  ADD COLUMN IF NOT EXISTS chemical_treatment_permit_url TEXT,
  
  -- Emissions Permit (تصريح الانبعاثات الهوائية) — disposal
  ADD COLUMN IF NOT EXISTS emissions_permit_number TEXT,
  ADD COLUMN IF NOT EXISTS emissions_permit_expiry DATE,
  ADD COLUMN IF NOT EXISTS emissions_permit_url TEXT,
  
  -- Industrial Discharge Permit (تصريح الصرف الصناعي) — disposal
  ADD COLUMN IF NOT EXISTS industrial_discharge_permit_number TEXT,
  ADD COLUMN IF NOT EXISTS industrial_discharge_permit_expiry DATE,
  ADD COLUMN IF NOT EXISTS industrial_discharge_permit_url TEXT,
  
  -- Temporary Storage Permit (تصريح التخزين المؤقت للمخلفات) — disposal
  ADD COLUMN IF NOT EXISTS temp_storage_permit_number TEXT,
  ADD COLUMN IF NOT EXISTS temp_storage_permit_expiry DATE,
  ADD COLUMN IF NOT EXISTS temp_storage_permit_url TEXT,
  
  -- Groundwater Monitoring License (ترخيص رصد المياه الجوفية) — disposal/landfill
  ADD COLUMN IF NOT EXISTS groundwater_monitoring_license_number TEXT,
  ADD COLUMN IF NOT EXISTS groundwater_monitoring_license_expiry DATE,
  ADD COLUMN IF NOT EXISTS groundwater_monitoring_license_url TEXT,
  
  -- Radiation Protection License (ترخيص الوقاية الإشعاعية) — disposal/nuclear
  ADD COLUMN IF NOT EXISTS radiation_protection_license_number TEXT,
  ADD COLUMN IF NOT EXISTS radiation_protection_license_expiry DATE,
  ADD COLUMN IF NOT EXISTS radiation_protection_license_url TEXT;

-- Comments
COMMENT ON COLUMN public.organizations.eia_certificate_number IS 'Environmental Impact Assessment certificate — required for disposal facilities';
COMMENT ON COLUMN public.organizations.incineration_permit_number IS 'Incineration operating permit from EEAA — required for incineration facilities';
COMMENT ON COLUMN public.organizations.landfill_license_number IS 'Sanitary landfill operating license — required for landfill facilities';
COMMENT ON COLUMN public.organizations.chemical_treatment_permit_number IS 'Chemical/physical treatment permit for hazardous waste — disposal';
COMMENT ON COLUMN public.organizations.emissions_permit_number IS 'Air emissions permit from EEAA — required for incineration/treatment facilities';
COMMENT ON COLUMN public.organizations.industrial_discharge_permit_number IS 'Industrial wastewater discharge permit — disposal facilities';
COMMENT ON COLUMN public.organizations.temp_storage_permit_number IS 'Temporary hazardous waste storage permit — disposal';
COMMENT ON COLUMN public.organizations.groundwater_monitoring_license_number IS 'Groundwater monitoring license — required for landfill operations';
COMMENT ON COLUMN public.organizations.radiation_protection_license_number IS 'Radiation protection license from Nuclear Regulatory Authority — nuclear waste disposal';
