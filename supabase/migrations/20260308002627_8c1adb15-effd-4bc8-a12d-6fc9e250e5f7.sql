-- Fixed hierarchical roles for organization members
CREATE TYPE public.member_role AS ENUM (
  'entity_head',
  'assistant',
  'deputy_assistant',
  'agent',
  'delegate',
  'member'
);

-- Add member_role and permissions columns to organization_members
ALTER TABLE public.organization_members
  ADD COLUMN IF NOT EXISTS member_role member_role NOT NULL DEFAULT 'member',
  ADD COLUMN IF NOT EXISTS granted_permissions jsonb DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS can_manage_members boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS can_grant_permissions boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS max_grantable_level integer DEFAULT 6,
  ADD COLUMN IF NOT EXISTS appointed_by uuid REFERENCES public.organization_members(id) ON DELETE SET NULL;

-- Map role to hierarchy level (1=highest, 6=lowest)
CREATE OR REPLACE FUNCTION public.get_member_role_level(role member_role)
RETURNS integer
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT CASE role
    WHEN 'entity_head' THEN 1
    WHEN 'assistant' THEN 2
    WHEN 'deputy_assistant' THEN 3
    WHEN 'agent' THEN 4
    WHEN 'delegate' THEN 5
    WHEN 'member' THEN 6
  END;
$$;

-- Security definer function to check if a user is a member of an org with minimum role level
CREATE OR REPLACE FUNCTION public.is_org_member_with_role(
  _user_id uuid,
  _org_id uuid,
  _max_level integer DEFAULT 6
)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.organization_members om
    WHERE om.user_id = _user_id
      AND om.organization_id = _org_id
      AND om.status = 'active'
      AND public.get_member_role_level(om.member_role) <= _max_level
  );
$$;

-- Function to check if granting member can assign a role
CREATE OR REPLACE FUNCTION public.can_assign_member_role(
  _granting_user_id uuid,
  _org_id uuid,
  _target_role member_role
)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.organization_members om
    WHERE om.user_id = _granting_user_id
      AND om.organization_id = _org_id
      AND om.status = 'active'
      AND (om.can_manage_members = true OR om.member_role = 'entity_head')
      AND public.get_member_role_level(om.member_role) < public.get_member_role_level(_target_role)
  );
$$;

-- Update the first member (company_admin) of each org to entity_head
UPDATE public.organization_members om
SET member_role = 'entity_head',
    can_manage_members = true,
    can_grant_permissions = true,
    max_grantable_level = 6
FROM (
  SELECT DISTINCT ON (organization_id) id
  FROM public.organization_members
  WHERE status = 'active'
  ORDER BY organization_id, created_at ASC
) first_member
WHERE om.id = first_member.id;

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.organization_members;