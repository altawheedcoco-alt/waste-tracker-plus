
-- Fix enforce_org_activation to use generator_id for shipments table
CREATE OR REPLACE FUNCTION public.enforce_org_activation()
RETURNS TRIGGER AS $$
DECLARE
  org_verified BOOLEAN;
  org_active BOOLEAN;
  org_suspended BOOLEAN;
  org_onboarding BOOLEAN;
  check_org_id UUID;
BEGIN
  -- Determine org ID based on table
  IF TG_TABLE_NAME = 'shipments' THEN
    check_org_id := NEW.generator_id;
  ELSE
    check_org_id := NEW.organization_id;
  END IF;

  IF check_org_id IS NULL THEN
    RETURN NEW;
  END IF;

  SELECT is_verified, is_active, COALESCE(is_suspended, false), COALESCE(onboarding_completed, false)
  INTO org_verified, org_active, org_suspended, org_onboarding
  FROM public.organizations
  WHERE id = check_org_id;

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
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;
