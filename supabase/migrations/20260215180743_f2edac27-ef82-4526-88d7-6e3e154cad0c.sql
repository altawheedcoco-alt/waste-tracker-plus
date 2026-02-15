
-- Create a trigger function that prevents non-admin users from being linked to multiple organizations
CREATE OR REPLACE FUNCTION public.enforce_single_org_membership()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Allow system admins to be linked to multiple organizations
  IF EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = NEW.user_id AND role = 'admin'
  ) THEN
    RETURN NEW;
  END IF;

  -- For non-admins: check if they already belong to another organization
  IF EXISTS (
    SELECT 1 FROM public.user_organizations
    WHERE user_id = NEW.user_id
      AND organization_id != NEW.organization_id
      AND is_active = true
  ) THEN
    RAISE EXCEPTION 'لا يمكن للمستخدم الانتماء لأكثر من منظمة واحدة. يُسمح فقط لمدير النظام بالارتباط بمنظمات متعددة.';
  END IF;

  RETURN NEW;
END;
$$;

-- Create the trigger on user_organizations
DROP TRIGGER IF EXISTS trg_enforce_single_org_membership ON public.user_organizations;
CREATE TRIGGER trg_enforce_single_org_membership
  BEFORE INSERT ON public.user_organizations
  FOR EACH ROW
  EXECUTE FUNCTION public.enforce_single_org_membership();

-- Also restrict the INSERT RLS policy to be more strict:
-- Drop existing insert policy and recreate with admin-only restriction
DROP POLICY IF EXISTS "Company admins can insert memberships" ON public.user_organizations;

CREATE POLICY "Only system admins can add memberships"
  ON public.user_organizations
  FOR INSERT
  WITH CHECK (
    has_role(auth.uid(), 'admin'::app_role)
  );
