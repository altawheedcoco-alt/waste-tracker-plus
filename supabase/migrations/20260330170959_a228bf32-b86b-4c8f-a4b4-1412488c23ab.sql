-- Fix AI tables: restrict ALL policies to authenticated + org-scoped instead of true

-- ai_action_queue
DROP POLICY IF EXISTS "Service role manages AI queue" ON public.ai_action_queue;
CREATE POLICY "Authenticated manages own org AI queue" ON public.ai_action_queue
  FOR ALL TO authenticated
  USING (organization_id IN (
    SELECT organization_id FROM public.profiles WHERE id = auth.uid()
  ))
  WITH CHECK (organization_id IN (
    SELECT organization_id FROM public.profiles WHERE id = auth.uid()
  ));

-- ai_platform_config
DROP POLICY IF EXISTS "Service role manages AI config" ON public.ai_platform_config;
CREATE POLICY "Authenticated manages own org AI config" ON public.ai_platform_config
  FOR ALL TO authenticated
  USING (organization_id IN (
    SELECT organization_id FROM public.profiles WHERE id = auth.uid()
  ))
  WITH CHECK (organization_id IN (
    SELECT organization_id FROM public.profiles WHERE id = auth.uid()
  ));

-- ai_usage_log
DROP POLICY IF EXISTS "Service role manages AI usage" ON public.ai_usage_log;
CREATE POLICY "Authenticated manages own org AI usage" ON public.ai_usage_log
  FOR ALL TO authenticated
  USING (organization_id IN (
    SELECT organization_id FROM public.profiles WHERE id = auth.uid()
  ))
  WITH CHECK (organization_id IN (
    SELECT organization_id FROM public.profiles WHERE id = auth.uid()
  ));

-- Also allow service_role full access for edge functions
CREATE POLICY "Service role full access AI queue" ON public.ai_action_queue
  FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "Service role full access AI config" ON public.ai_platform_config
  FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "Service role full access AI usage" ON public.ai_usage_log
  FOR ALL TO service_role USING (true) WITH CHECK (true);
