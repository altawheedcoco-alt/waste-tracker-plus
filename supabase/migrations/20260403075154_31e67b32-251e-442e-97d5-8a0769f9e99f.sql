
-- 1. Create data_claim_requests table
CREATE TABLE public.data_claim_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  requesting_org_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  owner_org_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  external_partner_id uuid NOT NULL REFERENCES public.external_partners(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'completed')),
  requested_by uuid REFERENCES auth.users(id),
  approved_by uuid REFERENCES auth.users(id),
  approved_at timestamptz,
  rejection_reason text,
  tables_migrated text[] DEFAULT '{}',
  records_count integer DEFAULT 0,
  completed_at timestamptz,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(requesting_org_id, external_partner_id)
);

ALTER TABLE public.data_claim_requests ENABLE ROW LEVEL SECURITY;

-- RLS: both parties can view their requests
CREATE POLICY "Parties can view their claim requests"
  ON public.data_claim_requests FOR SELECT TO authenticated
  USING (
    requesting_org_id IN (SELECT organization_id FROM profiles WHERE user_id = auth.uid())
    OR owner_org_id IN (SELECT organization_id FROM profiles WHERE user_id = auth.uid())
  );

-- RLS: requesting org can create
CREATE POLICY "Requesting org can create claims"
  ON public.data_claim_requests FOR INSERT TO authenticated
  WITH CHECK (
    requesting_org_id IN (SELECT organization_id FROM profiles WHERE user_id = auth.uid())
  );

-- RLS: owner org can update (approve/reject)
CREATE POLICY "Owner org can update claims"
  ON public.data_claim_requests FOR UPDATE TO authenticated
  USING (
    owner_org_id IN (SELECT organization_id FROM profiles WHERE user_id = auth.uid())
  );

