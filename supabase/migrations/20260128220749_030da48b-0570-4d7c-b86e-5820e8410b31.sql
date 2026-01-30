-- Allow admins to insert organizations
CREATE POLICY "Admins can insert organizations"
ON public.organizations
FOR INSERT
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));