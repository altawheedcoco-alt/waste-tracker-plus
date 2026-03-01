
-- ═══════════════════════════════════════════════════════════
-- WMIS: Waste Management Information System - Database Schema
-- ═══════════════════════════════════════════════════════════

-- 1) Add licensed waste types to organizations
ALTER TABLE public.organizations 
ADD COLUMN IF NOT EXISTS licensed_waste_types TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS licensed_waste_categories TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS license_scope_notes TEXT,
ADD COLUMN IF NOT EXISTS wmis_enrolled BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS wmis_enrolled_at TIMESTAMPTZ;

-- 2) WMIS Events table for IoT/AI/Sensor events
CREATE TABLE public.wmis_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  shipment_id UUID REFERENCES public.shipments(id) ON DELETE SET NULL,
  
  -- Event classification
  event_source TEXT NOT NULL DEFAULT 'manual', -- 'iot_sensor', 'ai_vision', 'gps_tracker', 'weighbridge', 'manual', 'system'
  event_type TEXT NOT NULL, -- 'temperature_alert', 'weight_mismatch', 'route_deviation', 'spill_detected', 'unauthorized_dump', 'container_opened', 'geofence_breach', etc.
  event_severity TEXT NOT NULL DEFAULT 'info', -- 'info', 'warning', 'critical', 'emergency'
  
  -- Event data
  event_title TEXT NOT NULL,
  event_description TEXT,
  event_data JSONB DEFAULT '{}', -- Sensor readings, AI results, etc.
  
  -- Location
  location_lat DOUBLE PRECISION,
  location_lng DOUBLE PRECISION,
  location_name TEXT,
  
  -- Device info
  device_id TEXT,
  device_type TEXT, -- 'gps_tracker', 'temperature_sensor', 'weight_sensor', 'camera', 'mobile_app'
  device_name TEXT,
  
  -- Actor
  actor_id UUID,
  actor_name TEXT,
  
  -- Response tracking
  acknowledged BOOLEAN DEFAULT false,
  acknowledged_by UUID,
  acknowledged_at TIMESTAMPTZ,
  resolution_notes TEXT,
  resolved BOOLEAN DEFAULT false,
  resolved_at TIMESTAMPTZ,
  
  -- Notifications
  notify_generator BOOLEAN DEFAULT false,
  notify_transporter BOOLEAN DEFAULT false,
  notify_recycler BOOLEAN DEFAULT false,
  notify_consultant BOOLEAN DEFAULT false,
  notifications_sent BOOLEAN DEFAULT false,
  
  -- Media
  evidence_urls TEXT[] DEFAULT '{}',
  
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes
CREATE INDEX idx_wmis_events_org ON public.wmis_events(organization_id);
CREATE INDEX idx_wmis_events_shipment ON public.wmis_events(shipment_id);
CREATE INDEX idx_wmis_events_severity ON public.wmis_events(event_severity);
CREATE INDEX idx_wmis_events_source ON public.wmis_events(event_source);
CREATE INDEX idx_wmis_events_created ON public.wmis_events(created_at DESC);
CREATE INDEX idx_wmis_events_unresolved ON public.wmis_events(resolved) WHERE resolved = false;

-- 3) License compliance log - records every license check
CREATE TABLE public.wmis_license_checks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  shipment_id UUID REFERENCES public.shipments(id) ON DELETE SET NULL,
  
  check_type TEXT NOT NULL, -- 'waste_type_match', 'license_validity', 'hazardous_certification', 'transport_permit'
  check_result TEXT NOT NULL, -- 'pass', 'warning', 'fail', 'override'
  
  waste_type_requested TEXT,
  licensed_waste_types TEXT[] DEFAULT '{}',
  
  details JSONB DEFAULT '{}',
  override_by UUID, -- If someone overrode the check
  override_reason TEXT,
  
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_wmis_license_checks_org ON public.wmis_license_checks(organization_id);
CREATE INDEX idx_wmis_license_checks_shipment ON public.wmis_license_checks(shipment_id);

-- 4) Consultant approval requirements table
CREATE TABLE public.wmis_consultant_gates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  
  -- What requires consultant approval
  gate_type TEXT NOT NULL, -- 'shipment_completion', 'hazardous_transport', 'disposal_certificate', 'weight_discrepancy'
  is_mandatory BOOLEAN DEFAULT true,
  
  -- Thresholds
  auto_approve_below_kg NUMERIC, -- Auto-approve if weight below this
  requires_site_visit BOOLEAN DEFAULT false,
  max_approval_hours INTEGER DEFAULT 48, -- Escalation after X hours
  
  -- Assigned consultant
  default_consultant_id UUID,
  
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  
  UNIQUE(organization_id, gate_type)
);

