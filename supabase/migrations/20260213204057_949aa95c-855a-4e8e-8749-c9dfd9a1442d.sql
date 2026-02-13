
-- Global Search function: searches across multiple tables with Full-Text Search
-- Returns categorized results with relevance ranking

CREATE OR REPLACE FUNCTION public.global_search(
  p_query TEXT,
  p_org_id UUID,
  p_limit INT DEFAULT 5
)
RETURNS JSON
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result JSON;
  search_term TEXT;
  ts_query_val tsquery;
BEGIN
  -- Prepare search term for ILIKE
  search_term := '%' || LOWER(TRIM(p_query)) || '%';
  
  -- Build tsquery for FTS (handle Arabic + English)
  BEGIN
    ts_query_val := plainto_tsquery('simple', TRIM(p_query));
  EXCEPTION WHEN OTHERS THEN
    ts_query_val := NULL;
  END;

  SELECT json_build_object(
    'shipments', COALESCE((
      SELECT json_agg(row_to_json(s))
      FROM (
        SELECT 
          sh.id,
          sh.shipment_number,
          sh.status,
          sh.waste_type,
          sh.quantity,
          sh.unit,
          sh.created_at,
          COALESCE(org_from.name, ep_from.name, '') as from_name,
          COALESCE(org_to.name, ep_to.name, '') as to_name,
          'shipment' as result_type
        FROM shipments sh
        LEFT JOIN organizations org_from ON sh.from_organization_id = org_from.id
        LEFT JOIN organizations org_to ON sh.to_organization_id = org_to.id
        LEFT JOIN external_partners ep_from ON sh.from_external_partner_id = ep_from.id
        LEFT JOIN external_partners ep_to ON sh.to_external_partner_id = ep_to.id
        WHERE (sh.from_organization_id = p_org_id OR sh.to_organization_id = p_org_id)
          AND (
            LOWER(sh.shipment_number) LIKE search_term
            OR LOWER(COALESCE(sh.waste_type, '')) LIKE search_term
            OR LOWER(COALESCE(sh.status, '')) LIKE search_term
            OR LOWER(COALESCE(org_from.name, '')) LIKE search_term
            OR LOWER(COALESCE(org_to.name, '')) LIKE search_term
            OR LOWER(COALESCE(ep_from.name, '')) LIKE search_term
            OR LOWER(COALESCE(ep_to.name, '')) LIKE search_term
          )
        ORDER BY sh.created_at DESC
        LIMIT p_limit
      ) s
    ), '[]'::json),

    'organizations', COALESCE((
      SELECT json_agg(row_to_json(o))
      FROM (
        SELECT 
          org.id,
          org.name,
          org.organization_type,
          org.city,
          org.is_active,
          'organization' as result_type
        FROM organizations org
        INNER JOIN organization_partners op ON 
          (op.organization_id = p_org_id AND op.partner_organization_id = org.id)
          OR (op.partner_organization_id = p_org_id AND op.organization_id = org.id)
        WHERE op.status = 'active'
          AND (
            LOWER(org.name) LIKE search_term
            OR LOWER(COALESCE(org.city, '')) LIKE search_term
            OR LOWER(COALESCE(org.organization_type, '')) LIKE search_term
            OR LOWER(COALESCE(org.partner_code, '')) LIKE search_term
          )
        ORDER BY org.name
        LIMIT p_limit
      ) o
    ), '[]'::json),

    'external_partners', COALESCE((
      SELECT json_agg(row_to_json(ep))
      FROM (
        SELECT 
          e.id,
          e.name,
          e.partner_type,
          e.city,
          e.contact_person,
          e.phone,
          'external_partner' as result_type
        FROM external_partners e
        WHERE e.organization_id = p_org_id
          AND (
            LOWER(e.name) LIKE search_term
            OR LOWER(COALESCE(e.city, '')) LIKE search_term
            OR LOWER(COALESCE(e.contact_person, '')) LIKE search_term
            OR LOWER(COALESCE(e.phone, '')) LIKE search_term
            OR LOWER(COALESCE(e.partner_type, '')) LIKE search_term
          )
        ORDER BY e.name
        LIMIT p_limit
      ) ep
    ), '[]'::json),

    'drivers', COALESCE((
      SELECT json_agg(row_to_json(d))
      FROM (
        SELECT 
          dr.id,
          dr.full_name,
          dr.phone,
          dr.license_number,
          dr.status,
          dr.vehicle_type,
          dr.plate_number,
          'driver' as result_type
        FROM drivers dr
        WHERE dr.organization_id = p_org_id
          AND (
            LOWER(dr.full_name) LIKE search_term
            OR LOWER(COALESCE(dr.phone, '')) LIKE search_term
            OR LOWER(COALESCE(dr.license_number, '')) LIKE search_term
            OR LOWER(COALESCE(dr.plate_number, '')) LIKE search_term
            OR LOWER(COALESCE(dr.vehicle_type, '')) LIKE search_term
          )
        ORDER BY dr.full_name
        LIMIT p_limit
      ) d
    ), '[]'::json),

    'employees', COALESCE((
      SELECT json_agg(row_to_json(emp))
      FROM (
        SELECT 
          p.id,
          p.full_name,
          p.email,
          p.phone,
          p.employee_type,
          p.is_active,
          'employee' as result_type
        FROM profiles p
        WHERE p.organization_id = p_org_id
          AND (
            LOWER(COALESCE(p.full_name, '')) LIKE search_term
            OR LOWER(COALESCE(p.email, '')) LIKE search_term
            OR LOWER(COALESCE(p.phone, '')) LIKE search_term
          )
        ORDER BY p.full_name
        LIMIT p_limit
      ) emp
    ), '[]'::json),

    'invoices', COALESCE((
      SELECT json_agg(row_to_json(inv))
      FROM (
        SELECT 
          i.id,
          i.invoice_number,
          i.status,
          i.total_amount,
          i.issue_date,
          i.due_date,
          COALESCE(org_c.name, ep_c.name, '') as client_name,
          'invoice' as result_type
        FROM invoices i
        LEFT JOIN organizations org_c ON i.client_organization_id = org_c.id
        LEFT JOIN external_partners ep_c ON i.external_client_id = ep_c.id
        WHERE i.organization_id = p_org_id
          AND (
            LOWER(COALESCE(i.invoice_number, '')) LIKE search_term
            OR LOWER(COALESCE(i.status, '')) LIKE search_term
            OR LOWER(COALESCE(org_c.name, '')) LIKE search_term
            OR LOWER(COALESCE(ep_c.name, '')) LIKE search_term
          )
        ORDER BY i.created_at DESC
        LIMIT p_limit
      ) inv
    ), '[]'::json)

  ) INTO result;

  RETURN result;
END;
$$;
