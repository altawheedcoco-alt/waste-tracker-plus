
-- Fix RLS policies for whatsapp_contact_preferences
DROP POLICY IF EXISTS "Admins can manage contact preferences" ON public.whatsapp_contact_preferences;

CREATE POLICY "Authenticated users can read contact preferences"
  ON public.whatsapp_contact_preferences FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can insert contact preferences"
  ON public.whatsapp_contact_preferences FOR INSERT TO authenticated
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can update contact preferences"
  ON public.whatsapp_contact_preferences FOR UPDATE TO authenticated
  USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);

-- Fix RLS policies for whatsapp_ai_analysis
DROP POLICY IF EXISTS "Admins can manage ai analysis" ON public.whatsapp_ai_analysis;

CREATE POLICY "Authenticated users can read ai analysis"
  ON public.whatsapp_ai_analysis FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can insert ai analysis"
  ON public.whatsapp_ai_analysis FOR INSERT TO authenticated
  WITH CHECK (auth.uid() IS NOT NULL);
