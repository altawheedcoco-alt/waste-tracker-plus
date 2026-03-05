CREATE OR REPLACE FUNCTION public.notify_related_parties(
  _org_id uuid,
  _partner_org_id uuid DEFAULT NULL,
  _shipment_id uuid DEFAULT NULL,
  _title text DEFAULT '',
  _message text DEFAULT '',
  _type text DEFAULT 'general',
  _reference_id text DEFAULT NULL,
  _reference_type text DEFAULT NULL,
  _exclude_user_id uuid DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _all_org_ids uuid[];
  _gen_org uuid;
  _trans_org uuid;
  _rec_org uuid;
  _user_record record;
BEGIN
  _all_org_ids := ARRAY[_org_id];

  IF _partner_org_id IS NOT NULL THEN
    _all_org_ids := array_append(_all_org_ids, _partner_org_id);
  END IF;

  IF _shipment_id IS NOT NULL THEN
    SELECT generator_organization_id, transporter_organization_id, recycler_organization_id
    INTO _gen_org, _trans_org, _rec_org
    FROM shipments WHERE id = _shipment_id;

    IF _gen_org IS NOT NULL AND NOT (_gen_org = ANY(_all_org_ids)) THEN
      _all_org_ids := array_append(_all_org_ids, _gen_org);
    END IF;
    IF _trans_org IS NOT NULL AND NOT (_trans_org = ANY(_all_org_ids)) THEN
      _all_org_ids := array_append(_all_org_ids, _trans_org);
    END IF;
    IF _rec_org IS NOT NULL AND NOT (_rec_org = ANY(_all_org_ids)) THEN
      _all_org_ids := array_append(_all_org_ids, _rec_org);
    END IF;
  END IF;

  FOR _user_record IN
    SELECT DISTINCT p.id as user_id
    FROM profiles p
    WHERE p.organization_id = ANY(_all_org_ids)
      AND p.is_active = true
      AND (_exclude_user_id IS NULL OR p.id != _exclude_user_id)
  LOOP
    INSERT INTO notifications (user_id, title, message, type, is_read, shipment_id, organization_id, metadata)
    VALUES (
      _user_record.user_id,
      _title,
      _message,
      _type,
      false,
      _shipment_id,
      _org_id,
      jsonb_build_object('reference_id', _reference_id, 'reference_type', _reference_type)
    );
  END LOOP;
END;
$$;