-- Add comprehensive document visibility settings as JSONB
-- Structure: { "to_generator": { "all": true, "declarations": true, "certificates": true, "tracking": true, "receipts": true }, "to_recycler": { ... }, "to_disposal": { ... } }
ALTER TABLE public.organization_auto_actions 
ADD COLUMN IF NOT EXISTS document_visibility_settings jsonb NOT NULL DEFAULT '{
  "to_generator": {
    "all": true,
    "declarations": true,
    "certificates": true,
    "tracking": true,
    "receipts": true
  },
  "to_recycler": {
    "all": true,
    "declarations": true,
    "certificates": true,
    "tracking": true,
    "receipts": true
  },
  "to_disposal": {
    "all": true,
    "declarations": true,
    "certificates": true,
    "tracking": true,
    "receipts": true
  }
}'::jsonb;

-- Add per-document visibility override (null = use org settings)
-- visible_to is a JSONB like: { "generator": true, "recycler": true, "disposal": true }
ALTER TABLE public.delivery_declarations 
ADD COLUMN IF NOT EXISTS visible_to jsonb DEFAULT NULL;

ALTER TABLE public.shipment_receipts 
ADD COLUMN IF NOT EXISTS visible_to jsonb DEFAULT NULL;