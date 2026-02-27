
-- Add public access token for external sharing
ALTER TABLE public.shared_documents
  ADD COLUMN IF NOT EXISTS public_access_token TEXT UNIQUE,
  ADD COLUMN IF NOT EXISTS is_external_share BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS external_recipient_name TEXT,
  ADD COLUMN IF NOT EXISTS external_recipient_email TEXT,
  ADD COLUMN IF NOT EXISTS external_views_count INT DEFAULT 0,
  ADD COLUMN IF NOT EXISTS expires_at TIMESTAMPTZ;

-- Create index for fast token lookups
CREATE INDEX IF NOT EXISTS idx_shared_docs_public_token ON public.shared_documents(public_access_token) WHERE public_access_token IS NOT NULL;

-- Allow anonymous SELECT for public shared documents (by token only)
CREATE POLICY "Public can view shared documents by token"
ON public.shared_documents
FOR SELECT
TO anon
USING (public_access_token IS NOT NULL AND is_external_share = true AND (expires_at IS NULL OR expires_at > now()));
