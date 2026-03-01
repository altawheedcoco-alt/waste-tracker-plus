
-- Create a protected admin record that prevents deletion/modification
-- This trigger protects the primary admin account from being removed

CREATE OR REPLACE FUNCTION public.protect_primary_admin()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Protect the primary admin user_id from deletion or role change
  IF TG_OP = 'DELETE' AND OLD.user_id = '354d5b82-68b0-4289-923f-77b121258365' AND OLD.role = 'admin' THEN
    RAISE EXCEPTION 'Cannot delete the primary system administrator role';
  END IF;
  
  IF TG_OP = 'UPDATE' AND OLD.user_id = '354d5b82-68b0-4289-923f-77b121258365' AND OLD.role = 'admin' AND NEW.role != 'admin' THEN
    RAISE EXCEPTION 'Cannot change the primary system administrator role';
  END IF;
  
  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  END IF;
  RETURN NEW;
END;
$$;

-- Attach trigger to user_roles table
CREATE TRIGGER protect_primary_admin_trigger
BEFORE DELETE OR UPDATE ON public.user_roles
FOR EACH ROW
EXECUTE FUNCTION public.protect_primary_admin();

-- Also protect the profile from deletion
CREATE OR REPLACE FUNCTION public.protect_primary_admin_profile()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'DELETE' AND OLD.user_id = '354d5b82-68b0-4289-923f-77b121258365' THEN
    RAISE EXCEPTION 'Cannot delete the primary system administrator profile';
  END IF;
  
  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER protect_primary_admin_profile_trigger
BEFORE DELETE ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.protect_primary_admin_profile();
