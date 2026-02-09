
-- Create partner ratings table
CREATE TABLE public.partner_ratings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  shipment_id UUID NOT NULL REFERENCES public.shipments(id) ON DELETE CASCADE,
  rater_organization_id UUID NOT NULL REFERENCES public.organizations(id),
  rated_organization_id UUID NOT NULL REFERENCES public.organizations(id),
  overall_rating SMALLINT NOT NULL CHECK (overall_rating BETWEEN 1 AND 5),
  punctuality_rating SMALLINT CHECK (punctuality_rating BETWEEN 1 AND 5),
  quality_rating SMALLINT CHECK (quality_rating BETWEEN 1 AND 5),
  communication_rating SMALLINT CHECK (communication_rating BETWEEN 1 AND 5),
  comment TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(shipment_id, rater_organization_id)
);

-- Enable RLS
ALTER TABLE public.partner_ratings ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Organizations can view ratings they gave or received"
ON public.partner_ratings FOR SELECT
USING (
  rater_organization_id IN (SELECT organization_id FROM public.profiles WHERE id = auth.uid())
  OR rated_organization_id IN (SELECT organization_id FROM public.profiles WHERE id = auth.uid())
);

CREATE POLICY "Organizations can create ratings for their shipments"
ON public.partner_ratings FOR INSERT
WITH CHECK (
  rater_organization_id IN (SELECT organization_id FROM public.profiles WHERE id = auth.uid())
);

CREATE POLICY "Organizations can update their own ratings"
ON public.partner_ratings FOR UPDATE
USING (
  rater_organization_id IN (SELECT organization_id FROM public.profiles WHERE id = auth.uid())
);

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.partner_ratings;

-- Create delivery confirmations table
CREATE TABLE public.delivery_confirmations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  shipment_id UUID NOT NULL REFERENCES public.shipments(id) ON DELETE CASCADE,
  confirmed_by_organization_id UUID NOT NULL REFERENCES public.organizations(id),
  confirmed_by_user_id UUID REFERENCES auth.users(id),
  confirmation_type TEXT NOT NULL DEFAULT 'digital', -- digital, signature, photo
  signature_url TEXT,
  photo_url TEXT,
  notes TEXT,
  receiver_name TEXT,
  receiver_national_id TEXT,
  weight_at_delivery NUMERIC,
  weight_unit TEXT DEFAULT 'ton',
  condition_notes TEXT,
  confirmed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.delivery_confirmations ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Organizations can view confirmations for their shipments"
ON public.delivery_confirmations FOR SELECT
USING (
  confirmed_by_organization_id IN (SELECT organization_id FROM public.profiles WHERE id = auth.uid())
  OR shipment_id IN (
    SELECT id FROM public.shipments
    WHERE generator_id IN (SELECT organization_id FROM public.profiles WHERE id = auth.uid())
    OR transporter_id IN (SELECT organization_id FROM public.profiles WHERE id = auth.uid())
    OR recycler_id IN (SELECT organization_id FROM public.profiles WHERE id = auth.uid())
  )
);

CREATE POLICY "Organizations can create delivery confirmations"
ON public.delivery_confirmations FOR INSERT
WITH CHECK (
  confirmed_by_organization_id IN (SELECT organization_id FROM public.profiles WHERE id = auth.uid())
);
