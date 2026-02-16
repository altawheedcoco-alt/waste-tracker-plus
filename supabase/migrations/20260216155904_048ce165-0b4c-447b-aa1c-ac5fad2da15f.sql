-- Update the approval deadline trigger to use 15 minutes instead of 6 hours
CREATE OR REPLACE FUNCTION set_approval_deadlines()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  -- Set 15-minute deadline for generator when shipment goes to in_transit
  IF NEW.status = 'in_transit' AND (OLD.status IS NULL OR OLD.status != 'in_transit') THEN
    IF NEW.generator_id IS NOT NULL AND NEW.generator_auto_approve_deadline IS NULL THEN
      NEW.generator_auto_approve_deadline := now() + interval '15 minutes';
    END IF;
  END IF;
  
  -- Set 15-minute deadline for recycler when shipment is delivered
  IF NEW.status = 'delivered' AND (OLD.status IS NULL OR OLD.status != 'delivered') THEN
    IF NEW.recycler_id IS NOT NULL AND NEW.recycler_auto_approve_deadline IS NULL THEN
      NEW.recycler_auto_approve_deadline := now() + interval '15 minutes';
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Also update the auto_approve_at default in the shipment creation trigger
CREATE OR REPLACE FUNCTION auto_approve_expired_shipments()
RETURNS void
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  -- Auto-approve generator pending shipments after 15 minutes
  UPDATE shipments
  SET 
    generator_approval_status = 'auto_approved',
    generator_approval_at = now()
  WHERE 
    generator_approval_status = 'pending'
    AND generator_auto_approve_deadline IS NOT NULL
    AND generator_auto_approve_deadline < now();
    
  -- Auto-approve recycler pending shipments after 15 minutes
  UPDATE shipments
  SET 
    recycler_approval_status = 'auto_approved',
    recycler_approval_at = now()
  WHERE 
    recycler_approval_status = 'pending'
    AND recycler_auto_approve_deadline IS NOT NULL
    AND recycler_auto_approve_deadline < now();
END;
$$;