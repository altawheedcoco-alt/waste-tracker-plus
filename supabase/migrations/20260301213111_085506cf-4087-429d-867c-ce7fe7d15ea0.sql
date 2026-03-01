CREATE OR REPLACE FUNCTION public.auto_hold_escrow_on_approval()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'approved' AND OLD.status != 'approved' AND NEW.total_value IS NOT NULL AND NEW.total_value > 0 THEN
    NEW.escrow_status := 'held';
    NEW.escrow_held_at := NOW();
    
    -- Create ledger entry for escrow hold (debit from generator)
    INSERT INTO public.accounting_ledger (
      organization_id, partner_organization_id, shipment_id,
      entry_type, entry_category, amount, description, entry_date
    ) VALUES (
      COALESCE(NEW.generator_id, NEW.transporter_id),
      NEW.transporter_id,
      NEW.id,
      'debit',
      'escrow_hold',
      NEW.total_value,
      'حجز مبلغ ضمان - شحنة رقم ' || NEW.shipment_number,
      CURRENT_DATE
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;