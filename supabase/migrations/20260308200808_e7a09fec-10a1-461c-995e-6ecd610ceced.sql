
CREATE OR REPLACE FUNCTION public.get_member_role_level(role public.member_role)
RETURNS integer
LANGUAGE sql
IMMUTABLE
SET search_path = public
AS $$
  SELECT CASE role::text
    WHEN 'owner' THEN 1
    WHEN 'assistant' THEN 2
    WHEN 'deputy_assistant' THEN 3
    WHEN 'agent' THEN 4
    WHEN 'delegate' THEN 5
    WHEN 'member' THEN 6
    ELSE 99
  END;
$$;
