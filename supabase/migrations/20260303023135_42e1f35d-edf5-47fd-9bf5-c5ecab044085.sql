
-- Table: camera access grants - facility controls who can view their cameras
CREATE TABLE public.camera_access_grants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  facility_organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  granted_to_organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  granted_by UUID REFERENCES auth.users(id),
  grant_type TEXT NOT NULL DEFAULT 'arrival_proof' CHECK (grant_type IN ('arrival_proof', 'live_feed', 'full_access')),
  is_active BOOLEAN NOT NULL DEFAULT true,
  notes TEXT,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(facility_organization_id, granted_to_organization_id, grant_type)
);

ALTER TABLE public.camera_access_grants ENABLE ROW LEVEL SECURITY;

-- Facility can manage their own grants
CREATE POLICY "Facility manages own camera grants"
ON public.camera_access_grants
FOR ALL
TO authenticated
USING (
  facility_organization_id IN (
    SELECT organization_id FROM public.profiles WHERE id = auth.uid()
  )
);

-- Granted org can view their grants
CREATE POLICY "Granted org can view their access"
ON public.camera_access_grants
FOR SELECT
TO authenticated
USING (
  granted_to_organization_id IN (
    SELECT organization_id FROM public.profiles WHERE id = auth.uid()
  )
);

-- Update camera_arrival_events RLS: generators can only see if they have a grant
DROP POLICY IF EXISTS "Generators can view arrival proofs for their shipments" ON public.camera_arrival_events;

CREATE POLICY "Generators view arrivals with camera grant"
ON public.camera_arrival_events
FOR SELECT
TO authenticated
USING (
  facility_organization_id IN (
    SELECT organization_id FROM public.profiles WHERE id = auth.uid()
  )
  OR
  EXISTS (
    SELECT 1 FROM public.camera_access_grants cag
    WHERE cag.facility_organization_id = camera_arrival_events.facility_organization_id
    AND cag.granted_to_organization_id IN (
      SELECT organization_id FROM public.profiles WHERE id = auth.uid()
    )
    AND cag.is_active = true
    AND (cag.expires_at IS NULL OR cag.expires_at > now())
  )
);

-- Trigger for updated_at
CREATE TRIGGER update_camera_access_grants_updated_at
BEFORE UPDATE ON public.camera_access_grants
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
