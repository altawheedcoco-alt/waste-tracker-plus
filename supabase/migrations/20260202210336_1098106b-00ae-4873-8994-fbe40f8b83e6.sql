-- Add signature URL column to terms_acceptances table
ALTER TABLE public.terms_acceptances 
ADD COLUMN IF NOT EXISTS signer_signature_url TEXT;