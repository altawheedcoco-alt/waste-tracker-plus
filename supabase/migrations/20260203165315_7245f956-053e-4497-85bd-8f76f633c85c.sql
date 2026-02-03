-- Add account_notes column to shipments table for partner account notes
ALTER TABLE public.shipments 
ADD COLUMN IF NOT EXISTS account_notes TEXT;