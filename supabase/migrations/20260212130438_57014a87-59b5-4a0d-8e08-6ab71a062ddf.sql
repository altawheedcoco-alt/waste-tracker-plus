
-- DB function for transporter stats to avoid client-side calculation
CREATE OR REPLACE FUNCTION public.get_transporter_stats(p_org_id UUID)
RETURNS JSON
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result JSON;
BEGIN
  SELECT json_build_object(
    'total', COUNT(*),
    'active', COUNT(*) FILTER (WHERE status IN ('new', 'approved', 'in_transit')),
    'delivered', COUNT(*) FILTER (WHERE status = 'delivered'),
    'confirmed', COUNT(*) FILTER (WHERE status = 'confirmed'),
    'new_count', COUNT(*) FILTER (WHERE status = 'new'),
    'in_transit_count', COUNT(*) FILTER (WHERE status = 'in_transit')
  ) INTO result
  FROM shipments
  WHERE transporter_id = p_org_id;
  
  RETURN result;
END;
$$;

-- DB function for transporter KPIs
CREATE OR REPLACE FUNCTION public.get_transporter_kpis(p_org_id UUID)
RETURNS JSON
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result JSON;
  v_total INT;
  v_completed INT;
  v_on_time INT;
  v_with_dates INT;
  v_avg_days NUMERIC;
  v_overdue INT;
BEGIN
  SELECT COUNT(*) INTO v_total FROM shipments WHERE transporter_id = p_org_id;
  
  SELECT COUNT(*) INTO v_completed FROM shipments 
  WHERE transporter_id = p_org_id AND status IN ('confirmed', 'delivered');
  
  SELECT COUNT(*), COUNT(*) FILTER (WHERE delivered_at <= expected_delivery_date)
  INTO v_with_dates, v_on_time
  FROM shipments 
  WHERE transporter_id = p_org_id 
    AND status IN ('confirmed', 'delivered')
    AND delivered_at IS NOT NULL 
    AND expected_delivery_date IS NOT NULL;
  
  SELECT COALESCE(ROUND(AVG(EXTRACT(EPOCH FROM (delivered_at::timestamp - created_at::timestamp)) / 86400)::numeric, 1), 0)
  INTO v_avg_days
  FROM shipments
  WHERE transporter_id = p_org_id 
    AND status IN ('confirmed', 'delivered')
    AND delivered_at IS NOT NULL;
  
  SELECT COUNT(*) INTO v_overdue
  FROM shipments
  WHERE transporter_id = p_org_id
    AND status NOT IN ('confirmed', 'delivered', 'cancelled')
    AND expected_delivery_date IS NOT NULL
    AND expected_delivery_date < NOW();
  
  SELECT json_build_object(
    'onTimeRate', CASE WHEN v_with_dates > 0 THEN ROUND((v_on_time::numeric / v_with_dates) * 100) ELSE 100 END,
    'completionRate', CASE WHEN v_total > 0 THEN ROUND((v_completed::numeric / v_total) * 100) ELSE 0 END,
    'avgDeliveryDays', v_avg_days,
    'overdueShipments', v_overdue
  ) INTO result;
  
  RETURN result;
END;
$$;

-- Paginated shipments function
CREATE OR REPLACE FUNCTION public.get_transporter_shipments_paginated(
  p_org_id UUID,
  p_status TEXT DEFAULT NULL,
  p_search TEXT DEFAULT NULL,
  p_page INT DEFAULT 1,
  p_page_size INT DEFAULT 20
)
RETURNS JSON
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_offset INT;
  v_total BIGINT;
  v_shipments JSON;
BEGIN
  v_offset := (p_page - 1) * p_page_size;
  
  -- Get total count
  SELECT COUNT(*) INTO v_total
  FROM shipments s
  WHERE s.transporter_id = p_org_id
    AND (p_status IS NULL OR s.status = p_status)
    AND (p_search IS NULL OR p_search = '' OR 
      s.shipment_number ILIKE '%' || p_search || '%' OR
      s.waste_type ILIKE '%' || p_search || '%' OR
      s.pickup_address ILIKE '%' || p_search || '%' OR
      s.delivery_address ILIKE '%' || p_search || '%'
    );
  
  SELECT json_build_object(
    'total', v_total,
    'page', p_page,
    'page_size', p_page_size,
    'total_pages', CEIL(v_total::numeric / p_page_size)
  ) INTO v_shipments;
  
  RETURN v_shipments;
END;
$$;

-- Index for pagination performance
CREATE INDEX IF NOT EXISTS idx_shipments_transporter_status_created 
ON public.shipments (transporter_id, status, created_at DESC);
