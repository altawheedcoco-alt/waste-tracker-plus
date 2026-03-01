
-- Allow admin users to see ALL verified partnerships
CREATE POLICY "Admins can view all partnerships"
ON public.verified_partnerships
FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));
