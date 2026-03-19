
-- Trigger: Create notification when a new encrypted message is inserted
CREATE OR REPLACE FUNCTION public.notify_on_new_encrypted_message()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _sender_name text;
  _recipient_id uuid;
  _conv record;
BEGIN
  -- Get conversation participants
  SELECT participant_1, participant_2 INTO _conv
  FROM public.private_conversations
  WHERE id = NEW.conversation_id;

  IF _conv IS NULL THEN
    RETURN NEW;
  END IF;

  -- Determine recipient
  IF _conv.participant_1 = NEW.sender_id THEN
    _recipient_id := _conv.participant_2;
  ELSE
    _recipient_id := _conv.participant_1;
  END IF;

  -- Get sender name
  SELECT full_name INTO _sender_name
  FROM public.profiles
  WHERE user_id = NEW.sender_id;

  _sender_name := COALESCE(_sender_name, 'مستخدم');

  -- Insert notification for recipient
  INSERT INTO public.notifications (user_id, title, message, type, is_read, metadata)
  VALUES (
    _recipient_id,
    'رسالة جديدة من ' || _sender_name,
    CASE 
      WHEN NEW.message_type = 'image' THEN '📷 صورة'
      WHEN NEW.message_type = 'video' THEN '🎥 فيديو'
      WHEN NEW.message_type = 'audio' THEN '🎵 رسالة صوتية'
      WHEN NEW.message_type = 'file' THEN '📎 ' || COALESCE(NEW.file_name, 'ملف')
      ELSE '💬 رسالة جديدة'
    END,
    'partner_message',
    false,
    jsonb_build_object(
      'conversation_id', NEW.conversation_id,
      'message_id', NEW.id,
      'sender_id', NEW.sender_id
    )
  );

  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_notify_on_encrypted_message
AFTER INSERT ON public.encrypted_messages
FOR EACH ROW
EXECUTE FUNCTION public.notify_on_new_encrypted_message();

-- Trigger: Mark chat notifications as read when messages are marked as read
CREATE OR REPLACE FUNCTION public.mark_chat_notifications_read()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- When a message status changes to 'read', mark related notifications as read
  IF NEW.status = 'read' AND (OLD.status IS DISTINCT FROM 'read') THEN
    UPDATE public.notifications
    SET is_read = true
    WHERE user_id != NEW.sender_id
      AND type = 'partner_message'
      AND is_read = false
      AND metadata->>'conversation_id' = NEW.conversation_id;
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_mark_chat_notifications_read
AFTER UPDATE OF status ON public.encrypted_messages
FOR EACH ROW
WHEN (NEW.status = 'read')
EXECUTE FUNCTION public.mark_chat_notifications_read();
