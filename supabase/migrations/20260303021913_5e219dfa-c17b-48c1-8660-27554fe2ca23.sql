
-- Table for facility camera registrations
CREATE TABLE public.facility_cameras (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  camera_name text NOT NULL,
  camera_location text,
  camera_type text NOT NULL DEFAULT 'anpr',
  api_key_hash text,
  is_active boolean NOT NULL DEFAULT true,
  last_event_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.facility_cameras ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Org members can view their cameras"
ON public.facility_cameras FOR SELECT TO authenticated
USING (organization_id IN (SELECT organization_id FROM public.profiles WHERE id = auth.uid()));

CREATE POLICY "Org members can manage their cameras"
ON public.facility_cameras FOR ALL TO authenticated
USING (organization_id IN (SELECT organization_id FROM public.profiles WHERE id = auth.uid()));

-- Table for camera arrival events
CREATE TABLE public.camera_arrival_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  facility_organization_id uuid NOT NULL REFERENCES public.organizations(id),
  camera_id uuid REFERENCES public.facility_cameras(id),
  shipment_id uuid REFERENCES public.shipments(id),
  plate_number text NOT NULL,
  plate_matched boolean NOT NULL DEFAULT false,
  photo_url text,
  video_clip_url text,
  confidence_score numeric,
  event_timestamp timestamptz NOT NULL DEFAULT now(),
  matched_vehicle_id uuid,
  matched_driver_id uuid,
  generator_organization_id uuid REFERENCES public.organizations(id),
  arrival_verified boolean NOT NULL DEFAULT false,
  metadata jsonb DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.camera_arrival_events ENABLE ROW LEVEL SECURITY;

-- Facility org can see their own camera events
CREATE POLICY "Facility org can view camera events"
ON public.camera_arrival_events FOR SELECT TO authenticated
USING (facility_organization_id IN (SELECT organization_id FROM public.profiles WHERE id = auth.uid()));

-- Generator org can see events for their shipments
CREATE POLICY "Generator can view their shipment arrivals"
ON public.camera_arrival_events FOR SELECT TO authenticated
USING (generator_organization_id IN (SELECT organization_id FROM public.profiles WHERE id = auth.uid()));

-- Service role inserts (via webhook edge function)
CREATE POLICY "Service can insert camera events"
ON public.camera_arrival_events FOR INSERT
WITH CHECK (true);

-- Index for fast plate lookups
CREATE INDEX idx_camera_events_plate ON public.camera_arrival_events(plate_number);
CREATE INDEX idx_camera_events_shipment ON public.camera_arrival_events(shipment_id);
CREATE INDEX idx_camera_events_generator ON public.camera_arrival_events(generator_organization_id);
CREATE INDEX idx_camera_events_facility ON public.camera_arrival_events(facility_organization_id);

-- Enable realtime for generator notifications
ALTER PUBLICATION supabase_realtime ADD TABLE public.camera_arrival_events;
