-- Add missing columns that are causing 400 errors

-- Add receipt_type to shipment_receipts
ALTER TABLE public.shipment_receipts 
ADD COLUMN IF NOT EXISTS receipt_type text DEFAULT 'standard';

-- Add status to recycling_reports
ALTER TABLE public.recycling_reports 
ADD COLUMN IF NOT EXISTS status text DEFAULT 'pending';