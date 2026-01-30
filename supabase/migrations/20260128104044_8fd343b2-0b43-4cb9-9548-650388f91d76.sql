-- Allow anyone to insert organizations for registration (pending approval)
CREATE POLICY "Anyone can register an organization"
ON public.organizations
FOR INSERT
WITH CHECK (true);

-- Allow anyone to insert profiles for registration
CREATE POLICY "Anyone can register a profile"
ON public.profiles
FOR INSERT
WITH CHECK (true);

-- Allow anyone to insert user roles for registration
CREATE POLICY "Anyone can insert their own role"
ON public.user_roles
FOR INSERT
WITH CHECK (user_id = auth.uid());