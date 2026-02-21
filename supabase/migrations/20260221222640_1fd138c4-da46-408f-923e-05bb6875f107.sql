
-- Drop any existing policies that might conflict
DROP POLICY IF EXISTS "Org members can view stamps" ON storage.objects;
DROP POLICY IF EXISTS "Org members can view id-cards" ON storage.objects;
DROP POLICY IF EXISTS "Org members can view payment-receipts" ON storage.objects;
DROP POLICY IF EXISTS "Org members can view deposit-receipts" ON storage.objects;
DROP POLICY IF EXISTS "Org members can view weighbridge-photos" ON storage.objects;
DROP POLICY IF EXISTS "Org members can view shipment-photos" ON storage.objects;
DROP POLICY IF EXISTS "Org members can view entity-documents" ON storage.objects;

-- Make critical storage buckets private
UPDATE storage.buckets SET public = false WHERE id = 'id-cards';
UPDATE storage.buckets SET public = false WHERE id = 'payment-receipts';
UPDATE storage.buckets SET public = false WHERE id = 'deposit-receipts';
UPDATE storage.buckets SET public = false WHERE id = 'organization-stamps';
UPDATE storage.buckets SET public = false WHERE id = 'weighbridge-photos';
UPDATE storage.buckets SET public = false WHERE id = 'shipment-photos';
UPDATE storage.buckets SET public = false WHERE id = 'entity-documents';

-- Drop overly permissive public SELECT policies
DROP POLICY IF EXISTS "Public can view organization stamps" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can view id cards" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can view id-cards" ON storage.objects;
DROP POLICY IF EXISTS "Public can view payment receipts" ON storage.objects;
DROP POLICY IF EXISTS "Public can view deposit receipts" ON storage.objects;
DROP POLICY IF EXISTS "Public can view weighbridge photos" ON storage.objects;
DROP POLICY IF EXISTS "Public can view shipment photos" ON storage.objects;
DROP POLICY IF EXISTS "Public can view entity documents" ON storage.objects;

-- Create secure RLS policies for authenticated org members

CREATE POLICY "Org members can view id-cards"
ON storage.objects FOR SELECT TO authenticated
USING (
  bucket_id = 'id-cards' AND
  (storage.foldername(name))[1] IN (
    SELECT organization_id::text FROM public.profiles WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Org members can view stamps"
ON storage.objects FOR SELECT TO authenticated
USING (
  bucket_id = 'organization-stamps' AND
  (storage.foldername(name))[1] IN (
    SELECT organization_id::text FROM public.profiles WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Org members can view payment-receipts"
ON storage.objects FOR SELECT TO authenticated
USING (
  bucket_id = 'payment-receipts' AND
  (storage.foldername(name))[1] IN (
    SELECT organization_id::text FROM public.profiles WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Org members can view deposit-receipts"
ON storage.objects FOR SELECT TO authenticated
USING (
  bucket_id = 'deposit-receipts' AND
  (storage.foldername(name))[1] IN (
    SELECT organization_id::text FROM public.profiles WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Org members can view weighbridge-photos"
ON storage.objects FOR SELECT TO authenticated
USING (
  bucket_id = 'weighbridge-photos' AND
  (storage.foldername(name))[1] IN (
    SELECT organization_id::text FROM public.profiles WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Org members can view shipment-photos"
ON storage.objects FOR SELECT TO authenticated
USING (
  bucket_id = 'shipment-photos' AND
  (storage.foldername(name))[1] IN (
    SELECT organization_id::text FROM public.profiles WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Org members can view entity-documents"
ON storage.objects FOR SELECT TO authenticated
USING (
  bucket_id = 'entity-documents' AND
  (storage.foldername(name))[1] IN (
    SELECT organization_id::text FROM public.profiles WHERE user_id = auth.uid()
  )
);

-- Create portal_sessions table
CREATE TABLE IF NOT EXISTS public.portal_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  token TEXT NOT NULL UNIQUE,
  client_id UUID NOT NULL REFERENCES public.portal_clients(id) ON DELETE CASCADE,
  portal_id UUID NOT NULL REFERENCES public.client_portals(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  ip_address TEXT,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.portal_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role manages portal sessions"
ON public.portal_sessions FOR ALL
USING (false)
WITH CHECK (false);

CREATE INDEX IF NOT EXISTS idx_portal_sessions_token_expires ON public.portal_sessions(token, expires_at);
CREATE INDEX IF NOT EXISTS idx_portal_sessions_client ON public.portal_sessions(client_id);

CREATE OR REPLACE FUNCTION public.cleanup_expired_portal_sessions()
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  DELETE FROM public.portal_sessions WHERE expires_at < now();
$$;