CREATE INDEX idx_wmis_consultant_gates_org ON public.wmis_consultant_gates(organization_id);

-- 5) RLS Policies
ALTER TABLE public.wmis_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wmis_license_checks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wmis_consultant_gates ENABLE ROW LEVEL SECURITY;

-- WMIS Events: org members can view/insert
CREATE POLICY "wmis_events_select" ON public.wmis_events FOR SELECT TO authenticated
USING (
  organization_id IN (
    SELECT uo.organization_id FROM public.user_organizations uo WHERE uo.user_id = auth.uid()
  )
  OR
  shipment_id IN (
    SELECT s.id FROM public.shipments s 
    WHERE s.generator_id IN (SELECT uo.organization_id FROM public.user_organizations uo WHERE uo.user_id = auth.uid())
    OR s.transporter_id IN (SELECT uo.organization_id FROM public.user_organizations uo WHERE uo.user_id = auth.uid())
    OR s.recycler_id IN (SELECT uo.organization_id FROM public.user_organizations uo WHERE uo.user_id = auth.uid())
  )
);

CREATE POLICY "wmis_events_insert" ON public.wmis_events FOR INSERT TO authenticated
WITH CHECK (
  organization_id IN (
    SELECT uo.organization_id FROM public.user_organizations uo WHERE uo.user_id = auth.uid()
  )
);

CREATE POLICY "wmis_events_update" ON public.wmis_events FOR UPDATE TO authenticated
USING (
  organization_id IN (
    SELECT uo.organization_id FROM public.user_organizations uo WHERE uo.user_id = auth.uid()
  )
);

-- License checks: org members can view, system inserts
CREATE POLICY "wmis_license_checks_select" ON public.wmis_license_checks FOR SELECT TO authenticated
USING (
  organization_id IN (
    SELECT uo.organization_id FROM public.user_organizations uo WHERE uo.user_id = auth.uid()
  )
);

CREATE POLICY "wmis_license_checks_insert" ON public.wmis_license_checks FOR INSERT TO authenticated
WITH CHECK (
  organization_id IN (
    SELECT uo.organization_id FROM public.user_organizations uo WHERE uo.user_id = auth.uid()
  )
);

-- Consultant gates: org members can manage
CREATE POLICY "wmis_consultant_gates_select" ON public.wmis_consultant_gates FOR SELECT TO authenticated
USING (
  organization_id IN (
    SELECT uo.organization_id FROM public.user_organizations uo WHERE uo.user_id = auth.uid()
  )
);

CREATE POLICY "wmis_consultant_gates_all" ON public.wmis_consultant_gates FOR ALL TO authenticated
USING (
  organization_id IN (
    SELECT uo.organization_id FROM public.user_organizations uo WHERE uo.user_id = auth.uid()
  )
);

-- 6) Function to validate waste type against license
CREATE OR REPLACE FUNCTION public.check_waste_license_compliance(
  p_organization_id UUID,
  p_waste_type TEXT,
  p_shipment_id UUID DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_org RECORD;
  v_result JSONB;
  v_is_compliant BOOLEAN;
BEGIN
  SELECT licensed_waste_types, hazardous_certified, license_expiry_date, is_active, is_suspended, name
  INTO v_org
  FROM organizations
  WHERE id = p_organization_id;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('result', 'fail', 'reason', 'organization_not_found');
  END IF;

  -- Check if org is active
  IF v_org.is_active = false OR v_org.is_suspended = true THEN
    RETURN jsonb_build_object('result', 'fail', 'reason', 'organization_inactive', 'org_name', v_org.name);
  END IF;

  -- Check license expiry
  IF v_org.license_expiry_date IS NOT NULL AND v_org.license_expiry_date < CURRENT_DATE THEN
    RETURN jsonb_build_object('result', 'fail', 'reason', 'license_expired', 'expiry_date', v_org.license_expiry_date);
  END IF;

  -- Check waste type against licensed types
  IF v_org.licensed_waste_types IS NOT NULL AND array_length(v_org.licensed_waste_types, 1) > 0 THEN
    v_is_compliant := p_waste_type = ANY(v_org.licensed_waste_types);
    
    IF NOT v_is_compliant THEN
      -- Log the failed check
      INSERT INTO wmis_license_checks (organization_id, shipment_id, check_type, check_result, waste_type_requested, licensed_waste_types, details)
      VALUES (p_organization_id, p_shipment_id, 'waste_type_match', 'fail', p_waste_type, v_org.licensed_waste_types,
        jsonb_build_object('message', 'نوع المخلف غير مشمول في الترخيص', 'org_name', v_org.name));
      
      RETURN jsonb_build_object(
        'result', 'fail',
        'reason', 'waste_type_not_licensed',
        'requested', p_waste_type,
        'licensed', v_org.licensed_waste_types,
        'org_name', v_org.name
      );
    END IF;
  END IF;

  -- Check hazardous certification for hazardous waste
  IF p_waste_type IN ('hazardous', 'medical', 'chemical', 'electronic', 'radioactive') 
     AND (v_org.hazardous_certified IS NULL OR v_org.hazardous_certified = false) THEN
    INSERT INTO wmis_license_checks (organization_id, shipment_id, check_type, check_result, waste_type_requested, details)
    VALUES (p_organization_id, p_shipment_id, 'hazardous_certification', 'fail', p_waste_type,
      jsonb_build_object('message', 'الجهة غير معتمدة للتعامل مع المخلفات الخطرة'));
    
    RETURN jsonb_build_object('result', 'fail', 'reason', 'not_hazardous_certified', 'org_name', v_org.name);
  END IF;

  -- All checks passed
  INSERT INTO wmis_license_checks (organization_id, shipment_id, check_type, check_result, waste_type_requested, licensed_waste_types)
  VALUES (p_organization_id, p_shipment_id, 'waste_type_match', 'pass', p_waste_type, v_org.licensed_waste_types);

  RETURN jsonb_build_object('result', 'pass', 'org_name', v_org.name);
END;
$$;

-- 7) Trigger to send notifications on critical WMIS events
CREATE OR REPLACE FUNCTION public.wmis_event_notification_trigger()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_shipment RECORD;
  v_org_members UUID[];
  v_member UUID;
  v_title TEXT;
