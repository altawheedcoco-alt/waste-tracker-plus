
-- Add onboarding status columns to organizations
ALTER TABLE public.organizations 
  ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS terms_accepted BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS identity_verified BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS documents_submitted BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS onboarding_completed_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS activation_blocked_reason TEXT;

-- Create a function that blocks shipment creation for unverified organizations
CREATE OR REPLACE FUNCTION public.enforce_org_activation()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  org_verified BOOLEAN;
  org_active BOOLEAN;
  org_suspended BOOLEAN;
  org_onboarding BOOLEAN;
BEGIN
  -- Check the organization that owns this shipment
  SELECT is_verified, is_active, COALESCE(is_suspended, false), COALESCE(onboarding_completed, false)
  INTO org_verified, org_active, org_suspended, org_onboarding
  FROM public.organizations
  WHERE id = NEW.organization_id;

  IF org_suspended = true THEN
    RAISE EXCEPTION 'هذه المنظمة معلّقة ولا يمكنها إنشاء شحنات جديدة';
  END IF;

  IF org_verified = false THEN
    RAISE EXCEPTION 'لم يتم التحقق من هذه المنظمة بعد. يرجى استكمال إجراءات التسجيل والتحقق أولاً';
  END IF;

  IF org_active = false THEN
    RAISE EXCEPTION 'هذه المنظمة غير مفعّلة. يرجى التواصل مع مدير النظام للتفعيل';
  END IF;

  IF org_onboarding = false THEN
    RAISE EXCEPTION 'لم يتم استكمال إجراءات التسجيل (الشروط والأحكام، التحقق من الهوية، الوثائق). يرجى استكمال كافة المتطلبات أولاً';
  END IF;

  RETURN NEW;
END;
$$;

-- Apply trigger on shipments table
DROP TRIGGER IF EXISTS check_org_activation_on_shipment ON public.shipments;
CREATE TRIGGER check_org_activation_on_shipment
  BEFORE INSERT ON public.shipments
  FOR EACH ROW
  EXECUTE FUNCTION public.enforce_org_activation();

-- Create a function that blocks invoice creation for unverified organizations  
CREATE OR REPLACE FUNCTION public.enforce_org_activation_invoices()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  org_verified BOOLEAN;
  org_active BOOLEAN;
BEGIN
  SELECT is_verified, is_active
  INTO org_verified, org_active
  FROM public.organizations
  WHERE id = NEW.organization_id;

  IF org_verified = false OR org_active = false THEN
    RAISE EXCEPTION 'لا يمكن إصدار فواتير لمنظمة غير مفعّلة أو غير موثقة';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS check_org_activation_on_invoice ON public.invoices;
CREATE TRIGGER check_org_activation_on_invoice
  BEFORE INSERT ON public.invoices
  FOR EACH ROW
  EXECUTE FUNCTION public.enforce_org_activation_invoices();

-- Function to check and update onboarding_completed automatically
CREATE OR REPLACE FUNCTION public.check_onboarding_completion()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Auto-set onboarding_completed when all conditions are met
  IF NEW.terms_accepted = true 
     AND NEW.identity_verified = true 
     AND NEW.documents_submitted = true 
     AND NEW.is_verified = true THEN
    NEW.onboarding_completed := true;
    NEW.onboarding_completed_at := COALESCE(NEW.onboarding_completed_at, now());
  END IF;
  
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS auto_check_onboarding ON public.organizations;
CREATE TRIGGER auto_check_onboarding
  BEFORE UPDATE ON public.organizations
  FOR EACH ROW
  EXECUTE FUNCTION public.check_onboarding_completion();

-- Update existing verified+active organizations to have onboarding_completed = true
UPDATE public.organizations 
SET onboarding_completed = true, 
    terms_accepted = true, 
    identity_verified = true, 
    documents_submitted = true,
    onboarding_completed_at = now()
WHERE is_verified = true AND is_active = true;
