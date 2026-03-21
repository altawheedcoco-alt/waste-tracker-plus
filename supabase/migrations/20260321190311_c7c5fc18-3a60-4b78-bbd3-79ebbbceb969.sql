-- Allow all authenticated users to view public/active broadcast channels
CREATE POLICY "All authenticated can view public channels"
ON public.broadcast_channels
FOR SELECT
TO authenticated
USING (
  is_active = true
  AND (channel_visibility IS NULL OR channel_visibility = 'public')
);

-- Admin can manage ALL broadcast channels
CREATE POLICY "Admin full access to channels"
ON public.broadcast_channels
FOR ALL
TO authenticated
USING (is_current_user_admin())
WITH CHECK (is_current_user_admin());

-- Allow all authenticated to view posts of channels they can see
CREATE POLICY "All can view public channel posts"
ON public.broadcast_posts
FOR SELECT
TO authenticated
USING (
  channel_id IN (
    SELECT id FROM broadcast_channels
    WHERE is_active = true
    AND (channel_visibility IS NULL OR channel_visibility = 'public')
  )
);

-- Allow all authenticated to subscribe to public channels
CREATE POLICY "All can subscribe to public channels"
ON public.broadcast_channel_subscribers
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = user_id
  AND channel_id IN (
    SELECT id FROM broadcast_channels
    WHERE is_active = true
    AND (channel_visibility IS NULL OR channel_visibility = 'public')
  )
);

-- Allow all authenticated to view their own subscriptions
CREATE POLICY "Users can view own subscriptions"
ON public.broadcast_channel_subscribers
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- Admin can view all subscribers
CREATE POLICY "Admin can view all subscribers"
ON public.broadcast_channel_subscribers
FOR SELECT
TO authenticated
USING (is_current_user_admin());

-- Admin can manage all posts
CREATE POLICY "Admin full access to posts"
ON public.broadcast_posts
FOR ALL
TO authenticated
USING (is_current_user_admin())
WITH CHECK (is_current_user_admin());
