
CREATE TABLE public.shipment_videos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  shipment_id UUID NOT NULL REFERENCES public.shipments(id) ON DELETE CASCADE,
  uploaded_by UUID NOT NULL,
  video_url TEXT NOT NULL,
  video_type TEXT NOT NULL DEFAULT 'upload', -- 'live_recording', 'upload', 'live_stream'
  file_size_bytes BIGINT,
  duration_seconds INTEGER,
  ai_verified BOOLEAN DEFAULT false,
  ai_confidence_score NUMERIC(5,2),
  ai_result JSONB,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.shipment_videos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their org videos"
  ON public.shipment_videos FOR SELECT
  USING (
    organization_id IN (
      SELECT uo.organization_id FROM public.user_organizations uo WHERE uo.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert videos for their org"
  ON public.shipment_videos FOR INSERT
  WITH CHECK (
    organization_id IN (
      SELECT uo.organization_id FROM public.user_organizations uo WHERE uo.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update their org videos"
  ON public.shipment_videos FOR UPDATE
  USING (
    organization_id IN (
      SELECT uo.organization_id FROM public.user_organizations uo WHERE uo.user_id = auth.uid()
    )
  );

CREATE INDEX idx_shipment_videos_org ON public.shipment_videos(organization_id);
CREATE INDEX idx_shipment_videos_shipment ON public.shipment_videos(shipment_id);
