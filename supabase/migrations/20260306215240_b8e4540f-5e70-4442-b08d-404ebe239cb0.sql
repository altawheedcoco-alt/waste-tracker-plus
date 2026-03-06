ALTER TABLE public.accounting_ledger 
  ADD COLUMN IF NOT EXISTS manual_draft_id uuid REFERENCES public.manual_shipment_drafts(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS waste_item_id text,
  ADD COLUMN IF NOT EXISTS ledger_merged boolean DEFAULT true;