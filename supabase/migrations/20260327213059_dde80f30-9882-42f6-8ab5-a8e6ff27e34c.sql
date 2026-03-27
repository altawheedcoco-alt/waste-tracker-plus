
CREATE OR REPLACE FUNCTION public.can_view_reel(reel_org_id UUID, reel_user_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  viewer_org_id UUID;
  viewer_org_type TEXT;
  reel_org_type TEXT;
BEGIN
  -- Owner always sees own reels
  IF auth.uid() = reel_user_id THEN RETURN TRUE; END IF;

  -- Get viewer org
  SELECT uo.organization_id INTO viewer_org_id
  FROM user_organizations uo
  WHERE uo.user_id = auth.uid() AND uo.is_active = true
  LIMIT 1;

  -- Same org = always visible
  IF viewer_org_id IS NOT NULL AND viewer_org_id = reel_org_id THEN RETURN TRUE; END IF;

  -- Get org types
  IF viewer_org_id IS NOT NULL THEN
    SELECT organization_type INTO viewer_org_type FROM organizations WHERE id = viewer_org_id;
  END IF;
  IF reel_org_id IS NOT NULL THEN
    SELECT organization_type INTO reel_org_type FROM organizations WHERE id = reel_org_id;
  END IF;

  -- RULE: Viewer is generator → only sees generators + linked partners
  IF viewer_org_type = 'generator' THEN
    -- See other generators
    IF reel_org_type = 'generator' THEN RETURN TRUE; END IF;
    -- See linked partners
    IF reel_org_id IS NOT NULL THEN
      IF EXISTS (
        SELECT 1 FROM verified_partnerships
        WHERE status = 'active'
          AND ((requester_org_id = viewer_org_id AND partner_org_id = reel_org_id)
            OR (requester_org_id = reel_org_id AND partner_org_id = viewer_org_id))
      ) THEN RETURN TRUE; END IF;
    END IF;
    RETURN FALSE;
  END IF;

  -- RULE: All non-generator orgs see ALL reels (from any org type)
  IF viewer_org_id IS NOT NULL AND viewer_org_type != 'generator' THEN
    RETURN TRUE;
  END IF;

  -- RULE: Independent drivers (no org) see all non-generator reels + other drivers
  IF viewer_org_id IS NULL THEN
    -- Other independent driver reels
    IF reel_org_id IS NULL THEN RETURN TRUE; END IF;
    -- Non-generator org reels
    IF reel_org_type IS NOT NULL AND reel_org_type != 'generator' THEN RETURN TRUE; END IF;
    -- Linked org reels
    IF reel_org_id IS NOT NULL AND EXISTS (
      SELECT 1 FROM user_organizations
      WHERE user_id = auth.uid() AND organization_id = reel_org_id AND is_active = true
    ) THEN RETURN TRUE; END IF;
    RETURN FALSE;
  END IF;

  RETURN FALSE;
END;
$$;
