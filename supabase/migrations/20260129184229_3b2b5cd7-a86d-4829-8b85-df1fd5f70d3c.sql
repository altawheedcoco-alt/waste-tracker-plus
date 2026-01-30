-- Create operational plans table for generators
CREATE TABLE public.operational_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  created_by UUID REFERENCES public.profiles(id),
  
  -- Service details
  service_description TEXT NOT NULL,
  service_scope TEXT NOT NULL,
  
  -- Waste types (JSON array of waste type details)
  waste_types JSONB NOT NULL DEFAULT '[]',
  
  -- Service frequency
  service_frequency TEXT NOT NULL,
  frequency_details TEXT,
  
  -- Quantity estimates
  quantity_estimates JSONB DEFAULT '[]',
  
  -- Schedule
  schedule_details JSONB DEFAULT '{}',
  
  -- Status for approval workflow
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('draft', 'pending', 'approved', 'rejected', 'revision_requested')),
  priority TEXT DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
  
  -- Admin review
  admin_notes TEXT,
  reviewed_by UUID REFERENCES public.profiles(id),
  reviewed_at TIMESTAMPTZ,
  
  -- Validity period
  valid_from DATE,
  valid_to DATE,
  
  -- Metadata
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.operational_plans ENABLE ROW LEVEL SECURITY;

-- RLS policies
-- Users can view their organization's plans
CREATE POLICY "Users can view their organization operational plans"
ON public.operational_plans
FOR SELECT
TO authenticated
USING (
  organization_id = public.get_user_org_id_safe(auth.uid())
  OR public.has_role(auth.uid(), 'admin')
);

-- Users can create plans for their organization (generators only)
CREATE POLICY "Generators can create operational plans"
ON public.operational_plans
FOR INSERT
TO authenticated
WITH CHECK (
  organization_id = public.get_user_org_id_safe(auth.uid())
  AND EXISTS (
    SELECT 1 FROM organizations o 
    WHERE o.id = organization_id 
    AND o.organization_type = 'generator'
  )
);

-- Users can update their own draft plans
CREATE POLICY "Users can update their draft plans"
ON public.operational_plans
FOR UPDATE
TO authenticated
USING (
  (organization_id = public.get_user_org_id_safe(auth.uid()) AND status = 'draft')
  OR public.has_role(auth.uid(), 'admin')
);

-- Only admins can delete plans
CREATE POLICY "Admins can delete plans"
ON public.operational_plans
FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Trigger for updated_at
CREATE TRIGGER update_operational_plans_updated_at
  BEFORE UPDATE ON public.operational_plans
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Function to notify admins of new plan
CREATE OR REPLACE FUNCTION public.notify_admins_new_plan()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_admin_user_ids UUID[];
  v_user_id UUID;
  v_org_name TEXT;
BEGIN
  -- Only notify on pending status
  IF NEW.status != 'pending' THEN
    RETURN NEW;
  END IF;

  -- Get organization name
  SELECT name INTO v_org_name FROM organizations WHERE id = NEW.organization_id;

  -- Get all admin user IDs
  SELECT ARRAY_AGG(ur.user_id) INTO v_admin_user_ids
  FROM user_roles ur
  WHERE ur.role = 'admin';

  -- Send notifications to all admins
  IF v_admin_user_ids IS NOT NULL THEN
    FOREACH v_user_id IN ARRAY v_admin_user_ids
    LOOP
      INSERT INTO notifications (user_id, title, message, type)
      VALUES (
        v_user_id, 
        'خطة تشغيلية جديدة من ' || COALESCE(v_org_name, 'جهة مولدة'),
        'تم تقديم خطة تشغيلية جديدة تحتاج للمراجعة والموافقة',
        'operational_plan'
      );
    END LOOP;
  END IF;

  RETURN NEW;
END;
$$;

-- Trigger to notify admins
CREATE TRIGGER notify_on_new_plan
  AFTER INSERT OR UPDATE ON public.operational_plans
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_admins_new_plan();