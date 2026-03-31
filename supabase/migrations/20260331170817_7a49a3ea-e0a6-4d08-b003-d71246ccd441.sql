-- 1. FIX: external_missions UPDATE policy
DROP POLICY IF EXISTS "public_update_by_token_secure" ON public.external_missions;
CREATE POLICY "public_update_by_token_secure" ON public.external_missions
  FOR UPDATE TO public
  USING (token IS NOT NULL AND token = ((current_setting('request.headers', true))::json ->> 'x-mission-token'))
  WITH CHECK (token IS NOT NULL AND token = ((current_setting('request.headers', true))::json ->> 'x-mission-token'));

-- 2. FIX: worker_profiles PII
DROP POLICY IF EXISTS "Anyone can view available workers" ON public.worker_profiles;
CREATE POLICY "Org members and agencies can view workers" ON public.worker_profiles
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id OR id IN (SELECT ac.worker_id FROM agency_candidates ac JOIN recruitment_agencies ra ON ra.id = ac.agency_id WHERE ra.organization_id IN (SELECT organization_id FROM organization_members WHERE user_id = auth.uid())) OR is_current_user_admin());

-- 3. FIX: chat - scope to channel members
DROP POLICY IF EXISTS "Members can view channel messages" ON public.chat_channel_messages;
CREATE POLICY "Members can view channel messages" ON public.chat_channel_messages
  FOR SELECT TO authenticated
  USING (channel_id IN (SELECT channel_id FROM chat_channel_members WHERE user_id = auth.uid()) OR is_current_user_admin());

DROP POLICY IF EXISTS "Members can view their channels" ON public.chat_channels;
CREATE POLICY "Members can view their channels" ON public.chat_channels
  FOR SELECT TO authenticated
  USING (id IN (SELECT channel_id FROM chat_channel_members WHERE user_id = auth.uid()) OR auth.uid() = created_by OR is_current_user_admin());

DROP POLICY IF EXISTS "Members can view channel members" ON public.chat_channel_members;
CREATE POLICY "Members can view channel members" ON public.chat_channel_members
  FOR SELECT TO authenticated
  USING (channel_id IN (SELECT channel_id FROM chat_channel_members WHERE user_id = auth.uid()) OR is_current_user_admin());

-- 4. FIX: app_config
DROP POLICY IF EXISTS "Anyone can read app_config" ON public.app_config;
CREATE POLICY "Authenticated users can read app_config" ON public.app_config
  FOR SELECT TO authenticated USING (true);

-- 5. FIX: Storage policies
DROP POLICY IF EXISTS "Public view weighbridge photos" ON storage.objects;

DROP POLICY IF EXISTS "Org members can view employee files" ON storage.objects;
CREATE POLICY "Org members can view employee files" ON storage.objects FOR SELECT TO authenticated USING (bucket_id = 'employee-files' AND (storage.foldername(name))[1] = (get_user_org_id_safe(auth.uid()))::text);

DROP POLICY IF EXISTS "Org members can upload employee files" ON storage.objects;
CREATE POLICY "Org members can upload employee files" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'employee-files' AND (storage.foldername(name))[1] = (get_user_org_id_safe(auth.uid()))::text);

DROP POLICY IF EXISTS "Org members can delete employee files" ON storage.objects;
CREATE POLICY "Org members can delete employee files" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'employee-files' AND (storage.foldername(name))[1] = (get_user_org_id_safe(auth.uid()))::text);

DROP POLICY IF EXISTS "Users can view organization PDFs" ON storage.objects;
CREATE POLICY "Users can view organization PDFs" ON storage.objects FOR SELECT TO authenticated USING (bucket_id = 'pdf-documents' AND (storage.foldername(name))[1] = (get_user_org_id_safe(auth.uid()))::text);

DROP POLICY IF EXISTS "Users can view shared documents they have access to" ON storage.objects;
CREATE POLICY "Users can view shared documents they have access to" ON storage.objects FOR SELECT TO authenticated USING (bucket_id = 'shared-documents' AND ((storage.foldername(name))[1] = (get_user_org_id_safe(auth.uid()))::text OR is_current_user_admin()));

-- 6. FIX: Storage write/delete scoping
DROP POLICY IF EXISTS "Users can upload deposit receipts" ON storage.objects;
CREATE POLICY "Users can upload deposit receipts" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'deposit-receipts' AND (storage.foldername(name))[1] = (get_user_org_id_safe(auth.uid()))::text);

DROP POLICY IF EXISTS "Users can delete their deposit receipts" ON storage.objects;
CREATE POLICY "Users can delete their deposit receipts" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'deposit-receipts' AND (storage.foldername(name))[1] = (get_user_org_id_safe(auth.uid()))::text);

DROP POLICY IF EXISTS "Users can view their organization deposit receipts" ON storage.objects;
CREATE POLICY "Users can view their organization deposit receipts" ON storage.objects FOR SELECT TO authenticated USING (bucket_id = 'deposit-receipts' AND (storage.foldername(name))[1] = (get_user_org_id_safe(auth.uid()))::text);

DROP POLICY IF EXISTS "Authenticated users can upload payment receipts" ON storage.objects;
CREATE POLICY "Authenticated users can upload payment receipts" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'payment-receipts' AND (storage.foldername(name))[1] = (get_user_org_id_safe(auth.uid()))::text);

DROP POLICY IF EXISTS "Users can update payment receipts" ON storage.objects;
CREATE POLICY "Users can update payment receipts" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'payment-receipts' AND (storage.foldername(name))[1] = (get_user_org_id_safe(auth.uid()))::text);

DROP POLICY IF EXISTS "Users can delete payment receipts" ON storage.objects;
CREATE POLICY "Users can delete payment receipts" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'payment-receipts' AND (storage.foldername(name))[1] = (get_user_org_id_safe(auth.uid()))::text);

DROP POLICY IF EXISTS "Allow authenticated signature uploads" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated signature updates" ON storage.objects;

-- 7. FIX: org-documents and signing-documents INSERT scoping
DROP POLICY IF EXISTS "Chat files upload policy" ON storage.objects;
CREATE POLICY "Chat files upload policy" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'organization-documents' AND (storage.foldername(name))[1] = (get_user_org_id_safe(auth.uid()))::text);

DROP POLICY IF EXISTS "Users can upload signing documents" ON storage.objects;
CREATE POLICY "Users can upload signing documents" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'signing-documents' AND (storage.foldername(name))[1] = (get_user_org_id_safe(auth.uid()))::text);

DROP POLICY IF EXISTS "Authenticated users can upload shipment docs" ON storage.objects;
CREATE POLICY "Authenticated users can upload shipment docs" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'shipment-documents' AND (storage.foldername(name))[1] = (get_user_org_id_safe(auth.uid()))::text);