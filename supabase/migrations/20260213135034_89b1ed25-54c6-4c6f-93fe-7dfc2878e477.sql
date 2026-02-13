
-- Add contractor identification and signing fields to contracts table
ALTER TABLE public.contracts
  ADD COLUMN IF NOT EXISTS contractor_type text DEFAULT 'internal' CHECK (contractor_type IN ('internal', 'external')),
  ADD COLUMN IF NOT EXISTS external_legal_name text,
  ADD COLUMN IF NOT EXISTS external_tax_id text,
  ADD COLUMN IF NOT EXISTS external_commercial_register text,
  ADD COLUMN IF NOT EXISTS external_address text,
  ADD COLUMN IF NOT EXISTS external_representative text,
  ADD COLUMN IF NOT EXISTS external_phone text,
  ADD COLUMN IF NOT EXISTS external_email text,
  ADD COLUMN IF NOT EXISTS signing_method text DEFAULT 'none' CHECK (signing_method IN ('none', 'digital', 'manual')),
  ADD COLUMN IF NOT EXISTS party_one_signature_url text,
  ADD COLUMN IF NOT EXISTS party_two_signature_url text,
  ADD COLUMN IF NOT EXISTS party_one_signed_at timestamptz,
  ADD COLUMN IF NOT EXISTS party_two_signed_at timestamptz,
  ADD COLUMN IF NOT EXISTS share_token text UNIQUE,
  ADD COLUMN IF NOT EXISTS shared_at timestamptz,
  ADD COLUMN IF NOT EXISTS shared_via text;
