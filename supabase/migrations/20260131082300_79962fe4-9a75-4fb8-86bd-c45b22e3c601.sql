
-- Add policy for admins to read driver profiles for notifications
CREATE POLICY "Admins can read driver profiles for notifications"
ON public.profiles
FOR SELECT
USING (
  has_role(auth.uid(), 'admin'::app_role)
);
