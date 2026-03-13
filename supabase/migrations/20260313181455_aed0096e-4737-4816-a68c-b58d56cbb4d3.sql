-- Add verification identity columns to delivery_declarations
ALTER TABLE public.delivery_declarations
  ADD COLUMN IF NOT EXISTS verification_code TEXT,
  ADD COLUMN IF NOT EXISTS barcode_data TEXT,
  ADD COLUMN IF NOT EXISTS qr_data TEXT;

-- Add verification identity columns to shipment_receipts
ALTER TABLE public.shipment_receipts
  ADD COLUMN IF NOT EXISTS verification_code TEXT,
  ADD COLUMN IF NOT EXISTS barcode_data TEXT,
  ADD COLUMN IF NOT EXISTS qr_data TEXT;

-- Create unique index on verification_code for both tables
CREATE UNIQUE INDEX IF NOT EXISTS idx_delivery_declarations_verification_code
  ON public.delivery_declarations(verification_code) WHERE verification_code IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_shipment_receipts_verification_code
  ON public.shipment_receipts(verification_code) WHERE verification_code IS NOT NULL;