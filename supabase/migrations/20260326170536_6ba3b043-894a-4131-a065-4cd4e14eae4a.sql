
-- ========================================
-- المدور (Recycler): إشعارات شاملة
-- ========================================

-- 1. Production Batches → إشعار دفعة إنتاج
CREATE OR REPLACE FUNCTION notify_production_batch() RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE v_member RECORD;
BEGIN
  FOR v_member IN SELECT user_id FROM organization_members WHERE organization_id = NEW.organization_id AND status = 'active' LOOP
    IF TG_OP = 'INSERT' THEN
      INSERT INTO notifications(user_id, title, message, type, is_read)
      VALUES(v_member.user_id, '🏭 دفعة إنتاج جديدة #' || COALESCE(NEW.batch_number,''), COALESCE(NEW.input_waste_type,'') || ' → ' || COALESCE(NEW.output_product_type,''), 'production_batch_new', false);
    ELSIF TG_OP = 'UPDATE' AND OLD.status IS DISTINCT FROM NEW.status THEN
      INSERT INTO notifications(user_id, title, message, type, is_read)
      VALUES(v_member.user_id,
        CASE 
          WHEN NEW.status = 'completed' THEN '✅ اكتملت دفعة إنتاج #' || COALESCE(NEW.batch_number,'')
          WHEN NEW.status = 'in_progress' THEN '🔄 بدأ تشغيل دفعة #' || COALESCE(NEW.batch_number,'')
          ELSE '📋 تحديث دفعة #' || COALESCE(NEW.batch_number,'') || ': ' || NEW.status
        END,
        'نسبة الاستخلاص: ' || COALESCE(NEW.extraction_rate::text,'--') || '% | الجودة: ' || COALESCE(NEW.quality_grade,'--'), 'production_batch_status', false);
    END IF;
  END LOOP;
  RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS trg_notify_production_batch ON production_batches;
CREATE TRIGGER trg_notify_production_batch AFTER INSERT OR UPDATE ON production_batches FOR EACH ROW EXECUTE FUNCTION notify_production_batch();

-- 2. Recycling Reports → إشعار تقرير تدوير
CREATE OR REPLACE FUNCTION notify_recycling_report() RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE v_member RECORD; v_ship RECORD;
BEGIN
  IF NEW.recycler_organization_id IS NOT NULL THEN
    FOR v_member IN SELECT user_id FROM organization_members WHERE organization_id = NEW.recycler_organization_id AND status = 'active' LOOP
      INSERT INTO notifications(user_id, title, message, type, shipment_id, is_read)
      VALUES(v_member.user_id,
        CASE WHEN TG_OP='INSERT' THEN '📊 تقرير تدوير جديد #' || COALESCE(NEW.report_number,'') ELSE '📊 تحديث تقرير #' || COALESCE(NEW.report_number,'') || ': ' || COALESCE(NEW.status,'') END,
        COALESCE(NEW.waste_category,''), 'recycling_report', NEW.shipment_id, false);
    END LOOP;
  END IF;
  -- إشعار المولد صاحب الشحنة
  IF NEW.shipment_id IS NOT NULL THEN
    SELECT generator_id INTO v_ship FROM shipments WHERE id = NEW.shipment_id;
    IF v_ship.generator_id IS NOT NULL THEN
      FOR v_member IN SELECT user_id FROM organization_members WHERE organization_id = v_ship.generator_id AND status = 'active' LOOP
        INSERT INTO notifications(user_id, title, message, type, shipment_id, is_read)
        VALUES(v_member.user_id, '📊 تقرير تدوير لشحنتك', 'تم إنشاء تقرير تدوير #' || COALESCE(NEW.report_number,''), 'recycling_report_generator', NEW.shipment_id, false);
      END LOOP;
    END IF;
  END IF;
  RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS trg_notify_recycling_report ON recycling_reports;
CREATE TRIGGER trg_notify_recycling_report AFTER INSERT OR UPDATE ON recycling_reports FOR EACH ROW EXECUTE FUNCTION notify_recycling_report();

-- 3. Recycler Timeslots → إشعار حجز موعد عند المدور
CREATE OR REPLACE FUNCTION notify_recycler_timeslot() RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE v_member RECORD;
BEGIN
  IF TG_OP = 'INSERT' AND NEW.organization_id IS NOT NULL THEN
    FOR v_member IN SELECT user_id FROM organization_members WHERE organization_id = NEW.organization_id AND status = 'active' LOOP
      INSERT INTO notifications(user_id, title, message, type, is_read)
      VALUES(v_member.user_id, '📅 حجز موعد استقبال جديد', 'تم حجز فترة زمنية جديدة لاستقبال مواد', 'recycler_timeslot', false);
    END LOOP;
  END IF;
  RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS trg_notify_recycler_timeslot ON recycler_timeslots;
CREATE TRIGGER trg_notify_recycler_timeslot AFTER INSERT ON recycler_timeslots FOR EACH ROW EXECUTE FUNCTION notify_recycler_timeslot();

-- 4. Broadcast Posts → إشعار منشور جديد في قناة
CREATE OR REPLACE FUNCTION notify_broadcast_post() RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE v_sub RECORD; v_channel_name TEXT;
BEGIN
  SELECT name INTO v_channel_name FROM broadcast_channels WHERE id = NEW.channel_id;
  FOR v_sub IN SELECT user_id FROM broadcast_channel_subscribers WHERE channel_id = NEW.channel_id AND user_id != NEW.sender_id LOOP
    INSERT INTO notifications(user_id, title, message, type, is_read)
    VALUES(v_sub.user_id, '📢 منشور جديد في ' || COALESCE(v_channel_name,'القناة'), LEFT(COALESCE(NEW.content,''),80), 'broadcast_post', false);
  END LOOP;
  RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS trg_notify_broadcast_post ON broadcast_posts;
CREATE TRIGGER trg_notify_broadcast_post AFTER INSERT ON broadcast_posts FOR EACH ROW EXECUTE FUNCTION notify_broadcast_post();
