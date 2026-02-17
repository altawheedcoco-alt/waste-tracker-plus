
-- Add entity_type and company fields to environmental_consultants
ALTER TABLE public.environmental_consultants 
  ADD COLUMN IF NOT EXISTS entity_type text NOT NULL DEFAULT 'individual',
  ADD COLUMN IF NOT EXISTS company_name text,
  ADD COLUMN IF NOT EXISTS company_name_en text,
  ADD COLUMN IF NOT EXISTS company_logo_url text,
  ADD COLUMN IF NOT EXISTS commercial_register text,
  ADD COLUMN IF NOT EXISTS tax_id text,
  ADD COLUMN IF NOT EXISTS website text,
  ADD COLUMN IF NOT EXISTS address text,
  ADD COLUMN IF NOT EXISTS city text,
  ADD COLUMN IF NOT EXISTS region text,
  ADD COLUMN IF NOT EXISTS services text[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS accreditation_body text,
  ADD COLUMN IF NOT EXISTS accreditation_number text,
  ADD COLUMN IF NOT EXISTS accreditation_expiry date,
  ADD COLUMN IF NOT EXISTS lab_equipment_list jsonb,
  ADD COLUMN IF NOT EXISTS iso_standards_offered text[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS training_programs_offered text[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS sectors_served text[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS portfolio_url text,
  ADD COLUMN IF NOT EXISTS rating numeric(3,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS total_reviews integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS is_verified boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS verified_at timestamptz,
  ADD COLUMN IF NOT EXISTS verified_by uuid;

-- Create consultant_services catalog table
CREATE TABLE IF NOT EXISTS public.consultant_service_catalog (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  consultant_id uuid NOT NULL REFERENCES public.environmental_consultants(id) ON DELETE CASCADE,
  service_name text NOT NULL,
  service_name_en text,
  service_category text NOT NULL DEFAULT 'consulting',
  description text,
  price_range text,
  duration_estimate text,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.consultant_service_catalog ENABLE ROW LEVEL SECURITY;

-- Anyone can view services
CREATE POLICY "Anyone can view consultant services"
  ON public.consultant_service_catalog FOR SELECT
  USING (true);

-- Consultant can manage their own services
CREATE POLICY "Consultants manage own services"
  ON public.consultant_service_catalog FOR ALL
  USING (
    consultant_id IN (
      SELECT id FROM public.environmental_consultants WHERE user_id = auth.uid()
    )
  )
  WITH CHECK (
    consultant_id IN (
      SELECT id FROM public.environmental_consultants WHERE user_id = auth.uid()
    )
  );

-- Create consultant_reviews table
CREATE TABLE IF NOT EXISTS public.consultant_reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  consultant_id uuid NOT NULL REFERENCES public.environmental_consultants(id) ON DELETE CASCADE,
  reviewer_organization_id uuid REFERENCES public.organizations(id),
  reviewer_user_id uuid,
  rating integer NOT NULL CHECK (rating >= 1 AND rating <= 5),
  review_text text,
  is_verified boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.consultant_reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view reviews"
  ON public.consultant_reviews FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can add reviews"
  ON public.consultant_reviews FOR INSERT
  TO authenticated
  WITH CHECK (reviewer_user_id = auth.uid());

-- Add index for entity_type filtering
CREATE INDEX IF NOT EXISTS idx_consultants_entity_type ON public.environmental_consultants(entity_type);
CREATE INDEX IF NOT EXISTS idx_consultants_services ON public.environmental_consultants USING GIN(services);
CREATE INDEX IF NOT EXISTS idx_consultant_service_catalog_consultant ON public.consultant_service_catalog(consultant_id);
