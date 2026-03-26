
-- ============================================================
-- إشعارات الجهات الرقابية والامتثال
-- ============================================================

-- 1) المخالفات التنظيمية (regulatory_violations)
CREATE OR REPLACE FUNCTION public.notify_regulatory_violation()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    -- إشعار المنظمة المخالفة
    IF NEW.organization_id IS NOT NULL THEN
      INSERT INTO public.notifications(user_id,title,message,type,priority,metadata)
        SELECT om.user_id, '🚨 مخالفة تنظيمية',
          COALESCE(NEW.violation_type, 'مخالفة') || ' - ' || COALESCE(NEW.severity, ''),
          'regulatory_violation', 'urgent',
          jsonb_build_object('violation_id', NEW.id, 'type', NEW.violation_type, 'severity', NEW.severity)
        FROM public.organization_members om
        WHERE om.organization_id = NEW.organization_id AND om.status = 'active';
    END IF;
  ELSIF TG_OP = 'UPDATE' AND OLD.status IS DISTINCT FROM NEW.status THEN
    IF NEW.organization_id IS NOT NULL THEN
      INSERT INTO public.notifications(user_id,title,message,type,priority,metadata)
        SELECT om.user_id, '🚨 تحديث مخالفة',
          'المخالفة → ' || NEW.status,
          'violation_status', 'high',
          jsonb_build_object('violation_id', NEW.id, 'status', NEW.status)
        FROM public.organization_members om
        WHERE om.organization_id = NEW.organization_id AND om.status = 'active';
    END IF;
  END IF;
  RETURN COALESCE(NEW, OLD);
END;$$;
DROP TRIGGER IF EXISTS trg_notify_reg_violation ON public.regulatory_violations;
CREATE TRIGGER trg_notify_reg_violation AFTER INSERT OR UPDATE ON public.regulatory_violations
  FOR EACH ROW EXECUTE FUNCTION public.notify_regulatory_violation();

-- 2) الغرامات التنظيمية (regulatory_penalties)
CREATE OR REPLACE FUNCTION public.notify_regulatory_penalty()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    IF NEW.organization_id IS NOT NULL THEN
      INSERT INTO public.notifications(user_id,title,message,type,priority,metadata)
        SELECT om.user_id, '💸 غرامة تنظيمية',
          'غرامة بقيمة ' || COALESCE(NEW.amount::text, '0') || ' ج.م',
          'regulatory_penalty', 'urgent',
          jsonb_build_object('penalty_id', NEW.id, 'amount', NEW.amount)
        FROM public.organization_members om
        WHERE om.organization_id = NEW.organization_id AND om.status = 'active';
    END IF;
  ELSIF TG_OP = 'UPDATE' AND OLD.status IS DISTINCT FROM NEW.status THEN
    IF NEW.organization_id IS NOT NULL THEN
      INSERT INTO public.notifications(user_id,title,message,type,priority,metadata)
        SELECT om.user_id, '💸 تحديث غرامة',
          'الغرامة → ' || NEW.status,
          'penalty_status', 'high',
          jsonb_build_object('penalty_id', NEW.id, 'status', NEW.status)
        FROM public.organization_members om
        WHERE om.organization_id = NEW.organization_id AND om.status = 'active';
    END IF;
  END IF;
  RETURN COALESCE(NEW, OLD);
END;$$;
DROP TRIGGER IF EXISTS trg_notify_reg_penalty ON public.regulatory_penalties;
CREATE TRIGGER trg_notify_reg_penalty AFTER INSERT OR UPDATE ON public.regulatory_penalties
  FOR EACH ROW EXECUTE FUNCTION public.notify_regulatory_penalty();

