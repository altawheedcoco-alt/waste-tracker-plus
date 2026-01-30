-- Tighten public access: registration should go through backend function, not direct table INSERTs.

-- Remove permissive public INSERT policies
DROP POLICY IF EXISTS "Anyone can register an organization" ON public.organizations;
DROP POLICY IF EXISTS "Anyone can register a profile" ON public.profiles;

-- Revoke anon write privileges (keep read privileges as-is)
REVOKE INSERT, UPDATE, DELETE ON public.organizations FROM anon;
REVOKE INSERT, UPDATE, DELETE ON public.profiles FROM anon;

-- (Optional hardening) also revoke TRUNCATE/REFERENCES/TRIGGER if present
REVOKE TRUNCATE, REFERENCES, TRIGGER ON public.organizations FROM anon;
REVOKE TRUNCATE, REFERENCES, TRIGGER ON public.profiles FROM anon;