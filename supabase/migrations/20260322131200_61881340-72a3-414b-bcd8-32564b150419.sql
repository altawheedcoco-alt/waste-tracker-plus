
-- Trigger: عند قبول مزايدة يُضاف المبلغ كمعلق في محفظة السائق
CREATE OR REPLACE FUNCTION public.on_bid_accepted()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.status = 'accepted' AND (OLD.status IS NULL OR OLD.status <> 'accepted') THEN
    -- تأكد من وجود محفظة للسائق
    INSERT INTO public.driver_financial_wallet (driver_id)
    VALUES (NEW.driver_id)
    ON CONFLICT (driver_id) DO NOTHING;

    -- إضافة المبلغ كمعلق
    UPDATE public.driver_financial_wallet
    SET pending_balance = pending_balance + NEW.bid_amount,
        updated_at = now()
    WHERE driver_id = NEW.driver_id;

    -- تسجيل المعاملة
    INSERT INTO public.driver_financial_transactions (driver_id, transaction_type, amount, description, shipment_id)
    VALUES (NEW.driver_id, 'earning', NEW.bid_amount, 'عرض سعر مقبول — معلق حتى التسليم', NEW.shipment_id);

    -- ربط السائق بالشحنة
    UPDATE public.shipments
    SET driver_id = (SELECT profile_id FROM public.drivers WHERE id = NEW.driver_id)
    WHERE id = NEW.shipment_id AND driver_id IS NULL;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_bid_accepted
  AFTER UPDATE ON public.driver_shipment_bids
  FOR EACH ROW
  EXECUTE FUNCTION public.on_bid_accepted();

-- Trigger: عند تأكيد التسليم يتحول المعلق إلى رصيد متاح
CREATE OR REPLACE FUNCTION public.on_shipment_delivered_driver_pay()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_driver_id UUID;
  v_bid_amount NUMERIC;
BEGIN
  IF NEW.status IN ('delivered', 'confirmed') AND OLD.status NOT IN ('delivered', 'confirmed') THEN
    -- البحث عن مزايدة مقبولة
    SELECT dsb.driver_id, dsb.bid_amount INTO v_driver_id, v_bid_amount
    FROM public.driver_shipment_bids dsb
    WHERE dsb.shipment_id = NEW.id AND dsb.status = 'accepted'
    LIMIT 1;

    IF v_driver_id IS NOT NULL AND v_bid_amount IS NOT NULL THEN
      UPDATE public.driver_financial_wallet
      SET balance = balance + v_bid_amount,
          pending_balance = GREATEST(pending_balance - v_bid_amount, 0),
          total_earned = total_earned + v_bid_amount,
          updated_at = now()
      WHERE driver_id = v_driver_id;

      INSERT INTO public.driver_financial_transactions (driver_id, transaction_type, amount, description, shipment_id)
      VALUES (v_driver_id, 'earning', v_bid_amount, 'تسليم مكتمل — تم تحويل المبلغ للرصيد المتاح', NEW.id);
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_shipment_delivered_driver_pay
  AFTER UPDATE ON public.shipments
  FOR EACH ROW
  EXECUTE FUNCTION public.on_shipment_delivered_driver_pay();