-- 3) التفتيش الميداني (field_inspections)
CREATE OR REPLACE FUNCTION public.notify_field_inspection()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    IF NEW.organization_id IS NOT NULL THEN
      INSERT INTO public.notifications(user_id,title,message,type,priority,metadata)
        SELECT om.user_id, '🔍 تفتيش ميداني جديد',
          'تم جدولة تفتيش ميداني',
          'field_inspection', 'high',
          jsonb_build_object('inspection_id', NEW.id)
        FROM public.organization_members om
        WHERE om.organization_id = NEW.organization_id AND om.status = 'active';
    END IF;
  ELSIF TG_OP = 'UPDATE' AND OLD.status IS DISTINCT FROM NEW.status THEN
    IF NEW.organization_id IS NOT NULL THEN
      INSERT INTO public.notifications(user_id,title,message,type,priority,metadata)
        SELECT om.user_id,
          CASE NEW.status WHEN 'passed' THEN '✅ اجتاز التفتيش' WHEN 'failed' THEN '❌ فشل التفتيش' ELSE '🔍 تحديث تفتيش' END,
          'التفتيش الميداني → ' || NEW.status,
          'field_inspection_result',
          CASE NEW.status WHEN 'failed' THEN 'urgent' ELSE 'normal' END,
          jsonb_build_object('inspection_id', NEW.id, 'status', NEW.status)
        FROM public.organization_members om
        WHERE om.organization_id = NEW.organization_id AND om.status = 'active';
    END IF;
  END IF;
  RETURN COALESCE(NEW, OLD);
END;$$;
DROP TRIGGER IF EXISTS trg_notify_field_inspection ON public.field_inspections;
CREATE TRIGGER trg_notify_field_inspection AFTER INSERT OR UPDATE ON public.field_inspections
  FOR EACH ROW EXECUTE FUNCTION public.notify_field_inspection();

-- 4) فحوصات السلامة المهنية (ohs_inspections)
CREATE OR REPLACE FUNCTION public.notify_ohs_inspection()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    IF NEW.organization_id IS NOT NULL THEN
      INSERT INTO public.notifications(user_id,title,message,type,priority,metadata)
        SELECT om.user_id, '🦺 فحص سلامة مهنية',
          'تم إجراء فحص سلامة جديد',
          'ohs_inspection', 'high',
          jsonb_build_object('inspection_id', NEW.id)
        FROM public.organization_members om
        WHERE om.organization_id = NEW.organization_id AND om.status = 'active'
          AND om.role IN ('admin','manager','safety');
    END IF;
  END IF;
  RETURN NEW;
END;$$;
DROP TRIGGER IF EXISTS trg_notify_ohs ON public.ohs_inspections;
CREATE TRIGGER trg_notify_ohs AFTER INSERT ON public.ohs_inspections
  FOR EACH ROW EXECUTE FUNCTION public.notify_ohs_inspection();

-- 5) تدقيق الحوكمة (governance_audit_trail)
CREATE OR REPLACE FUNCTION public.notify_governance_audit()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.action_type IN ('policy_violation','unauthorized_access','data_breach','privilege_escalation') THEN
    INSERT INTO public.notifications(user_id,title,message,type,priority,metadata)
      SELECT uid, '🛡️ تنبيه حوكمة',
        NEW.action_type || ': ' || COALESCE(NEW.description, ''),
        'governance_alert', 'urgent',
        jsonb_build_object('audit_id', NEW.id, 'action_type', NEW.action_type)
      FROM public.get_sovereign_admin_ids() uid;
  END IF;
  RETURN NEW;
END;$$;
DROP TRIGGER IF EXISTS trg_notify_governance ON public.governance_audit_trail;
CREATE TRIGGER trg_notify_governance AFTER INSERT ON public.governance_audit_trail
  FOR EACH ROW EXECUTE FUNCTION public.notify_governance_audit();

-- 6) التصديقات التنظيمية (regulatory_attestations)
CREATE OR REPLACE FUNCTION public.notify_reg_attestation()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    IF NEW.organization_id IS NOT NULL THEN
      INSERT INTO public.notifications(user_id,title,message,type,metadata)
        SELECT om.user_id, '📜 تصديق تنظيمي جديد',
          'مطلوب تصديق تنظيمي',
          'reg_attestation',
          jsonb_build_object('attestation_id', NEW.id)
        FROM public.organization_members om
        WHERE om.organization_id = NEW.organization_id AND om.status = 'active'
          AND om.role IN ('admin','manager','compliance');
    END IF;
  ELSIF TG_OP = 'UPDATE' AND OLD.status IS DISTINCT FROM NEW.status THEN
    IF NEW.organization_id IS NOT NULL THEN
      INSERT INTO public.notifications(user_id,title,message,type,metadata)
        SELECT om.user_id, '📜 تحديث تصديق',
          'التصديق → ' || NEW.status,
          'attestation_status',
          jsonb_build_object('attestation_id', NEW.id, 'status', NEW.status)
        FROM public.organization_members om
        WHERE om.organization_id = NEW.organization_id AND om.status = 'active';
    END IF;
  END IF;
  RETURN COALESCE(NEW, OLD);
