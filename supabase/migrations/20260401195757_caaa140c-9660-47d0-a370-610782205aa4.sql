
-- 1. Remove public read policy from shipment-documents storage bucket
DROP POLICY IF EXISTS "Public read access for shipment docs" ON storage.objects;

-- 2. Fix WhatsApp contact preferences - scope via whatsapp_messages
DROP POLICY IF EXISTS "Authenticated users can read contact preferences" ON public.whatsapp_contact_preferences;
CREATE POLICY "Org members read contact preferences" ON public.whatsapp_contact_preferences
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.whatsapp_messages wm
      JOIN public.organization_members om ON om.organization_id = wm.organization_id
      WHERE om.user_id = auth.uid()
        AND (wm.to_phone = whatsapp_contact_preferences.phone OR wm.from_phone = whatsapp_contact_preferences.phone)
    )
  );

-- 3. Fix WhatsApp AI analysis - scope via whatsapp_messages
DROP POLICY IF EXISTS "Authenticated users can read ai analysis" ON public.whatsapp_ai_analysis;
CREATE POLICY "Org members read ai analysis" ON public.whatsapp_ai_analysis
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.whatsapp_messages wm
      JOIN public.organization_members om ON om.organization_id = wm.organization_id
      WHERE om.user_id = auth.uid()
        AND (wm.to_phone = whatsapp_ai_analysis.phone OR wm.from_phone = whatsapp_ai_analysis.phone)
    )
  );

-- 4. Fix audit_sessions - scope to org members
DROP POLICY IF EXISTS "Auditor access via token" ON public.audit_sessions;
CREATE POLICY "Org members read audit sessions" ON public.audit_sessions
  FOR SELECT TO authenticated
  USING (
    organization_id IN (
      SELECT organization_id FROM public.organization_members WHERE user_id = auth.uid()
    )
  );
CREATE POLICY "Auditor token access" ON public.audit_sessions
  FOR SELECT TO anon
  USING (
    access_token IS NOT NULL
    AND access_token = ((current_setting('request.headers', true))::json ->> 'x-audit-token')
  );
