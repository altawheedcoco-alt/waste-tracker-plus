-- Add approval status columns for generator and recycler
ALTER TABLE public.shipments 
ADD COLUMN IF NOT EXISTS generator_approval_status text DEFAULT 'pending' CHECK (generator_approval_status IN ('pending', 'approved', 'rejected', 'auto_approved')),
ADD COLUMN IF NOT EXISTS generator_approval_at timestamp with time zone,
ADD COLUMN IF NOT EXISTS generator_rejection_reason text,
ADD COLUMN IF NOT EXISTS generator_auto_approve_deadline timestamp with time zone,
ADD COLUMN IF NOT EXISTS recycler_approval_status text DEFAULT 'pending' CHECK (recycler_approval_status IN ('pending', 'approved', 'rejected', 'auto_approved')),
ADD COLUMN IF NOT EXISTS recycler_approval_at timestamp with time zone,
ADD COLUMN IF NOT EXISTS recycler_rejection_reason text,
ADD COLUMN IF NOT EXISTS recycler_auto_approve_deadline timestamp with time zone;

-- Create index for efficient querying of pending approvals
CREATE INDEX IF NOT EXISTS idx_shipments_generator_approval ON shipments(generator_id, generator_approval_status) WHERE generator_approval_status = 'pending';
CREATE INDEX IF NOT EXISTS idx_shipments_recycler_approval ON shipments(recycler_id, recycler_approval_status) WHERE recycler_approval_status = 'pending';

-- Function to auto-approve expired pending shipments
CREATE OR REPLACE FUNCTION auto_approve_expired_shipments()
RETURNS void
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  -- Auto-approve generator pending shipments after 6 hours
  UPDATE shipments
  SET 
    generator_approval_status = 'auto_approved',
    generator_approval_at = now()
  WHERE 
    generator_approval_status = 'pending'
    AND generator_auto_approve_deadline IS NOT NULL
    AND generator_auto_approve_deadline < now();
    
  -- Auto-approve recycler pending shipments after 6 hours
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

-- Trigger to set auto-approve deadline when shipment is created or status changes
CREATE OR REPLACE FUNCTION set_approval_deadlines()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  -- Set 6-hour deadline for generator when shipment goes to in_transit
  IF NEW.status = 'in_transit' AND (OLD.status IS NULL OR OLD.status != 'in_transit') THEN
    IF NEW.generator_id IS NOT NULL AND NEW.generator_auto_approve_deadline IS NULL THEN
      NEW.generator_auto_approve_deadline := now() + interval '6 hours';
    END IF;
  END IF;
  
  -- Set 6-hour deadline for recycler when shipment is delivered
  IF NEW.status = 'delivered' AND (OLD.status IS NULL OR OLD.status != 'delivered') THEN
    IF NEW.recycler_id IS NOT NULL AND NEW.recycler_auto_approve_deadline IS NULL THEN
      NEW.recycler_auto_approve_deadline := now() + interval '6 hours';
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_set_approval_deadlines ON shipments;
CREATE TRIGGER trigger_set_approval_deadlines
  BEFORE INSERT OR UPDATE ON shipments
  FOR EACH ROW
  EXECUTE FUNCTION set_approval_deadlines();