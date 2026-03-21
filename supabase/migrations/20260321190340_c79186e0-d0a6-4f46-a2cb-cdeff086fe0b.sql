-- Admin can view all reports for moderation
CREATE POLICY "Admin can view all reports"
ON public.broadcast_reports
FOR SELECT
TO authenticated
USING (is_current_user_admin());

-- Admin can manage all comments
CREATE POLICY "Admin manage all comments"
ON public.broadcast_post_comments
FOR ALL
TO authenticated
USING (is_current_user_admin())
WITH CHECK (is_current_user_admin());

-- Admin can manage blocked users
CREATE POLICY "Admin manage all blocks"
ON public.broadcast_blocked_users
FOR ALL
TO authenticated
USING (is_current_user_admin())
WITH CHECK (is_current_user_admin());

-- Admin can manage channel admins
CREATE POLICY "Admin manage all channel admins"
ON public.broadcast_channel_admins
FOR ALL
TO authenticated
USING (is_current_user_admin())
WITH CHECK (is_current_user_admin());
