
-- Create a stub for the missing notify_related_parties function
CREATE OR REPLACE FUNCTION notify_related_parties(
  p_org_id uuid,
  p_partner_org_id uuid,
  p_shipment_id uuid,
  p_title text,
  p_message text,
  p_type text,
  p_ref_id uuid,
  p_ref_type text,
  p_user_id uuid
) RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Stub: notifications will be handled by the application layer
  -- This prevents trigger errors on entity_documents insert
  NULL;
END;
$$;