BEGIN
  -- Only for warning/critical/emergency events with a shipment
  IF NEW.event_severity NOT IN ('warning', 'critical', 'emergency') OR NEW.shipment_id IS NULL THEN
    RETURN NEW;
  END IF;

  SELECT generator_id, transporter_id, recycler_id, shipment_number INTO v_shipment
  FROM shipments WHERE id = NEW.shipment_id;

  v_title := CASE NEW.event_severity 
    WHEN 'emergency' THEN '🚨 تنبيه طوارئ: '
    WHEN 'critical' THEN '⚠️ تنبيه حرج: '
    ELSE '📋 تنبيه: '
  END || NEW.event_title;

  -- Notify generator if flagged
  IF NEW.notify_generator AND v_shipment.generator_id IS NOT NULL THEN
    SELECT array_agg(uo.user_id) INTO v_org_members
    FROM user_organizations uo WHERE uo.organization_id = v_shipment.generator_id;
    
    IF v_org_members IS NOT NULL THEN
      FOREACH v_member IN ARRAY v_org_members LOOP
        INSERT INTO notifications (user_id, title, message, type, reference_id, reference_type)
        VALUES (v_member, v_title, COALESCE(NEW.event_description, ''), 'system', NEW.shipment_id::text, 'wmis_event');
      END LOOP;
    END IF;
  END IF;

  -- Notify transporter if flagged
  IF NEW.notify_transporter AND v_shipment.transporter_id IS NOT NULL THEN
    SELECT array_agg(uo.user_id) INTO v_org_members
    FROM user_organizations uo WHERE uo.organization_id = v_shipment.transporter_id;
    
    IF v_org_members IS NOT NULL THEN
      FOREACH v_member IN ARRAY v_org_members LOOP
        INSERT INTO notifications (user_id, title, message, type, reference_id, reference_type)
        VALUES (v_member, v_title, COALESCE(NEW.event_description, ''), 'system', NEW.shipment_id::text, 'wmis_event');
      END LOOP;
    END IF;
  END IF;

  -- Notify recycler if flagged
  IF NEW.notify_recycler AND v_shipment.recycler_id IS NOT NULL THEN
    SELECT array_agg(uo.user_id) INTO v_org_members
    FROM user_organizations uo WHERE uo.organization_id = v_shipment.recycler_id;
    
    IF v_org_members IS NOT NULL THEN
      FOREACH v_member IN ARRAY v_org_members LOOP
        INSERT INTO notifications (user_id, title, message, type, reference_id, reference_type)
        VALUES (v_member, v_title, COALESCE(NEW.event_description, ''), 'system', NEW.shipment_id::text, 'wmis_event');
      END LOOP;
    END IF;
  END IF;

  -- Mark notifications as sent
  NEW.notifications_sent := true;
  RETURN NEW;
END;
$$;

CREATE TRIGGER wmis_event_notify
BEFORE INSERT ON public.wmis_events
FOR EACH ROW
EXECUTE FUNCTION public.wmis_event_notification_trigger();

-- 8) Enable realtime for wmis_events
ALTER PUBLICATION supabase_realtime ADD TABLE public.wmis_events;
