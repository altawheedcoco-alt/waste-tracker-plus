
-- Table for shipment movement supervisors
CREATE TABLE public.shipment_movement_supervisors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shipment_id UUID REFERENCES public.shipments(id) ON DELETE CASCADE NOT NULL,
  organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE NOT NULL,
  party_role TEXT NOT NULL CHECK (party_role IN ('generator', 'transporter', 'recycler', 'disposal')),
  supervisor_type TEXT NOT NULL DEFAULT 'human' CHECK (supervisor_type IN ('human', 'ai')),
  -- For human supervisors (member of org)
  user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  -- For manual entry or AI
  supervisor_name TEXT,
  supervisor_phone TEXT,
  supervisor_email TEXT,
  supervisor_position TEXT,
  -- Signature tracking
  signed_at TIMESTAMPTZ,
  signature_url TEXT,
  signature_hash TEXT,
  -- Metadata
  is_mandatory BOOLEAN DEFAULT true,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Organization default movement supervisors (settings)
CREATE TABLE public.organization_movement_supervisors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE NOT NULL,
  supervisor_type TEXT NOT NULL DEFAULT 'human' CHECK (supervisor_type IN ('human', 'ai')),
  user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  supervisor_name TEXT,
  supervisor_phone TEXT,
  supervisor_email TEXT,
  supervisor_position TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Indexes
CREATE INDEX idx_sms_shipment ON public.shipment_movement_supervisors(shipment_id);
CREATE INDEX idx_sms_org ON public.shipment_movement_supervisors(organization_id);
CREATE INDEX idx_oms_org ON public.organization_movement_supervisors(organization_id);

-- RLS
ALTER TABLE public.shipment_movement_supervisors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organization_movement_supervisors ENABLE ROW LEVEL SECURITY;

-- Policies for shipment_movement_supervisors
CREATE POLICY "Members can view supervisors of their shipments"
ON public.shipment_movement_supervisors FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = auth.uid() AND p.organization_id = organization_id
  )
  OR public.is_current_user_admin()
);

CREATE POLICY "Members can insert supervisors for their org"
ON public.shipment_movement_supervisors FOR INSERT TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = auth.uid() AND p.organization_id = organization_id
  )
  OR public.is_current_user_admin()
);

CREATE POLICY "Members can update supervisors of their org"
ON public.shipment_movement_supervisors FOR UPDATE TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = auth.uid() AND p.organization_id = organization_id
  )
  OR public.is_current_user_admin()
);

-- Policies for organization_movement_supervisors
CREATE POLICY "Members can view their org default supervisors"
ON public.organization_movement_supervisors FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = auth.uid() AND p.organization_id = organization_id
  )
  OR public.is_current_user_admin()
);

CREATE POLICY "Members can manage their org default supervisors"
ON public.organization_movement_supervisors FOR ALL TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = auth.uid() AND p.organization_id = organization_id
  )
  OR public.is_current_user_admin()
);