END;$$;
DROP TRIGGER IF EXISTS trg_notify_attestation ON public.regulatory_attestations;
CREATE TRIGGER trg_notify_attestation AFTER INSERT OR UPDATE ON public.regulatory_attestations
  FOR EACH ROW EXECUTE FUNCTION public.notify_reg_attestation();

-- 7) امتثال المركبات (vehicle_compliance)
CREATE OR REPLACE FUNCTION public.notify_vehicle_compliance()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF TG_OP = 'UPDATE' AND OLD.compliance_status IS DISTINCT FROM NEW.compliance_status THEN
    IF NEW.organization_id IS NOT NULL THEN
      INSERT INTO public.notifications(user_id,title,message,type,priority,metadata)
        SELECT om.user_id,
          CASE NEW.compliance_status 
            WHEN 'non_compliant' THEN '🚫 مركبة غير ممتثلة'
            WHEN 'expired' THEN '⏰ انتهاء امتثال مركبة'
            ELSE '🚛 تحديث امتثال مركبة'
          END,
          COALESCE(NEW.plate_number, '') || ' → ' || NEW.compliance_status,
          'vehicle_compliance',
          CASE NEW.compliance_status WHEN 'non_compliant' THEN 'urgent' WHEN 'expired' THEN 'high' ELSE 'normal' END,
          jsonb_build_object('compliance_id', NEW.id, 'status', NEW.compliance_status)
        FROM public.organization_members om
        WHERE om.organization_id = NEW.organization_id AND om.status = 'active';
    END IF;
  END IF;
  RETURN COALESCE(NEW, OLD);
END;$$;
DROP TRIGGER IF EXISTS trg_notify_vehicle_compliance ON public.vehicle_compliance;
CREATE TRIGGER trg_notify_vehicle_compliance AFTER UPDATE ON public.vehicle_compliance
  FOR EACH ROW EXECUTE FUNCTION public.notify_vehicle_compliance();

-- 8) سجلات التفتيش (inspection_logs)
CREATE OR REPLACE FUNCTION public.notify_inspection_log()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    IF NEW.organization_id IS NOT NULL THEN
      INSERT INTO public.notifications(user_id,title,message,type,metadata)
        SELECT om.user_id, '📋 سجل تفتيش جديد',
          'تم تسجيل نتيجة تفتيش',
          'inspection_log',
          jsonb_build_object('log_id', NEW.id)
        FROM public.organization_members om
        WHERE om.organization_id = NEW.organization_id AND om.status = 'active'
          AND om.role IN ('admin','manager','inspector');
    END IF;
  END IF;
  RETURN NEW;
END;$$;
DROP TRIGGER IF EXISTS trg_notify_inspection_log ON public.inspection_logs;
CREATE TRIGGER trg_notify_inspection_log AFTER INSERT ON public.inspection_logs
  FOR EACH ROW EXECUTE FUNCTION public.notify_inspection_log();

-- 9) التدقيق الأمني (security_audits)
CREATE OR REPLACE FUNCTION public.notify_security_audit()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.notifications(user_id,title,message,type,priority,metadata)
      SELECT uid, '🔒 تدقيق أمني جديد',
        COALESCE(NEW.audit_type, 'تدقيق أمني'),
        'security_audit', 'high',
        jsonb_build_object('audit_id', NEW.id)
      FROM public.get_sovereign_admin_ids() uid;
  END IF;
  RETURN NEW;
END;$$;
DROP TRIGGER IF EXISTS trg_notify_security_audit ON public.security_audits;
CREATE TRIGGER trg_notify_security_audit AFTER INSERT ON public.security_audits
  FOR EACH ROW EXECUTE FUNCTION public.notify_security_audit();

