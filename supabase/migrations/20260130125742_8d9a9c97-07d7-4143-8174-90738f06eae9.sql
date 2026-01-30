-- Create function to notify partners when new post is created
CREATE OR REPLACE FUNCTION public.notify_partners_new_post()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_partner_ids UUID[];
  v_partner_user_ids UUID[];
  v_user_id UUID;
  v_org_name TEXT;
  v_post_type_label TEXT;
  v_title TEXT;
  v_message TEXT;
BEGIN
  -- Get organization name
  SELECT name INTO v_org_name
  FROM organizations
  WHERE id = NEW.organization_id;

  -- Get post type label in Arabic
  v_post_type_label := CASE NEW.post_type
    WHEN 'text' THEN 'منشور نصي'
    WHEN 'image' THEN 'صورة'
    WHEN 'video' THEN 'فيديو'
    WHEN 'gallery' THEN 'معرض صور'
    ELSE 'منشور'
  END;

  v_title := '📢 منشور جديد من ' || COALESCE(v_org_name, 'شريك');
  v_message := 'نشر شريككم ' || COALESCE(v_org_name, 'الجهة') || ' ' || v_post_type_label || ' جديد';
  
  IF NEW.content IS NOT NULL AND LENGTH(NEW.content) > 0 THEN
    v_message := v_message || ': ' || LEFT(NEW.content, 50);
    IF LENGTH(NEW.content) > 50 THEN
      v_message := v_message || '...';
    END IF;
  END IF;

  -- Get partner organization IDs (organizations that share shipments)
  SELECT ARRAY_AGG(DISTINCT partner_id) INTO v_partner_ids
  FROM (
    SELECT generator_id as partner_id FROM shipments WHERE transporter_id = NEW.organization_id OR recycler_id = NEW.organization_id
    UNION
    SELECT transporter_id as partner_id FROM shipments WHERE generator_id = NEW.organization_id OR recycler_id = NEW.organization_id
    UNION
    SELECT recycler_id as partner_id FROM shipments WHERE generator_id = NEW.organization_id OR transporter_id = NEW.organization_id
  ) partners
  WHERE partner_id IS NOT NULL AND partner_id != NEW.organization_id;

  -- If no partners found, exit
  IF v_partner_ids IS NULL OR array_length(v_partner_ids, 1) IS NULL THEN
    RETURN NEW;
  END IF;

  -- Get all user IDs from partner organizations
  SELECT ARRAY_AGG(p.user_id) INTO v_partner_user_ids
  FROM profiles p
  WHERE p.organization_id = ANY(v_partner_ids)
    AND p.is_active = true;

  -- Send notifications to all partner users
  IF v_partner_user_ids IS NOT NULL THEN
    FOREACH v_user_id IN ARRAY v_partner_user_ids
    LOOP
      INSERT INTO notifications (user_id, title, message, type)
      VALUES (v_user_id, v_title, v_message, 'partner_post');
    END LOOP;
  END IF;

  RETURN NEW;
END;
$$;

-- Create trigger for new posts
DROP TRIGGER IF EXISTS on_organization_post_created ON organization_posts;
CREATE TRIGGER on_organization_post_created
  AFTER INSERT ON organization_posts
  FOR EACH ROW
  EXECUTE FUNCTION notify_partners_new_post();