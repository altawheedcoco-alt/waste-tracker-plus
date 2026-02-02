-- Add signer identity fields to terms_acceptances table
ALTER TABLE public.terms_acceptances
ADD COLUMN IF NOT EXISTS signer_national_id text,
ADD COLUMN IF NOT EXISTS signer_id_front_url text,
ADD COLUMN IF NOT EXISTS signer_id_back_url text,
ADD COLUMN IF NOT EXISTS signer_phone text,
ADD COLUMN IF NOT EXISTS signer_position text,
ADD COLUMN IF NOT EXISTS verified_match boolean DEFAULT false;

-- Add national_id field to profiles table
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS national_id text,
ADD COLUMN IF NOT EXISTS id_card_front_url text,
ADD COLUMN IF NOT EXISTS id_card_back_url text;

-- Add comments for documentation
COMMENT ON COLUMN public.terms_acceptances.signer_national_id IS 'National ID of the person who signed the terms';
COMMENT ON COLUMN public.terms_acceptances.signer_id_front_url IS 'URL to front of ID card image';
COMMENT ON COLUMN public.terms_acceptances.signer_id_back_url IS 'URL to back of ID card image';
COMMENT ON COLUMN public.terms_acceptances.verified_match IS 'Whether signer info matches the registered user';
COMMENT ON COLUMN public.profiles.national_id IS 'User national ID number';
COMMENT ON COLUMN public.profiles.id_card_front_url IS 'URL to front of ID card image';
COMMENT ON COLUMN public.profiles.id_card_back_url IS 'URL to back of ID card image';