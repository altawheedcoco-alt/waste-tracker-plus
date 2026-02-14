
-- فهارس B-tree
CREATE INDEX IF NOT EXISTS idx_contracts_number ON contracts(contract_number);
CREATE INDEX IF NOT EXISTS idx_award_letters_number ON award_letters(letter_number);
CREATE INDEX IF NOT EXISTS idx_receipts_number ON shipment_receipts(receipt_number);

-- إعادة بناء دالة البحث الشامل (11 فئة)
CREATE OR REPLACE FUNCTION public.global_search(p_query TEXT, p_org_id UUID, p_limit INT DEFAULT 5)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result JSON;
  search_term TEXT;
BEGIN
  search_term := '%' || LOWER(TRIM(p_query)) || '%';

  SELECT json_build_object(
    'shipments', COALESCE((
      SELECT json_agg(row_to_json(s))
      FROM (
        SELECT sh.id, sh.shipment_number, sh.status::text as status, sh.waste_type::text as waste_type,
          sh.quantity, sh.unit, sh.created_at,
          COALESCE(org_from.name, ep_from.name, '') as from_name,
          COALESCE(org_to.name, ep_to.name, '') as to_name, 'shipment' as result_type
        FROM shipments sh
        LEFT JOIN organizations org_from ON sh.from_organization_id = org_from.id
        LEFT JOIN organizations org_to ON sh.to_organization_id = org_to.id
        LEFT JOIN external_partners ep_from ON sh.from_external_partner_id = ep_from.id
        LEFT JOIN external_partners ep_to ON sh.to_external_partner_id = ep_to.id
        WHERE (sh.from_organization_id = p_org_id OR sh.to_organization_id = p_org_id
               OR sh.generator_id = p_org_id OR sh.transporter_id = p_org_id OR sh.recycler_id = p_org_id)
          AND (LOWER(sh.shipment_number) LIKE search_term
            OR LOWER(COALESCE(sh.waste_type::text, '')) LIKE search_term
            OR LOWER(COALESCE(sh.status::text, '')) LIKE search_term
            OR LOWER(COALESCE(org_from.name, '')) LIKE search_term
            OR LOWER(COALESCE(org_to.name, '')) LIKE search_term)
        ORDER BY sh.created_at DESC LIMIT p_limit
      ) s
    ), '[]'::json),

    'organizations', COALESCE((
      SELECT json_agg(row_to_json(o))
      FROM (
        SELECT org.id, org.name, org.organization_type::text as organization_type, org.city, org.is_active, 'organization' as result_type
        FROM organizations org
        INNER JOIN organization_partners op ON 
          (op.organization_id = p_org_id AND op.partner_organization_id = org.id)
          OR (op.partner_organization_id = p_org_id AND op.organization_id = org.id)
        WHERE op.status = 'active'
          AND (LOWER(org.name) LIKE search_term OR LOWER(COALESCE(org.city, '')) LIKE search_term)
        ORDER BY org.name LIMIT p_limit
      ) o
    ), '[]'::json),

    'external_partners', COALESCE((
      SELECT json_agg(row_to_json(ep))
      FROM (
        SELECT e.id, e.name, e.partner_type, e.city, e.contact_person, e.phone, 'external_partner' as result_type
        FROM external_partners e
        WHERE e.organization_id = p_org_id
          AND (LOWER(e.name) LIKE search_term OR LOWER(COALESCE(e.city, '')) LIKE search_term
            OR LOWER(COALESCE(e.contact_person, '')) LIKE search_term OR LOWER(COALESCE(e.phone, '')) LIKE search_term)
        ORDER BY e.name LIMIT p_limit
      ) ep
    ), '[]'::json),

    'drivers', COALESCE((
      SELECT json_agg(row_to_json(d))
      FROM (
        SELECT dr.id, dr.full_name, dr.phone, dr.license_number, dr.status, dr.vehicle_type, dr.plate_number, 'driver' as result_type
        FROM drivers dr
        WHERE dr.organization_id = p_org_id
          AND (LOWER(dr.full_name) LIKE search_term OR LOWER(COALESCE(dr.phone, '')) LIKE search_term
            OR LOWER(COALESCE(dr.plate_number, '')) LIKE search_term)
        ORDER BY dr.full_name LIMIT p_limit
      ) d
    ), '[]'::json),

    'employees', COALESCE((
      SELECT json_agg(row_to_json(emp))
      FROM (
        SELECT p.id, p.full_name, p.email, p.phone, COALESCE(p.employee_type, p.role) as employee_type, p.is_active, 'employee' as result_type
        FROM profiles p
        WHERE p.organization_id = p_org_id
          AND (LOWER(COALESCE(p.full_name, '')) LIKE search_term OR LOWER(COALESCE(p.email, '')) LIKE search_term
            OR LOWER(COALESCE(p.phone, '')) LIKE search_term)
        ORDER BY p.full_name LIMIT p_limit
      ) emp
    ), '[]'::json),

    'invoices', COALESCE((
      SELECT json_agg(row_to_json(inv))
      FROM (
        SELECT i.id, i.invoice_number, i.status::text as status, i.total_amount, i.issue_date, i.due_date,
          COALESCE(org_c.name, ep_c.name, '') as client_name, 'invoice' as result_type
        FROM invoices i
        LEFT JOIN organizations org_c ON i.client_organization_id = org_c.id
        LEFT JOIN external_partners ep_c ON i.external_partner_id = ep_c.id
        WHERE i.organization_id = p_org_id
          AND (LOWER(i.invoice_number) LIKE search_term OR LOWER(COALESCE(org_c.name, '')) LIKE search_term
            OR LOWER(COALESCE(ep_c.name, '')) LIKE search_term)
        ORDER BY i.created_at DESC LIMIT p_limit
      ) inv
    ), '[]'::json),

    'contracts', COALESCE((
      SELECT json_agg(row_to_json(c))
      FROM (
        SELECT ct.id, ct.contract_number, ct.title, ct.status, ct.contract_type, ct.start_date, ct.end_date, ct.value,
          COALESCE(ct.partner_name, org_p.name, '') as partner_name, 'contract' as result_type
        FROM contracts ct
        LEFT JOIN organizations org_p ON ct.partner_organization_id = org_p.id
        WHERE ct.organization_id = p_org_id
          AND (LOWER(ct.contract_number) LIKE search_term OR LOWER(COALESCE(ct.title, '')) LIKE search_term
            OR LOWER(COALESCE(ct.partner_name, '')) LIKE search_term OR LOWER(COALESCE(org_p.name, '')) LIKE search_term)
        ORDER BY ct.created_at DESC LIMIT p_limit
      ) c
    ), '[]'::json),

    'deposits', COALESCE((
      SELECT json_agg(row_to_json(dep))
      FROM (
        SELECT d.id, d.amount, d.transfer_method, d.deposit_date, d.reference_number, d.depositor_name,
          COALESCE(org_d.name, ep_d.name, '') as partner_name, 'deposit' as result_type
        FROM deposits d
        LEFT JOIN organizations org_d ON d.partner_organization_id = org_d.id
        LEFT JOIN external_partners ep_d ON d.external_partner_id = ep_d.id
        WHERE d.organization_id = p_org_id
          AND (LOWER(COALESCE(d.reference_number, '')) LIKE search_term
            OR LOWER(COALESCE(d.transfer_method, '')) LIKE search_term
            OR LOWER(COALESCE(d.depositor_name, '')) LIKE search_term
            OR LOWER(COALESCE(org_d.name, '')) LIKE search_term
            OR LOWER(COALESCE(ep_d.name, '')) LIKE search_term)
        ORDER BY d.created_at DESC LIMIT p_limit
      ) dep
    ), '[]'::json),

    'award_letters', COALESCE((
      SELECT json_agg(row_to_json(al))
      FROM (
        SELECT a.id, a.letter_number, a.title, a.status, a.start_date, a.end_date,
          COALESCE(org_a.name, ep_a.name, '') as partner_name, 'award_letter' as result_type
        FROM award_letters a
        LEFT JOIN organizations org_a ON a.partner_organization_id = org_a.id
        LEFT JOIN external_partners ep_a ON a.external_partner_id = ep_a.id
        WHERE a.organization_id = p_org_id
          AND (LOWER(a.letter_number) LIKE search_term OR LOWER(COALESCE(a.title, '')) LIKE search_term
            OR LOWER(COALESCE(org_a.name, '')) LIKE search_term)
        ORDER BY a.created_at DESC LIMIT p_limit
      ) al
    ), '[]'::json),

    'declarations', COALESCE((
      SELECT json_agg(row_to_json(dcl))
      FROM (
        SELECT dd.id, dd.declaration_type, dd.status, dd.created_at,
          COALESCE(dd.shipment_number, '') as shipment_number,
          COALESCE(dd.waste_type, '') as waste_type,
          COALESCE(dd.generator_name, '') as generator_name,
          'declaration' as result_type
        FROM delivery_declarations dd
        WHERE dd.declared_by_organization_id = p_org_id
          AND (LOWER(COALESCE(dd.shipment_number, '')) LIKE search_term
            OR LOWER(COALESCE(dd.declaration_type, '')) LIKE search_term
            OR LOWER(COALESCE(dd.waste_type, '')) LIKE search_term
            OR LOWER(COALESCE(dd.generator_name, '')) LIKE search_term
            OR LOWER(COALESCE(dd.transporter_name, '')) LIKE search_term)
        ORDER BY dd.created_at DESC LIMIT p_limit
      ) dcl
    ), '[]'::json),

    'receipts', COALESCE((
      SELECT json_agg(row_to_json(rct))
      FROM (
        SELECT sr.id, sr.receipt_number, sr.status, sr.created_at,
          COALESCE(sh_r.shipment_number, '') as shipment_number, 'receipt' as result_type
        FROM shipment_receipts sr
        LEFT JOIN shipments sh_r ON sr.shipment_id = sh_r.id
        WHERE (sr.generator_id = p_org_id OR sr.transporter_id = p_org_id)
          AND (LOWER(COALESCE(sr.receipt_number, '')) LIKE search_term
            OR LOWER(COALESCE(sr.status, '')) LIKE search_term
            OR LOWER(COALESCE(sh_r.shipment_number, '')) LIKE search_term)
        ORDER BY sr.created_at DESC LIMIT p_limit
      ) rct
    ), '[]'::json)
  ) INTO result;

  RETURN result;
END;
$$;
