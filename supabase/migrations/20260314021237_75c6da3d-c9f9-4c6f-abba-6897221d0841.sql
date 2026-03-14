-- Allow employees to read their OWN permissions
CREATE POLICY "Users can view their own permissions"
ON public.employee_permissions
FOR SELECT
USING (profile_id = auth.uid());