ALTER TABLE public.manual_shipment_drafts 
  ADD COLUMN IF NOT EXISTS waste_items jsonb DEFAULT '[]'::jsonb;