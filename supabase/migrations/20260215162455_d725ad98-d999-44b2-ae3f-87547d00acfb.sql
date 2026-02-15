
-- Fix the overly permissive INSERT policy
DROP POLICY IF EXISTS "System can insert schema logs" ON public.system_schema_log;

CREATE POLICY "Admins can insert schema logs" ON public.system_schema_log
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin')
  );
