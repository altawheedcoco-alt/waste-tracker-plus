
ALTER TABLE public.quotations ADD COLUMN IF NOT EXISTS direction text NOT NULL DEFAULT 'outgoing';
ALTER TABLE public.quotations ADD COLUMN IF NOT EXISTS document_type text NOT NULL DEFAULT 'price_quote';
COMMENT ON COLUMN public.quotations.direction IS 'outgoing = we charge client, incoming = we pay supplier';
COMMENT ON COLUMN public.quotations.document_type IS 'price_quote, technical_financial, estimate, proforma, rfq, purchase_order, service_offer, contract_proposal';
