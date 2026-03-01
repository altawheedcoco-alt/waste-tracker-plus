-- Prevent duplicate status transitions on shipments (same user, same status)
CREATE OR REPLACE FUNCTION public.prevent_duplicate_shipment_status()
RETURNS TRIGGER AS $$
BEGIN
  -- Only check on status changes
  IF OLD.status IS NOT DISTINCT FROM NEW.status THEN
    RETURN NEW;
  END IF;
  
  -- Check if this exact status transition was already done by this user
  IF EXISTS (
    SELECT 1 FROM public.action_execution_log
    WHERE resource_type = 'shipment'
      AND resource_id = NEW.id::text
      AND action_type = 'status_change'
      AND action_value = NEW.status::text
      AND user_id = COALESCE(auth.uid(), '00000000-0000-0000-0000-000000000000'::uuid)
  ) THEN
    RAISE EXCEPTION 'تم تنفيذ هذا الإجراء مسبقاً ولا يمكن تكراره من نفس المستخدم';
  END IF;
  
  -- Auto-record the action
  INSERT INTO public.action_execution_log (user_id, action_type, resource_type, resource_id, action_value, organization_id)
  VALUES (
    COALESCE(auth.uid(), '00000000-0000-0000-0000-000000000000'::uuid),
    'status_change',
    'shipment',
    NEW.id::text,
    NEW.status::text,
    COALESCE(NEW.transporter_id, NEW.generator_id)
  ) ON CONFLICT DO NOTHING;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER trg_prevent_duplicate_shipment_status
  BEFORE UPDATE ON public.shipments
  FOR EACH ROW
  EXECUTE FUNCTION public.prevent_duplicate_shipment_status();

-- Same for disposal_incoming_requests
CREATE OR REPLACE FUNCTION public.prevent_duplicate_action_generic()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.status IS NOT DISTINCT FROM NEW.status THEN
    RETURN NEW;
  END IF;
  
  IF EXISTS (
    SELECT 1 FROM public.action_execution_log
    WHERE resource_type = TG_TABLE_NAME
      AND resource_id = NEW.id::text
      AND action_type = 'status_change'
      AND action_value = NEW.status::text
      AND user_id = COALESCE(auth.uid(), '00000000-0000-0000-0000-000000000000'::uuid)
  ) THEN
    RAISE EXCEPTION 'تم تنفيذ هذا الإجراء مسبقاً ولا يمكن تكراره من نفس المستخدم';
  END IF;
  
  INSERT INTO public.action_execution_log (user_id, action_type, resource_type, resource_id, action_value)
  VALUES (
    COALESCE(auth.uid(), '00000000-0000-0000-0000-000000000000'::uuid),
    'status_change',
    TG_TABLE_NAME,
    NEW.id::text,
    NEW.status::text
  ) ON CONFLICT DO NOTHING;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Apply to key tables with status transitions
CREATE TRIGGER trg_prevent_dup_disposal_requests
  BEFORE UPDATE ON public.disposal_incoming_requests
  FOR EACH ROW
  EXECUTE FUNCTION public.prevent_duplicate_action_generic();

CREATE TRIGGER trg_prevent_dup_disposal_ops
  BEFORE UPDATE ON public.disposal_operations
  FOR EACH ROW
  EXECUTE FUNCTION public.prevent_duplicate_action_generic();

CREATE TRIGGER trg_prevent_dup_work_orders
  BEFORE UPDATE ON public.work_orders
  FOR EACH ROW
  EXECUTE FUNCTION public.prevent_duplicate_action_generic();

CREATE TRIGGER trg_prevent_dup_invoices
  BEFORE UPDATE ON public.invoices
  FOR EACH ROW
  EXECUTE FUNCTION public.prevent_duplicate_action_generic();

CREATE TRIGGER trg_prevent_dup_contracts
  BEFORE UPDATE ON public.contracts
  FOR EACH ROW
  EXECUTE FUNCTION public.prevent_duplicate_action_generic();

CREATE TRIGGER trg_prevent_dup_deposits
  BEFORE UPDATE ON public.deposits
  FOR EACH ROW
  EXECUTE FUNCTION public.prevent_duplicate_action_generic();

CREATE TRIGGER trg_prevent_dup_collection_requests
  BEFORE UPDATE ON public.collection_requests
  FOR EACH ROW
  EXECUTE FUNCTION public.prevent_duplicate_action_generic();

CREATE TRIGGER trg_prevent_dup_approval_requests
  BEFORE UPDATE ON public.approval_requests
  FOR EACH ROW
  EXECUTE FUNCTION public.prevent_duplicate_action_generic();