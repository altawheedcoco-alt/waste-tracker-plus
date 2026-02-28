
-- ═══ Consulting Office Members ═══
-- Links a consulting office (environmental_consultants with entity_type='office') 
-- to individual consultants who work under that office
CREATE TABLE public.consulting_office_members (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  office_id UUID NOT NULL REFERENCES public.environmental_consultants(id) ON DELETE CASCADE,
  consultant_id UUID NOT NULL REFERENCES public.environmental_consultants(id) ON DELETE CASCADE,
  role_in_office TEXT NOT NULL DEFAULT 'member',
  is_active BOOLEAN NOT NULL DEFAULT true,
  joined_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  invited_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  notes TEXT,
  UNIQUE(office_id, consultant_id)
);

ALTER TABLE public.consulting_office_members ENABLE ROW LEVEL SECURITY;

-- Office owner can manage members
CREATE POLICY "Office owner manages members"
ON public.consulting_office_members FOR ALL TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.environmental_consultants ec
    WHERE ec.id = consulting_office_members.office_id
    AND ec.user_id = auth.uid()
    AND ec.entity_type = 'office'
  )
);

-- Members can view their own membership
CREATE POLICY "Members view own membership"
ON public.consulting_office_members FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.environmental_consultants ec
    WHERE ec.id = consulting_office_members.consultant_id
    AND ec.user_id = auth.uid()
  )
);

-- ═══ Add office_id to consultant_organization_assignments ═══
-- When an office is assigned, this tracks which office the assignment came through
ALTER TABLE public.consultant_organization_assignments 
ADD COLUMN IF NOT EXISTS office_id UUID REFERENCES public.environmental_consultants(id) ON DELETE SET NULL;

-- ═══ Security definer function: check if user is consultant member of an office ═══
CREATE OR REPLACE FUNCTION public.is_office_member(_user_id UUID, _office_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 
    FROM public.consulting_office_members com
    JOIN public.environmental_consultants ec ON ec.id = com.consultant_id
    WHERE com.office_id = _office_id
    AND ec.user_id = _user_id
    AND com.is_active = true
  )
$$;

-- ═══ Function: When office is assigned to org, propagate to members ═══
CREATE OR REPLACE FUNCTION public.propagate_office_assignment()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Check if the assigned consultant is an office
  IF EXISTS (
    SELECT 1 FROM public.environmental_consultants 
    WHERE id = NEW.consultant_id AND entity_type = 'office'
  ) THEN
    -- For each active member of the office, create an assignment (if not exists)
    INSERT INTO public.consultant_organization_assignments (
      consultant_id, organization_id, role_title, assigned_by, is_active, office_id,
      can_view_shipments, can_view_partners, can_view_vehicles, can_view_drivers,
      can_view_documents, can_view_compliance, can_view_waste_records, can_view_incidents,
      can_sign_certificates, can_sign_permits, can_sign_shipments, can_sign_reports
    )
    SELECT 
      com.consultant_id, NEW.organization_id, 'عضو مكتب ' || NEW.role_title, NEW.assigned_by, true, NEW.consultant_id,
      NEW.can_view_shipments, NEW.can_view_partners, NEW.can_view_vehicles, NEW.can_view_drivers,
      NEW.can_view_documents, NEW.can_view_compliance, NEW.can_view_waste_records, NEW.can_view_incidents,
      NEW.can_sign_certificates, NEW.can_sign_permits, NEW.can_sign_shipments, NEW.can_sign_reports
    FROM public.consulting_office_members com
    WHERE com.office_id = NEW.consultant_id AND com.is_active = true
    ON CONFLICT (consultant_id, organization_id) DO UPDATE SET
      is_active = true,
      office_id = NEW.consultant_id,
      can_view_shipments = NEW.can_view_shipments,
      can_view_partners = NEW.can_view_partners,
      can_view_vehicles = NEW.can_view_vehicles,
      can_view_drivers = NEW.can_view_drivers,
      can_view_documents = NEW.can_view_documents,
      can_view_compliance = NEW.can_view_compliance,
      can_view_waste_records = NEW.can_view_waste_records,
      can_view_incidents = NEW.can_view_incidents,
      can_sign_certificates = NEW.can_sign_certificates,
      can_sign_permits = NEW.can_sign_permits,
      can_sign_shipments = NEW.can_sign_shipments,
      can_sign_reports = NEW.can_sign_reports;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trigger_propagate_office_assignment
AFTER INSERT ON public.consultant_organization_assignments
FOR EACH ROW
EXECUTE FUNCTION public.propagate_office_assignment();

-- ═══ Function: When new member joins office, give them all office assignments ═══
CREATE OR REPLACE FUNCTION public.propagate_member_to_assignments()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Copy all office assignments to the new member
  INSERT INTO public.consultant_organization_assignments (
    consultant_id, organization_id, role_title, assigned_by, is_active, office_id,
    can_view_shipments, can_view_partners, can_view_vehicles, can_view_drivers,
    can_view_documents, can_view_compliance, can_view_waste_records, can_view_incidents,
    can_sign_certificates, can_sign_permits, can_sign_shipments, can_sign_reports
  )
  SELECT 
    NEW.consultant_id, coa.organization_id, 'عضو مكتب ' || COALESCE(coa.role_title, ''), coa.assigned_by, true, coa.consultant_id,
    coa.can_view_shipments, coa.can_view_partners, coa.can_view_vehicles, coa.can_view_drivers,
    coa.can_view_documents, coa.can_view_compliance, coa.can_view_waste_records, coa.can_view_incidents,
    coa.can_sign_certificates, coa.can_sign_permits, coa.can_sign_shipments, coa.can_sign_reports
  FROM public.consultant_organization_assignments coa
  WHERE coa.consultant_id = NEW.office_id AND coa.is_active = true
  ON CONFLICT (consultant_id, organization_id) DO UPDATE SET
    is_active = true,
    office_id = NEW.office_id;
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER trigger_propagate_member_to_assignments
AFTER INSERT ON public.consulting_office_members
FOR EACH ROW
EXECUTE FUNCTION public.propagate_member_to_assignments();

-- ═══ Add unique constraint for consultant_organization_assignments ═══
-- Needed for ON CONFLICT in the triggers above
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'unique_consultant_org_assignment'
  ) THEN
    ALTER TABLE public.consultant_organization_assignments 
    ADD CONSTRAINT unique_consultant_org_assignment UNIQUE (consultant_id, organization_id);
  END IF;
END $$;
