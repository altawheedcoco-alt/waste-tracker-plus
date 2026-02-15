
-- Add unique signatory code for barcode/QR generation
ALTER TABLE public.authorized_signatories 
ADD COLUMN IF NOT EXISTS signatory_code TEXT UNIQUE;

-- Generate codes for existing records
UPDATE public.authorized_signatories 
SET signatory_code = 'SIG-' || UPPER(SUBSTRING(id::text, 1, 8))
WHERE signatory_code IS NULL;

-- Make it NOT NULL with a default for future records
ALTER TABLE public.authorized_signatories 
ALTER COLUMN signatory_code SET DEFAULT 'SIG-' || UPPER(SUBSTRING(gen_random_uuid()::text, 1, 8));

-- Create a function to auto-generate signatory_code on insert
CREATE OR REPLACE FUNCTION public.generate_signatory_code()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.signatory_code IS NULL OR NEW.signatory_code = '' THEN
    NEW.signatory_code := 'SIG-' || UPPER(SUBSTRING(NEW.id::text, 1, 8));
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER trigger_generate_signatory_code
BEFORE INSERT ON public.authorized_signatories
FOR EACH ROW
EXECUTE FUNCTION public.generate_signatory_code();

-- Add index for fast lookups by code
CREATE INDEX IF NOT EXISTS idx_signatories_code ON public.authorized_signatories(signatory_code);