-- 10) طواقم الكنس (sweeping_crews)
CREATE OR REPLACE FUNCTION public.notify_sweeping_crew()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    IF NEW.organization_id IS NOT NULL THEN
      INSERT INTO public.notifications(user_id,title,message,type,metadata)
        SELECT om.user_id, '🧹 طاقم كنس جديد',
          'تم إنشاء طاقم: ' || COALESCE(NEW.crew_name, ''),
          'sweeping_crew_created',
          jsonb_build_object('crew_id', NEW.id)
        FROM public.organization_members om
        WHERE om.organization_id = NEW.organization_id AND om.status = 'active'
          AND om.role IN ('admin','manager');
    END IF;
  ELSIF TG_OP = 'UPDATE' AND OLD.status IS DISTINCT FROM NEW.status THEN
    IF NEW.organization_id IS NOT NULL THEN
      INSERT INTO public.notifications(user_id,title,message,type,metadata)
        SELECT om.user_id, '🧹 تحديث طاقم',
          COALESCE(NEW.crew_name, '') || ' → ' || NEW.status,
          'sweeping_crew_status',
          jsonb_build_object('crew_id', NEW.id, 'status', NEW.status)
        FROM public.organization_members om
        WHERE om.organization_id = NEW.organization_id AND om.status = 'active';
    END IF;
  END IF;
  RETURN COALESCE(NEW, OLD);
END;$$;
DROP TRIGGER IF EXISTS trg_notify_sweeping_crew ON public.sweeping_crews;
CREATE TRIGGER trg_notify_sweeping_crew AFTER INSERT OR UPDATE ON public.sweeping_crews
  FOR EACH ROW EXECUTE FUNCTION public.notify_sweeping_crew();

-- 11) التقارير الحكومية (government_reports)
CREATE OR REPLACE FUNCTION public.notify_government_report()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    IF NEW.organization_id IS NOT NULL THEN
      INSERT INTO public.notifications(user_id,title,message,type,priority,metadata)
        SELECT om.user_id, '🏛️ تقرير حكومي جديد',
          'تم إنشاء تقرير حكومي: ' || COALESCE(NEW.report_type, ''),
          'gov_report_created', 'high',
          jsonb_build_object('report_id', NEW.id, 'type', NEW.report_type)
        FROM public.organization_members om
        WHERE om.organization_id = NEW.organization_id AND om.status = 'active';
    END IF;
  ELSIF TG_OP = 'UPDATE' AND OLD.status IS DISTINCT FROM NEW.status THEN
    IF NEW.organization_id IS NOT NULL THEN
      INSERT INTO public.notifications(user_id,title,message,type,metadata)
        SELECT om.user_id, '🏛️ تحديث تقرير حكومي',
          'التقرير → ' || NEW.status,
          'gov_report_status',
          jsonb_build_object('report_id', NEW.id, 'status', NEW.status)
        FROM public.organization_members om
        WHERE om.organization_id = NEW.organization_id AND om.status = 'active';
    END IF;
  END IF;
  RETURN COALESCE(NEW, OLD);
END;$$;
DROP TRIGGER IF EXISTS trg_notify_gov_report ON public.government_reports;
CREATE TRIGGER trg_notify_gov_report AFTER INSERT OR UPDATE ON public.government_reports
  FOR EACH ROW EXECUTE FUNCTION public.notify_government_report();

-- 12) العقود البلدية (municipal_contracts)
CREATE OR REPLACE FUNCTION public.notify_municipal_contract()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    IF NEW.organization_id IS NOT NULL THEN
      INSERT INTO public.notifications(user_id,title,message,type,priority,metadata)
        SELECT om.user_id, '🏗️ عقد بلدي جديد',
          'تم إنشاء عقد بلدي: ' || COALESCE(NEW.contract_name, ''),
          'municipal_contract', 'high',
          jsonb_build_object('contract_id', NEW.id)
        FROM public.organization_members om
        WHERE om.organization_id = NEW.organization_id AND om.status = 'active';
    END IF;
  ELSIF TG_OP = 'UPDATE' AND OLD.status IS DISTINCT FROM NEW.status THEN
    IF NEW.organization_id IS NOT NULL THEN
      INSERT INTO public.notifications(user_id,title,message,type,metadata)
        SELECT om.user_id, '🏗️ تحديث عقد بلدي',
          COALESCE(NEW.contract_name, '') || ' → ' || NEW.status,
          'municipal_contract_status',
          jsonb_build_object('contract_id', NEW.id, 'status', NEW.status)
        FROM public.organization_members om
        WHERE om.organization_id = NEW.organization_id AND om.status = 'active';
    END IF;
  END IF;
  RETURN COALESCE(NEW, OLD);
END;$$;
DROP TRIGGER IF EXISTS trg_notify_municipal_contract ON public.municipal_contracts;
CREATE TRIGGER trg_notify_municipal_contract AFTER INSERT OR UPDATE ON public.municipal_contracts
  FOR EACH ROW EXECUTE FUNCTION public.notify_municipal_contract();
