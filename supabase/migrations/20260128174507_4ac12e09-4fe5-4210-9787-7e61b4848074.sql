-- Drop existing INSERT policy if exists
DROP POLICY IF EXISTS "Anyone can register an organization" ON public.organizations;

-- Create new INSERT policy that allows registration without authentication
CREATE POLICY "Anyone can register an organization"
ON public.organizations FOR INSERT
TO anon, authenticated
WITH CHECK (true);