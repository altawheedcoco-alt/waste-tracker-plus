
-- 1. Add escrow_status to shipments for tracking payment lifecycle
ALTER TABLE public.shipments ADD COLUMN IF NOT EXISTS escrow_status TEXT DEFAULT 'none' CHECK (escrow_status IN ('none', 'held', 'released', 'refunded'));
ALTER TABLE public.shipments ADD COLUMN IF NOT EXISTS escrow_held_at TIMESTAMPTZ;
ALTER TABLE public.shipments ADD COLUMN IF NOT EXISTS escrow_released_at TIMESTAMPTZ;

-- 2. Add driver_earnings column for tracking driver payment
ALTER TABLE public.shipments ADD COLUMN IF NOT EXISTS driver_earnings NUMERIC DEFAULT 0;

-- 3. Trigger: Auto-hold escrow when shipment is approved (has total_value)
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
      COALESCE(NEW.generator_id, NEW.organization_id),
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
$$ LANGUAGE plpgsql SET search_path = public;

DROP TRIGGER IF EXISTS trigger_auto_escrow_hold ON public.shipments;
CREATE TRIGGER trigger_auto_escrow_hold
  BEFORE UPDATE ON public.shipments
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_hold_escrow_on_approval();

-- 4. Enhanced trigger: Release escrow + pay driver on confirmed
CREATE OR REPLACE FUNCTION public.auto_release_escrow_and_pay_driver()
RETURNS TRIGGER AS $$
DECLARE
  v_driver_profile_user_id UUID;
  v_driver_earning NUMERIC;
BEGIN
  IF NEW.status = 'confirmed' AND OLD.status != 'confirmed' AND NEW.escrow_status = 'held' THEN
    -- Release escrow
    NEW.escrow_status := 'released';
    NEW.escrow_released_at := NOW();
    
    -- Calculate driver earnings (e.g., 15% of total_value or use driver_earnings if set)
    v_driver_earning := COALESCE(NULLIF(NEW.driver_earnings, 0), ROUND(NEW.total_value * 0.15, 2));
    NEW.driver_earnings := v_driver_earning;
    
    -- Ledger entry: Release escrow to transporter (credit)
    INSERT INTO public.accounting_ledger (
      organization_id, partner_organization_id, shipment_id,
      entry_type, entry_category, amount, description, entry_date
    ) VALUES (
      NEW.transporter_id,
      COALESCE(NEW.generator_id, NEW.organization_id),
      NEW.id,
      'credit',
      'escrow_release',
      NEW.total_value,
      'تحرير مبلغ الضمان - شحنة رقم ' || NEW.shipment_number,
      CURRENT_DATE
    );
    
    -- Ledger entry: Driver payment (credit to transporter as driver earning)
    IF NEW.driver_id IS NOT NULL AND v_driver_earning > 0 THEN
      INSERT INTO public.accounting_ledger (
        organization_id, shipment_id,
        entry_type, entry_category, amount, description, entry_date
      ) VALUES (
        NEW.transporter_id,
        NEW.id,
        'debit',
        'driver_payment',
        v_driver_earning,
        'مستحقات السائق - شحنة رقم ' || NEW.shipment_number,
        CURRENT_DATE
      );
      
      -- Notify driver about payment
      BEGIN
        SELECT p.user_id INTO v_driver_profile_user_id
        FROM public.drivers d
        JOIN public.profiles p ON p.id = d.profile_id
        WHERE d.id = NEW.driver_id;
        
        IF v_driver_profile_user_id IS NOT NULL THEN
          INSERT INTO public.notifications (user_id, title, message, type, shipment_id)
          VALUES (
            v_driver_profile_user_id,
            '💰 تم إيداع مستحقاتك',
            'تم إيداع ' || v_driver_earning || ' في محفظتك عن شحنة رقم ' || NEW.shipment_number,
            'payment',
            NEW.id
          );
        END IF;
      EXCEPTION WHEN OTHERS THEN
        -- Don't fail the trigger if notification fails
        NULL;
      END;
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

DROP TRIGGER IF EXISTS trigger_auto_release_escrow ON public.shipments;
CREATE TRIGGER trigger_auto_release_escrow
  BEFORE UPDATE ON public.shipments
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_release_escrow_and_pay_driver();

-- 5. Function to check ETA and notify recycler (called from edge function)
-- We'll handle ETA notification via edge function + driver_location_logs
