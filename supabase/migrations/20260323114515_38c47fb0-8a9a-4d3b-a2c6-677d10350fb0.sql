-- Drop the permissive policy that allows any authenticated user
DROP POLICY IF EXISTS "Authenticated users can manage posts" ON public.platform_posts;

-- Only admin can insert/update/delete
CREATE POLICY "Only admin can manage posts"
  ON public.platform_posts
  FOR ALL
  TO authenticated
  USING (public.is_current_user_admin())
  WITH CHECK (public.is_current_user_admin());
