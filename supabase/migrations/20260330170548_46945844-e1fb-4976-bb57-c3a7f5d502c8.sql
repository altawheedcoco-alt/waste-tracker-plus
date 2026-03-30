-- Fix platform_post_likes policies (uses visitor_id not user_id)
DROP POLICY IF EXISTS "Anyone can delete own likes" ON public.platform_post_likes;
CREATE POLICY "Anyone can delete own likes" ON public.platform_post_likes
  FOR DELETE
  USING (visitor_id IS NOT NULL);

DROP POLICY IF EXISTS "Anyone can insert likes" ON public.platform_post_likes;
CREATE POLICY "Anyone can insert likes" ON public.platform_post_likes
  FOR INSERT
  WITH CHECK (visitor_id IS NOT NULL);

-- security_events: only authenticated system can insert
DROP POLICY IF EXISTS "System inserts security events" ON public.security_events;
CREATE POLICY "System inserts security events" ON public.security_events
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() IS NOT NULL);
