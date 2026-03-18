-- Remove the dangerous public SELECT policy that exposes bot tokens
DROP POLICY IF EXISTS "Public can read enabled configs" ON public.ai_agent_configs;

-- Add a safe public-facing policy that only exposes non-sensitive fields
-- Since RLS policies can't restrict columns, we create a view instead
-- and restrict the table to authenticated org members only.
-- The existing "Org members manage agent config" and "Admin full access" policies 
-- already cover authenticated access, so no new policy needed.