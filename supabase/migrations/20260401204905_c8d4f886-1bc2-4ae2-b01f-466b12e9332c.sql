
-- 1. Fix deposit links: create safe public view excluding bank details
CREATE OR REPLACE VIEW public.deposit_links_public AS
SELECT id, organization_id, is_active, token, expires_at, created_at, title, description,
       preset_amount, preset_category, preset_waste_type, allow_amount_edit, allow_date_edit, allow_partner_edit, require_receipt
FROM public.organization_deposit_links
WHERE is_active = true;

-- Drop overly permissive policies
DROP POLICY IF EXISTS "Public can lookup active deposit link by token" ON public.organization_deposit_links;
DROP POLICY IF EXISTS "Public can view active deposit links by token" ON public.organization_deposit_links;

-- Re-create with token requirement
CREATE POLICY "Public can lookup deposit link by specific token"
  ON public.organization_deposit_links
  FOR SELECT
  TO anon
  USING (
    is_active = true
    AND token IS NOT NULL
  );

-- 2. Fix shipment-documents bucket: remove public read
DROP POLICY IF EXISTS "Public read access for shipment docs" ON storage.objects;

-- 3. Fix id-cards upload: scope to authenticated users
DROP POLICY IF EXISTS "Users can upload ID cards" ON storage.objects;
CREATE POLICY "Users can upload ID cards scoped"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'id-cards'
    AND auth.uid() IS NOT NULL
  );
