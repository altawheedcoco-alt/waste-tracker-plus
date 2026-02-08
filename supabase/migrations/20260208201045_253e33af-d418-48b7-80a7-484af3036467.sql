-- Add disposal facility columns to shipments table
ALTER TABLE public.shipments
ADD COLUMN IF NOT EXISTS disposal_facility_id UUID REFERENCES public.organizations(id),
ADD COLUMN IF NOT EXISTS manual_disposal_name TEXT;

-- Add index for faster lookups
CREATE INDEX IF NOT EXISTS idx_shipments_disposal_facility_id ON public.shipments(disposal_facility_id);

-- Add comment for documentation
COMMENT ON COLUMN public.shipments.disposal_facility_id IS 'Reference to the disposal facility (landfill/incinerator) for final waste disposal';
COMMENT ON COLUMN public.shipments.manual_disposal_name IS 'Manually entered disposal facility name when not in system';