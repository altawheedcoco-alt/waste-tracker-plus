-- Create extensions schema if not exists
CREATE SCHEMA IF NOT EXISTS extensions;

-- Move pg_trgm from public to extensions
ALTER EXTENSION pg_trgm SET SCHEMA extensions;

-- Grant usage so it remains usable
GRANT USAGE ON SCHEMA extensions TO postgres, anon, authenticated, service_role;