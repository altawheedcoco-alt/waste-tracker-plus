DROP POLICY IF EXISTS "Authenticated users can insert access logs" ON public.document_access_log;
CREATE POLICY "Authenticated users can insert own access logs" ON public.document_access_log
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Authenticated users can insert journey events" ON public.document_journey_events;
CREATE POLICY "Authenticated users can insert own journey events" ON public.document_journey_events
  FOR INSERT TO authenticated
  WITH CHECK (actor_user_id = auth.uid());
