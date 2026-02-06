-- Fix shipment_receipts table constraints

-- 1. Drop the problematic foreign key constraint on created_by
ALTER TABLE public.shipment_receipts 
DROP CONSTRAINT IF EXISTS shipment_receipts_created_by_fkey;

-- 2. Make generator_id nullable (since external shipments may not have a generator_id)
ALTER TABLE public.shipment_receipts 
ALTER COLUMN generator_id DROP NOT NULL;

-- 3. Create a trigger to auto-set created_by from auth.uid() if not provided
CREATE OR REPLACE FUNCTION public.set_receipt_created_by()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.created_by IS NULL THEN
    NEW.created_by := auth.uid();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Drop existing trigger if exists
DROP TRIGGER IF EXISTS set_receipt_created_by_trigger ON public.shipment_receipts;

-- Create trigger
CREATE TRIGGER set_receipt_created_by_trigger
  BEFORE INSERT ON public.shipment_receipts
  FOR EACH ROW
  EXECUTE FUNCTION public.set_receipt_created_by();