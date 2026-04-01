
-- Auto-create accounting ledger entry when shipment is completed
CREATE OR REPLACE FUNCTION public.auto_ledger_on_shipment_complete()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only trigger when status changes to 'completed'
  IF NEW.status = 'completed' AND OLD.status != 'completed' THEN
    -- Create ledger entry for the transporter (revenue)
    IF NEW.transporter_id IS NOT NULL AND NEW.estimated_cost IS NOT NULL AND NEW.estimated_cost > 0 THEN
      INSERT INTO public.accounting_ledger (
        organization_id, entry_type, entry_category, amount, 
        description, shipment_id, entry_date, reference_number
      ) VALUES (
        NEW.transporter_id, 'credit', 'shipment_revenue', NEW.estimated_cost,
        'إيراد شحنة مكتملة #' || COALESCE(NEW.tracking_number, NEW.id::text),
        NEW.id, NOW()::date, 'SHP-' || COALESCE(NEW.tracking_number, LEFT(NEW.id::text, 8))
      );
    END IF;
    
    -- Create ledger entry for the generator (expense)
    IF NEW.generator_id IS NOT NULL AND NEW.estimated_cost IS NOT NULL AND NEW.estimated_cost > 0 THEN
      INSERT INTO public.accounting_ledger (
        organization_id, entry_type, entry_category, amount,
        description, shipment_id, entry_date, reference_number
      ) VALUES (
        NEW.generator_id, 'debit', 'shipment_cost', NEW.estimated_cost,
        'تكلفة شحنة مكتملة #' || COALESCE(NEW.tracking_number, NEW.id::text),
        NEW.id, NOW()::date, 'SHP-' || COALESCE(NEW.tracking_number, LEFT(NEW.id::text, 8))
      );
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_auto_ledger_shipment ON public.shipments;
CREATE TRIGGER trg_auto_ledger_shipment
  AFTER UPDATE ON public.shipments
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_ledger_on_shipment_complete();
