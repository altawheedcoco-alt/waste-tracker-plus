
-- Fix ad_analytics to validate the advertisement exists
DROP POLICY IF EXISTS "Authenticated users can insert analytics" ON public.ad_analytics;
CREATE POLICY "Users can insert analytics for valid ads"
ON public.ad_analytics FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.advertisements a
    WHERE a.id = advertisement_id
    AND a.status = 'active'
  )
);
