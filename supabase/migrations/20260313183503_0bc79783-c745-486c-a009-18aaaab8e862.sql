-- Add visible_to_generator to shipment_receipts for transporter visibility control
ALTER TABLE public.shipment_receipts 
ADD COLUMN IF NOT EXISTS visible_to_generator boolean DEFAULT true;