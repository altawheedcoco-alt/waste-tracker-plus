
-- Add RLS policies for portal_auth_attempts table
-- This table is used internally by the portal-auth edge function (via service role)
-- No direct client access should be allowed

-- Deny all access to anonymous and authenticated users
-- Only service_role (used by edge functions) can access this table
CREATE POLICY "Admins can view portal auth attempts"
ON public.portal_auth_attempts FOR SELECT TO authenticated
USING (
  has_role(auth.uid(), 'admin'::app_role)
);

CREATE POLICY "No direct insert for users"
ON public.portal_auth_attempts FOR INSERT TO authenticated
WITH CHECK (
  has_role(auth.uid(), 'admin'::app_role)
);

CREATE POLICY "No direct update for users"
ON public.portal_auth_attempts FOR UPDATE TO authenticated
USING (
  has_role(auth.uid(), 'admin'::app_role)
);

CREATE POLICY "Admins can delete portal auth attempts"
ON public.portal_auth_attempts FOR DELETE TO authenticated
USING (
  has_role(auth.uid(), 'admin'::app_role)
);
