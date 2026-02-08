-- Create disposal facilities table (جهات التخلص النهائي)
CREATE TABLE IF NOT EXISTS public.disposal_facilities (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  name_en TEXT,
  facility_type TEXT NOT NULL DEFAULT 'landfill' CHECK (facility_type IN ('landfill', 'incinerator', 'treatment_plant', 'hazardous_disposal', 'industrial_waste')),
  license_number TEXT,
  license_expiry DATE,
  license_authority TEXT DEFAULT 'جهاز شؤون البيئة',
  
  -- Location
  address TEXT,
  city TEXT,
  governorate TEXT,
  latitude NUMERIC(10, 8),
  longitude NUMERIC(11, 8),
  google_maps_url TEXT,
  
  -- Contact
  phone TEXT,
  phone_secondary TEXT,
  email TEXT,
  website TEXT,
  contact_person TEXT,
  contact_position TEXT,
  
  -- Capacity & Operations
  total_capacity_tons NUMERIC,
  current_fill_percentage NUMERIC CHECK (current_fill_percentage >= 0 AND current_fill_percentage <= 100),
  daily_capacity_tons NUMERIC,
  operating_hours JSONB DEFAULT '{"weekdays": "08:00-17:00", "weekends": "closed"}',
  
  -- Accepted Waste Types (array of waste codes)
  accepted_waste_types TEXT[] DEFAULT '{}',
  accepted_hazard_levels TEXT[] DEFAULT '{"non_hazardous"}',
  rejected_waste_types TEXT[] DEFAULT '{}',
  
  -- Pricing
  price_per_ton NUMERIC,
  currency TEXT DEFAULT 'EGP',
  pricing_notes TEXT,
  
  -- Certifications & Compliance
  environmental_license_url TEXT,
  iso_certification TEXT,
  eeaa_rating TEXT,
  last_inspection_date DATE,
  inspection_result TEXT,
  
  -- Media
  logo_url TEXT,
  photos JSONB DEFAULT '[]',
  
  -- Status
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'under_maintenance', 'full', 'closed')),
  is_verified BOOLEAN DEFAULT false,
  verified_at TIMESTAMP WITH TIME ZONE,
  verified_by UUID,
  
  -- Metadata
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID
);

-- Create index for efficient querying
CREATE INDEX IF NOT EXISTS idx_disposal_facilities_type ON disposal_facilities(facility_type);
CREATE INDEX IF NOT EXISTS idx_disposal_facilities_governorate ON disposal_facilities(governorate);
CREATE INDEX IF NOT EXISTS idx_disposal_facilities_status ON disposal_facilities(status);
CREATE INDEX IF NOT EXISTS idx_disposal_facilities_location ON disposal_facilities(latitude, longitude);

-- Enable RLS
ALTER TABLE public.disposal_facilities ENABLE ROW LEVEL SECURITY;

-- RLS Policies - All authenticated users can view
DROP POLICY IF EXISTS "Anyone can view active disposal facilities" ON disposal_facilities;
CREATE POLICY "Anyone can view active disposal facilities"
  ON public.disposal_facilities
  FOR SELECT
  USING (status != 'closed' OR status IS NULL);

-- Allow all authenticated users to insert/update for now (will be restricted later)
DROP POLICY IF EXISTS "Authenticated users can manage disposal facilities" ON disposal_facilities;
CREATE POLICY "Authenticated users can manage disposal facilities"
  ON public.disposal_facilities
  FOR ALL
  USING (auth.role() = 'authenticated');

-- Create reviews/ratings table for disposal facilities
CREATE TABLE IF NOT EXISTS public.disposal_facility_reviews (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  facility_id UUID NOT NULL REFERENCES disposal_facilities(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  review_text TEXT,
  service_quality INTEGER CHECK (service_quality >= 1 AND service_quality <= 5),
  response_time INTEGER CHECK (response_time >= 1 AND response_time <= 5),
  documentation INTEGER CHECK (documentation >= 1 AND documentation <= 5),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID
);

ALTER TABLE public.disposal_facility_reviews ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view reviews" ON disposal_facility_reviews;
CREATE POLICY "Users can view reviews"
  ON public.disposal_facility_reviews
  FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Authenticated can manage reviews" ON disposal_facility_reviews;
CREATE POLICY "Authenticated can manage reviews"
  ON public.disposal_facility_reviews
  FOR ALL
  USING (auth.role() = 'authenticated');

-- Add disposal_facility_id to shipments
ALTER TABLE public.shipments
ADD COLUMN IF NOT EXISTS disposal_facility_id UUID REFERENCES disposal_facilities(id),
ADD COLUMN IF NOT EXISTS disposal_type TEXT,
ADD COLUMN IF NOT EXISTS disposal_certificate_url TEXT,
ADD COLUMN IF NOT EXISTS disposed_at TIMESTAMP WITH TIME ZONE;

-- Create trigger for updated_at
DROP TRIGGER IF EXISTS update_disposal_facilities_updated_at ON disposal_facilities;
CREATE TRIGGER update_disposal_facilities_updated_at
  BEFORE UPDATE ON disposal_facilities
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();