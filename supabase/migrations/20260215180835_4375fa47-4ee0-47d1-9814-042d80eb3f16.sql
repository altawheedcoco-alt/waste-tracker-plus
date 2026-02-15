
-- Prevent partnerships between organizations of the same type
CREATE OR REPLACE FUNCTION public.enforce_different_org_types_partnership()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  requester_type text;
  partner_type text;
BEGIN
  SELECT organization_type INTO requester_type
  FROM public.organizations WHERE id = NEW.requester_org_id;

  SELECT organization_type INTO partner_type
  FROM public.organizations WHERE id = NEW.partner_org_id;

  IF requester_type IS NOT NULL AND partner_type IS NOT NULL AND requester_type = partner_type THEN
    RAISE EXCEPTION 'لا يمكن إنشاء شراكة بين جهتين من نفس النوع (%). يجب أن تكون الجهات من أنواع مختلفة.', requester_type;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_enforce_different_org_types ON public.verified_partnerships;
CREATE TRIGGER trg_enforce_different_org_types
  BEFORE INSERT OR UPDATE ON public.verified_partnerships
  FOR EACH ROW
  EXECUTE FUNCTION public.enforce_different_org_types_partnership();
