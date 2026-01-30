-- Drop and recreate with proper permissions
DROP POLICY IF EXISTS "Anyone can register an organization" ON public.organizations;

-- Grant INSERT to anon role explicitly
GRANT INSERT ON public.organizations TO anon;

-- Create policy for anon and authenticated users
CREATE POLICY "Anyone can register an organization"
ON public.organizations FOR INSERT
TO public
WITH CHECK (true);

-- Also ensure profiles table allows registration
DROP POLICY IF EXISTS "Anyone can register a profile" ON public.profiles;

GRANT INSERT ON public.profiles TO anon;

CREATE POLICY "Anyone can register a profile"
ON public.profiles FOR INSERT
TO public
WITH CHECK (true);