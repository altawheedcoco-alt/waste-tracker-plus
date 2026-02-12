
-- Add signature and stamp fields to shared_documents
ALTER TABLE public.shared_documents
  ADD COLUMN IF NOT EXISTS signed_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS signed_by UUID,
  ADD COLUMN IF NOT EXISTS signer_name TEXT,
  ADD COLUMN IF NOT EXISTS signature_url TEXT,
  ADD COLUMN IF NOT EXISTS stamp_url TEXT,
  ADD COLUMN IF NOT EXISTS stamp_applied BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS signature_integrity_hash TEXT,
  ADD COLUMN IF NOT EXISTS requires_signature BOOLEAN DEFAULT false;
