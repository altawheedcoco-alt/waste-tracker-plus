
-- =============================================
-- المرحلة 1: تأمين البيانات الحرجة
-- =============================================

-- 1.1 تأمين organization_deposit_links - إزالة السياسة العامة
DROP POLICY IF EXISTS "Anyone can view deposit links" ON organization_deposit_links;
DROP POLICY IF EXISTS "Public can view active deposit links" ON organization_deposit_links;

-- إضافة سياسة تقييد القراءة لأعضاء المنظمة فقط
CREATE POLICY "Org members can view deposit links"
ON organization_deposit_links FOR SELECT
TO authenticated
USING (organization_id = get_user_org_id_safe(auth.uid()));

-- 1.2 تحويل حاويات التخزين الحساسة من عامة إلى خاصة
UPDATE storage.buckets SET public = false WHERE id IN (
  'id-cards', 'organization-stamps', 'payment-receipts',
  'deposit-receipts', 'document-archive', 'organization-documents',
  'weighbridge-photos', 'rating-evidence'
);

-- 1.3 سياسات RLS للتخزين - القراءة المؤمنة لكل حاوية خاصة

-- id-cards
DROP POLICY IF EXISTS "Org members can read id-cards" ON storage.objects;
CREATE POLICY "Org members can read id-cards"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'id-cards'
  AND (storage.foldername(name))[1] = get_user_org_id_safe(auth.uid())::text
);

-- organization-stamps
DROP POLICY IF EXISTS "Org members can read organization-stamps" ON storage.objects;
CREATE POLICY "Org members can read organization-stamps"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'organization-stamps'
  AND (storage.foldername(name))[1] = get_user_org_id_safe(auth.uid())::text
);

-- payment-receipts
DROP POLICY IF EXISTS "Org members can read payment-receipts" ON storage.objects;
CREATE POLICY "Org members can read payment-receipts"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'payment-receipts'
  AND (storage.foldername(name))[1] = get_user_org_id_safe(auth.uid())::text
);

-- deposit-receipts
DROP POLICY IF EXISTS "Org members can read deposit-receipts" ON storage.objects;
CREATE POLICY "Org members can read deposit-receipts"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'deposit-receipts'
  AND (storage.foldername(name))[1] = get_user_org_id_safe(auth.uid())::text
);

-- document-archive
DROP POLICY IF EXISTS "Org members can read document-archive" ON storage.objects;
CREATE POLICY "Org members can read document-archive"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'document-archive'
  AND (storage.foldername(name))[1] = get_user_org_id_safe(auth.uid())::text
);

-- organization-documents
DROP POLICY IF EXISTS "Org members can read organization-documents" ON storage.objects;
CREATE POLICY "Org members can read organization-documents"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'organization-documents'
  AND (storage.foldername(name))[1] = get_user_org_id_safe(auth.uid())::text
);

-- weighbridge-photos
DROP POLICY IF EXISTS "Org members can read weighbridge-photos" ON storage.objects;
CREATE POLICY "Org members can read weighbridge-photos"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'weighbridge-photos'
  AND (storage.foldername(name))[1] = get_user_org_id_safe(auth.uid())::text
);

-- rating-evidence
DROP POLICY IF EXISTS "Org members can read rating-evidence" ON storage.objects;
CREATE POLICY "Org members can read rating-evidence"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'rating-evidence'
  AND (storage.foldername(name))[1] = get_user_org_id_safe(auth.uid())::text
);
