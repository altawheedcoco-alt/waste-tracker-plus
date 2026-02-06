-- Create partner_links table to track auto-created partnerships
CREATE TABLE IF NOT EXISTS public.partner_links (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL,
  partner_organization_id UUID,
  external_partner_id UUID,
  partner_type TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active',
  auto_created BOOLEAN DEFAULT true,
  first_shipment_id UUID,
  first_transaction_date TIMESTAMP WITH TIME ZONE DEFAULT now(),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT partner_links_unique UNIQUE(organization_id, partner_organization_id, external_partner_id)
);

-- Enable RLS
ALTER TABLE public.partner_links ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Organizations can view their partner links"
  ON public.partner_links
  FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id FROM profiles WHERE id = auth.uid()
    ) OR
    partner_organization_id IN (
      SELECT organization_id FROM profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "Organizations can manage their partner links"
  ON public.partner_links
  FOR ALL
  USING (
    organization_id IN (
      SELECT organization_id FROM profiles WHERE id = auth.uid()
    )
  );

-- Function to auto-create partner links when shipment is created
CREATE OR REPLACE FUNCTION public.auto_create_partner_links()
RETURNS TRIGGER AS $$
DECLARE
  v_generator_id UUID;
  v_transporter_id UUID;
  v_recycler_id UUID;
BEGIN
  v_generator_id := NEW.generator_id;
  v_transporter_id := NEW.transporter_id;
  v_recycler_id := NEW.recycler_id;

  -- Link Generator <-> Transporter
  IF v_generator_id IS NOT NULL AND v_transporter_id IS NOT NULL THEN
    INSERT INTO public.partner_links (organization_id, partner_organization_id, partner_type, first_shipment_id)
    VALUES (v_generator_id, v_transporter_id, 'transporter', NEW.id)
    ON CONFLICT (organization_id, partner_organization_id, external_partner_id) DO NOTHING;
    
    INSERT INTO public.partner_links (organization_id, partner_organization_id, partner_type, first_shipment_id)
    VALUES (v_transporter_id, v_generator_id, 'generator', NEW.id)
    ON CONFLICT (organization_id, partner_organization_id, external_partner_id) DO NOTHING;
  END IF;

  -- Link Generator <-> Recycler
  IF v_generator_id IS NOT NULL AND v_recycler_id IS NOT NULL THEN
    INSERT INTO public.partner_links (organization_id, partner_organization_id, partner_type, first_shipment_id)
    VALUES (v_generator_id, v_recycler_id, 'recycler', NEW.id)
    ON CONFLICT (organization_id, partner_organization_id, external_partner_id) DO NOTHING;
    
    INSERT INTO public.partner_links (organization_id, partner_organization_id, partner_type, first_shipment_id)
    VALUES (v_recycler_id, v_generator_id, 'generator', NEW.id)
    ON CONFLICT (organization_id, partner_organization_id, external_partner_id) DO NOTHING;
  END IF;

  -- Link Transporter <-> Recycler
  IF v_transporter_id IS NOT NULL AND v_recycler_id IS NOT NULL THEN
    INSERT INTO public.partner_links (organization_id, partner_organization_id, partner_type, first_shipment_id)
    VALUES (v_transporter_id, v_recycler_id, 'recycler', NEW.id)
    ON CONFLICT (organization_id, partner_organization_id, external_partner_id) DO NOTHING;
    
    INSERT INTO public.partner_links (organization_id, partner_organization_id, partner_type, first_shipment_id)
    VALUES (v_recycler_id, v_transporter_id, 'transporter', NEW.id)
    ON CONFLICT (organization_id, partner_organization_id, external_partner_id) DO NOTHING;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger for auto-linking
DROP TRIGGER IF EXISTS trigger_auto_create_partner_links ON public.shipments;
CREATE TRIGGER trigger_auto_create_partner_links
  AFTER INSERT ON public.shipments
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_create_partner_links();

-- Backfill existing shipments to create partner links
INSERT INTO public.partner_links (organization_id, partner_organization_id, partner_type, first_shipment_id, auto_created)
SELECT DISTINCT 
  s.generator_id,
  s.transporter_id,
  'transporter',
  (SELECT id FROM shipments WHERE generator_id = s.generator_id AND transporter_id = s.transporter_id ORDER BY created_at LIMIT 1),
  true
FROM shipments s
WHERE s.generator_id IS NOT NULL AND s.transporter_id IS NOT NULL
ON CONFLICT DO NOTHING;

INSERT INTO public.partner_links (organization_id, partner_organization_id, partner_type, first_shipment_id, auto_created)
SELECT DISTINCT 
  s.transporter_id,
  s.generator_id,
  'generator',
  (SELECT id FROM shipments WHERE generator_id = s.generator_id AND transporter_id = s.transporter_id ORDER BY created_at LIMIT 1),
  true
FROM shipments s
WHERE s.generator_id IS NOT NULL AND s.transporter_id IS NOT NULL
ON CONFLICT DO NOTHING;

INSERT INTO public.partner_links (organization_id, partner_organization_id, partner_type, first_shipment_id, auto_created)
SELECT DISTINCT 
  s.generator_id,
  s.recycler_id,
  'recycler',
  (SELECT id FROM shipments WHERE generator_id = s.generator_id AND recycler_id = s.recycler_id ORDER BY created_at LIMIT 1),
  true
FROM shipments s
WHERE s.generator_id IS NOT NULL AND s.recycler_id IS NOT NULL
ON CONFLICT DO NOTHING;

INSERT INTO public.partner_links (organization_id, partner_organization_id, partner_type, first_shipment_id, auto_created)
SELECT DISTINCT 
  s.recycler_id,
  s.generator_id,
  'generator',
  (SELECT id FROM shipments WHERE generator_id = s.generator_id AND recycler_id = s.recycler_id ORDER BY created_at LIMIT 1),
  true
FROM shipments s
WHERE s.generator_id IS NOT NULL AND s.recycler_id IS NOT NULL
ON CONFLICT DO NOTHING;

INSERT INTO public.partner_links (organization_id, partner_organization_id, partner_type, first_shipment_id, auto_created)
SELECT DISTINCT 
  s.transporter_id,
  s.recycler_id,
  'recycler',
  (SELECT id FROM shipments WHERE transporter_id = s.transporter_id AND recycler_id = s.recycler_id ORDER BY created_at LIMIT 1),
  true
FROM shipments s
WHERE s.transporter_id IS NOT NULL AND s.recycler_id IS NOT NULL
ON CONFLICT DO NOTHING;

INSERT INTO public.partner_links (organization_id, partner_organization_id, partner_type, first_shipment_id, auto_created)
SELECT DISTINCT 
  s.recycler_id,
  s.transporter_id,
  'transporter',
  (SELECT id FROM shipments WHERE transporter_id = s.transporter_id AND recycler_id = s.recycler_id ORDER BY created_at LIMIT 1),
  true
FROM shipments s
WHERE s.transporter_id IS NOT NULL AND s.recycler_id IS NOT NULL
ON CONFLICT DO NOTHING;