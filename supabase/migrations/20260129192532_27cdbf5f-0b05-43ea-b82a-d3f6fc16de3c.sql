-- Create function to notify receiver organization when a new partner note is created
CREATE OR REPLACE FUNCTION public.notify_partner_note_received()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_receiver_user_ids UUID[];
  v_user_id UUID;
  v_sender_org_name TEXT;
  v_title TEXT;
  v_message TEXT;
BEGIN
  -- Get sender organization name
  SELECT name INTO v_sender_org_name
  FROM organizations
  WHERE id = NEW.sender_organization_id;

  -- Build notification content
  v_title := 'ملاحظة جديدة من ' || COALESCE(v_sender_org_name, 'شريك');
  v_message := NEW.title;
  
  -- Add priority indicator
  IF NEW.priority = 'urgent' THEN
    v_title := '🚨 ' || v_title || ' (عاجل)';
  ELSIF NEW.priority = 'high' THEN
    v_title := '⚠️ ' || v_title || ' (مهم)';
  END IF;

  -- Get all user IDs from receiver organization
  SELECT ARRAY_AGG(p.user_id) INTO v_receiver_user_ids
  FROM profiles p
  WHERE p.organization_id = NEW.receiver_organization_id
    AND p.is_active = true;

  -- Send notifications to all users in receiver organization
  IF v_receiver_user_ids IS NOT NULL THEN
    FOREACH v_user_id IN ARRAY v_receiver_user_ids
    LOOP
      INSERT INTO notifications (user_id, title, message, type)
      VALUES (v_user_id, v_title, v_message, 'partner_note');
    END LOOP;
  END IF;

  RETURN NEW;
END;
$$;

-- Create trigger for partner notes
DROP TRIGGER IF EXISTS on_partner_note_created ON partner_notes;
CREATE TRIGGER on_partner_note_created
  AFTER INSERT ON partner_notes
  FOR EACH ROW
  EXECUTE FUNCTION notify_partner_note_received();