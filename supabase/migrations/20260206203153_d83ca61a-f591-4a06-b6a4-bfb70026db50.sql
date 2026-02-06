-- Create trigger to auto-generate receipt_number

CREATE OR REPLACE FUNCTION public.generate_receipt_number()
RETURNS TRIGGER AS $$
DECLARE
  new_number TEXT;
  seq_num INTEGER;
BEGIN
  -- Generate unique receipt number with prefix RCP- and date
  SELECT COALESCE(MAX(CAST(SUBSTRING(receipt_number FROM 'RCP-[0-9]{8}-([0-9]+)') AS INTEGER)), 0) + 1
  INTO seq_num
  FROM public.shipment_receipts
  WHERE receipt_number LIKE 'RCP-' || TO_CHAR(CURRENT_DATE, 'YYYYMMDD') || '-%';
  
  NEW.receipt_number := 'RCP-' || TO_CHAR(CURRENT_DATE, 'YYYYMMDD') || '-' || LPAD(seq_num::TEXT, 4, '0');
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Drop existing trigger if exists
DROP TRIGGER IF EXISTS generate_receipt_number_trigger ON public.shipment_receipts;

-- Create trigger
CREATE TRIGGER generate_receipt_number_trigger
  BEFORE INSERT ON public.shipment_receipts
  FOR EACH ROW
  WHEN (NEW.receipt_number IS NULL OR NEW.receipt_number = '')
  EXECUTE FUNCTION public.generate_receipt_number();

-- Also, make receipt_number have a default value to satisfy NOT NULL
ALTER TABLE public.shipment_receipts 
ALTER COLUMN receipt_number SET DEFAULT '';