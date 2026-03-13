
-- Fix the trigger that references non-existent column
CREATE OR REPLACE FUNCTION trg_notify_partner_rating()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  _rater_name text;
BEGIN
  SELECT name INTO _rater_name FROM organizations WHERE id = NEW.rater_organization_id;
  
  INSERT INTO notifications (user_id, organization_id, title, message, type, is_read, priority)
  SELECT p.id, NEW.rated_organization_id, '⭐ تقييم جديد من شريك',
    'حصلتم على تقييم ' || NEW.overall_rating || '/5 من "' || COALESCE(_rater_name, 'شريك') || '"' ||
    CASE WHEN NEW.comment IS NOT NULL THEN ' - ' || LEFT(NEW.comment, 100) ELSE '' END,
    'info', false, 'normal'
  FROM profiles p WHERE p.organization_id = NEW.rated_organization_id AND p.is_active = true;
  
  RETURN NEW;
END;
$$;
