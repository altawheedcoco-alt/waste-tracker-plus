-- Add preset fields to organization_deposit_links table
ALTER TABLE public.organization_deposit_links
ADD COLUMN IF NOT EXISTS preset_partner_id UUID REFERENCES public.organizations(id),
ADD COLUMN IF NOT EXISTS preset_external_partner_id UUID REFERENCES public.external_partners(id),
ADD COLUMN IF NOT EXISTS preset_waste_type TEXT,
ADD COLUMN IF NOT EXISTS preset_category TEXT,
ADD COLUMN IF NOT EXISTS preset_notes TEXT,
ADD COLUMN IF NOT EXISTS allow_amount_edit BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS allow_date_edit BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS allow_partner_edit BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS require_receipt BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS custom_fields JSONB DEFAULT '[]'::jsonb;

-- Add partner_id and waste_type to deposits for linking
ALTER TABLE public.deposits
ADD COLUMN IF NOT EXISTS partner_organization_id UUID REFERENCES public.organizations(id),
ADD COLUMN IF NOT EXISTS partner_external_id UUID REFERENCES public.external_partners(id),
ADD COLUMN IF NOT EXISTS waste_type TEXT,
ADD COLUMN IF NOT EXISTS category TEXT;

-- Add index for faster lookup
CREATE INDEX IF NOT EXISTS idx_deposits_partner_org ON public.deposits(partner_organization_id);
CREATE INDEX IF NOT EXISTS idx_deposits_partner_external ON public.deposits(partner_external_id);
CREATE INDEX IF NOT EXISTS idx_deposit_links_preset_partner ON public.organization_deposit_links(preset_partner_id);

COMMENT ON COLUMN public.organization_deposit_links.preset_partner_id IS 'Preset partner organization for this deposit link';
COMMENT ON COLUMN public.organization_deposit_links.preset_external_partner_id IS 'Preset external partner for this deposit link';
COMMENT ON COLUMN public.organization_deposit_links.preset_waste_type IS 'Preset waste type for deposits via this link';
COMMENT ON COLUMN public.organization_deposit_links.allow_amount_edit IS 'Whether submitter can edit the preset amount';
COMMENT ON COLUMN public.organization_deposit_links.allow_partner_edit IS 'Whether submitter can change the preset partner';