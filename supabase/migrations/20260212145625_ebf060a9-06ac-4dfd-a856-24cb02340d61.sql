
-- Seed existing organizations that don't have departments yet
DO $$
DECLARE
  org RECORD;
BEGIN
  FOR org IN SELECT id, organization_type::text as org_type FROM public.organizations LOOP
    IF NOT EXISTS (SELECT 1 FROM public.organization_departments WHERE organization_id = org.id) THEN
      PERFORM public.seed_org_structure(org.id, org.org_type);
    END IF;
  END LOOP;
END;
$$;
