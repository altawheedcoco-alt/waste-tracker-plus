
-- Trigger for new chat messages → notify room members
CREATE OR REPLACE FUNCTION public.notify_new_chat_message()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  member_record RECORD;
  sender_name text;
  room_name text;
BEGIN
  -- Get sender name
  SELECT full_name INTO sender_name FROM profiles WHERE id = NEW.sender_id;
  sender_name := COALESCE(sender_name, 'مستخدم');

  -- Get room name
  SELECT name INTO room_name FROM chat_rooms WHERE id = NEW.room_id;
  room_name := COALESCE(room_name, 'محادثة');

  -- Notify all room members except sender
  FOR member_record IN
    SELECT DISTINCT user_id
    FROM chat_room_members
    WHERE room_id = NEW.room_id
      AND user_id != NEW.sender_id
  LOOP
    INSERT INTO notifications (user_id, title, message, type, is_read, reference_id, reference_type)
    VALUES (
      member_record.user_id,
      '💬 رسالة جديدة من ' || sender_name,
      CASE 
        WHEN length(NEW.content) > 80 THEN substring(NEW.content from 1 for 80) || '...'
        ELSE NEW.content
      END,
      'chat_message',
      false,
      NEW.room_id,
      'chat_room'
    );
  END LOOP;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_notify_new_chat_message ON chat_messages;
CREATE TRIGGER trg_notify_new_chat_message
  AFTER INSERT ON chat_messages
  FOR EACH ROW
  EXECUTE FUNCTION notify_new_chat_message();

-- Trigger for new deposits → notify organization members
CREATE OR REPLACE FUNCTION public.notify_new_deposit()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  member_record RECORD;
BEGIN
  FOR member_record IN
    SELECT DISTINCT p.id as user_id
    FROM profiles p
    WHERE p.organization_id = NEW.organization_id
  LOOP
    INSERT INTO notifications (user_id, title, message, type, is_read, reference_id, reference_type)
    VALUES (
      member_record.user_id,
      '💰 إيداع جديد',
      'تم تسجيل إيداع بقيمة ' || NEW.amount || ' جنيه',
      'deposit',
      false,
      NEW.id,
      'deposit'
    );
  END LOOP;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_notify_new_deposit ON deposits;
CREATE TRIGGER trg_notify_new_deposit
  AFTER INSERT ON deposits
  FOR EACH ROW
  EXECUTE FUNCTION notify_new_deposit();