-- 2. Atomic migration function
CREATE OR REPLACE FUNCTION public.execute_data_claim(p_claim_id uuid, p_approver_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_claim record;
  v_ext_id uuid;
  v_req_org uuid;
  v_total integer := 0;
  v_migrated text[] := '{}';
  v_count integer;
BEGIN
  -- Lock the claim row
  SELECT * INTO v_claim FROM data_claim_requests WHERE id = p_claim_id FOR UPDATE;
  
  IF v_claim IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Claim not found');
  END IF;
  
  IF v_claim.status != 'pending' THEN
    RETURN jsonb_build_object('success', false, 'error', 'Claim already processed');
  END IF;

  v_ext_id := v_claim.external_partner_id;
  v_req_org := v_claim.requesting_org_id;

  -- Mark as approved first
  UPDATE data_claim_requests 
  SET status = 'approved', approved_by = p_approver_id, approved_at = now()
  WHERE id = p_claim_id;

  -- Migrate accounting_ledger
  UPDATE accounting_ledger 
  SET partner_organization_id = v_req_org, external_partner_id = NULL
  WHERE external_partner_id = v_ext_id AND organization_id = v_claim.owner_org_id;
  GET DIAGNOSTICS v_count = ROW_COUNT;
  IF v_count > 0 THEN v_total := v_total + v_count; v_migrated := array_append(v_migrated, 'accounting_ledger'); END IF;

  -- Migrate account_periods
  UPDATE account_periods 
  SET partner_organization_id = v_req_org, external_partner_id = NULL
  WHERE external_partner_id = v_ext_id AND organization_id = v_claim.owner_org_id;
  GET DIAGNOSTICS v_count = ROW_COUNT;
  IF v_count > 0 THEN v_total := v_total + v_count; v_migrated := array_append(v_migrated, 'account_periods'); END IF;

  -- Migrate deposits
  UPDATE deposits 
  SET partner_organization_id = v_req_org, external_partner_id = NULL
  WHERE external_partner_id = v_ext_id AND organization_id = v_claim.owner_org_id;
  GET DIAGNOSTICS v_count = ROW_COUNT;
  IF v_count > 0 THEN v_total := v_total + v_count; v_migrated := array_append(v_migrated, 'deposits'); END IF;

  -- Migrate entity_documents
  UPDATE entity_documents 
  SET partner_organization_id = v_req_org, external_partner_id = NULL
  WHERE external_partner_id = v_ext_id AND organization_id = v_claim.owner_org_id;
  GET DIAGNOSTICS v_count = ROW_COUNT;
  IF v_count > 0 THEN v_total := v_total + v_count; v_migrated := array_append(v_migrated, 'entity_documents'); END IF;

  -- Migrate bulk_weight_entries
  UPDATE bulk_weight_entries 
  SET external_partner_id = NULL
  WHERE external_partner_id = v_ext_id;
  GET DIAGNOSTICS v_count = ROW_COUNT;
  IF v_count > 0 THEN v_total := v_total + v_count; v_migrated := array_append(v_migrated, 'bulk_weight_entries'); END IF;

  -- Migrate award_letters
  UPDATE award_letters 
  SET external_partner_id = NULL
  WHERE external_partner_id = v_ext_id;
  GET DIAGNOSTICS v_count = ROW_COUNT;
  IF v_count > 0 THEN v_total := v_total + v_count; v_migrated := array_append(v_migrated, 'award_letters'); END IF;

  -- Migrate partner_waste_types
  UPDATE partner_waste_types 
  SET partner_organization_id = v_req_org, external_partner_id = NULL
  WHERE external_partner_id = v_ext_id AND organization_id = v_claim.owner_org_id;
  GET DIAGNOSTICS v_count = ROW_COUNT;
  IF v_count > 0 THEN v_total := v_total + v_count; v_migrated := array_append(v_migrated, 'partner_waste_types'); END IF;

  -- Migrate partner_risk_scores
  UPDATE partner_risk_scores 
  SET external_partner_id = NULL
  WHERE external_partner_id = v_ext_id;
  GET DIAGNOSTICS v_count = ROW_COUNT;
  IF v_count > 0 THEN v_total := v_total + v_count; v_migrated := array_append(v_migrated, 'partner_risk_scores'); END IF;

  -- Migrate factory_map_labels
  UPDATE factory_map_labels 
  SET external_partner_id = NULL
  WHERE external_partner_id = v_ext_id;
  GET DIAGNOSTICS v_count = ROW_COUNT;
  IF v_count > 0 THEN v_total := v_total + v_count; v_migrated := array_append(v_migrated, 'factory_map_labels'); END IF;

  -- Migrate portal_access_tokens
  UPDATE portal_access_tokens 
  SET external_partner_id = NULL
  WHERE external_partner_id = v_ext_id;
  GET DIAGNOSTICS v_count = ROW_COUNT;
  IF v_count > 0 THEN v_total := v_total + v_count; v_migrated := array_append(v_migrated, 'portal_access_tokens'); END IF;

  -- Migrate employee_partner_access
  UPDATE employee_partner_access 
  SET partner_organization_id = v_req_org, external_partner_id = NULL
  WHERE external_partner_id = v_ext_id;
  GET DIAGNOSTICS v_count = ROW_COUNT;
  IF v_count > 0 THEN v_total := v_total + v_count; v_migrated := array_append(v_migrated, 'employee_partner_access'); END IF;

  -- Migrate work_order_recipients
  UPDATE work_order_recipients 
  SET recipient_external_partner_id = NULL
  WHERE recipient_external_partner_id = v_ext_id;
  GET DIAGNOSTICS v_count = ROW_COUNT;
  IF v_count > 0 THEN v_total := v_total + v_count; v_migrated := array_append(v_migrated, 'work_order_recipients'); END IF;

  -- Migrate organization_deposit_links
  UPDATE organization_deposit_links 
  SET preset_external_partner_id = NULL
  WHERE preset_external_partner_id = v_ext_id;
  GET DIAGNOSTICS v_count = ROW_COUNT;
  IF v_count > 0 THEN v_total := v_total + v_count; v_migrated := array_append(v_migrated, 'organization_deposit_links'); END IF;

  -- Mark external partner as claimed
  UPDATE external_partners 
  SET is_active = false, notes = COALESCE(notes, '') || ' [Claimed by org: ' || v_req_org::text || ' at ' || now()::text || ']'
  WHERE id = v_ext_id;

  -- Mark claim as completed
  UPDATE data_claim_requests 
  SET status = 'completed', records_count = v_total, tables_migrated = v_migrated, completed_at = now(), updated_at = now()
  WHERE id = p_claim_id;

  RETURN jsonb_build_object(
    'success', true, 
    'records_migrated', v_total, 
    'tables', v_migrated
  );
END;
$$;

-- Index for fast lookups
CREATE INDEX idx_data_claim_requests_status ON data_claim_requests(status);
CREATE INDEX idx_data_claim_requests_requesting_org ON data_claim_requests(requesting_org_id);
CREATE INDEX idx_data_claim_requests_owner_org ON data_claim_requests(owner_org_id);
