
-- Fix scoped_link_sessions policies (column is link_id not scoped_link_id)
DROP POLICY IF EXISTS "Org members view scoped sessions" ON public.scoped_link_sessions;
DROP POLICY IF EXISTS "Anyone can create scoped sessions via valid link" ON public.scoped_link_sessions;

CREATE POLICY "Org members view scoped sessions"
ON public.scoped_link_sessions
FOR SELECT
USING (
  link_id IN (
    SELECT id FROM public.scoped_access_links 
    WHERE organization_id IN (
      SELECT organization_id FROM public.profiles WHERE user_id = auth.uid()
    )
  )
);

CREATE POLICY "Anyone can create scoped sessions via valid link"
ON public.scoped_link_sessions
FOR INSERT
WITH CHECK (
  link_id IN (
    SELECT id FROM public.scoped_access_links 
    WHERE is_active = true AND expires_at > now()
  )
);
