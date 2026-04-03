
CREATE OR REPLACE FUNCTION public.fn_auto_notify_channels()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  _skip_channels BOOLEAN;
  _user_status TEXT;
  _base_url TEXT := 'https://dgununqfxohodimmgxuk.supabase.co';
  _anon_key TEXT := 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRndW51bnFmeG9ob2RpbW1neHVrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM5Mzc4MDMsImV4cCI6MjA4OTUxMzgwM30.sGJm0IxrxHN_LV54s2M7xvgm7iQ1SK9KycR3jBu02Ug';
  _push_payload JSONB;
  _wa_payload JSONB;
  _deep_link TEXT;
  _ntype TEXT;
BEGIN
  _skip_channels := COALESCE((NEW.metadata->>'skip_auto_channels')::boolean, false);
  IF _skip_channels THEN
    RETURN NEW;
  END IF;

  -- Check user presence
  SELECT status INTO _user_status
  FROM public.user_presence
  WHERE user_id = NEW.user_id;

  IF _user_status = 'online' THEN
    RETURN NEW;
  END IF;

  -- Build deep-link URL based on notification type
  _ntype := COALESCE(NEW.type, 'general');
  _deep_link := COALESCE(NEW.metadata->>'url', NULL);

  IF _deep_link IS NULL THEN
    CASE
      WHEN _ntype LIKE 'shipment%' OR _ntype IN ('status_update','new_shipment','delivery_confirmed',
        'pickup_started','pickup_completed','delivery_started','weight_mismatch','weight_dispute',
        'dispute_resolved','dispute_escalated','dispute_created','collection_request',
        'custody_generator_handover','custody_transporter_pickup','custody_transporter_delivery',
        'custody_recycler_receipt','custody_chain_complete','driver_assignment','driver_reassigned',
        'shipment_status_change','collection_trip_assigned','collection_trip_status','proof_of_service') THEN
        IF NEW.shipment_id IS NOT NULL THEN
          _deep_link := '/dashboard/shipments/' || NEW.shipment_id::text;
        ELSE
          _deep_link := '/dashboard/shipments';
        END IF;

      WHEN _ntype IN ('chat_message','message','mention','partner_message','group_message',
        'channel_message','thread_reply','reaction_added','pinned_message') THEN
        IF NEW.metadata->>'conversation_id' IS NOT NULL THEN
          _deep_link := '/dashboard/chat?conv=' || (NEW.metadata->>'conversation_id');
        ELSE
          _deep_link := '/dashboard/chat';
        END IF;

      WHEN _ntype LIKE 'invoice%' THEN
        _deep_link := '/dashboard/erp/accounting';

      WHEN _ntype LIKE 'contract%' THEN
        _deep_link := '/dashboard/contracts';

      WHEN _ntype LIKE 'partnership%' OR _ntype LIKE 'partner%' THEN
        _deep_link := '/dashboard/partners';

      WHEN _ntype LIKE 'driver%' THEN
        _deep_link := '/dashboard/transporter-drivers';

      WHEN _ntype LIKE 'employee%' OR _ntype LIKE 'member%' THEN
        _deep_link := '/dashboard/employee-management';

      WHEN _ntype IN ('new_post','post_liked','post_commented','story_posted','story_reaction',
        'announcement','reel_posted','reel_liked','reel_commented','member_post') THEN
        _deep_link := '/dashboard/news-feed';

      WHEN _ntype LIKE 'broadcast%' THEN
        _deep_link := '/dashboard/broadcast-channels';

      WHEN _ntype LIKE 'work_order%' OR _ntype IN ('task_assigned','task_completed','operational_plan') THEN
        _deep_link := '/dashboard/work-orders';

      WHEN _ntype LIKE 'emergency%' OR _ntype = 'driver_emergency' THEN
        _deep_link := '/dashboard/fleet-tracking';

      ELSE
        _deep_link := '/dashboard/notifications';
    END CASE;
  END IF;

  -- Push Notification
  _push_payload := jsonb_build_object(
    'user_id', NEW.user_id::text,
    'title', COALESCE(NEW.title, 'إشعار جديد'),
    'body', COALESCE(NEW.message, ''),
    'tag', 'auto-' || _ntype || '-' || extract(epoch from now())::bigint,
    'data', jsonb_build_object(
      'url', _deep_link,
      'type', _ntype,
      'reference_id', COALESCE(NEW.resource_id::text, NEW.shipment_id::text, ''),
      'notification_id', NEW.id::text
    )
  );

  PERFORM net.http_post(
    url := _base_url || '/functions/v1/send-push',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || _anon_key
    ),
    body := _push_payload
  );

  -- WhatsApp
  _wa_payload := jsonb_build_object(
    'action', 'send_to_user',
    'user_id', NEW.user_id::text,
    'message', COALESCE(NEW.title, '') || E'\n' || COALESCE(NEW.message, ''),
    'notification_type', _ntype
  );

  PERFORM net.http_post(
    url := _base_url || '/functions/v1/whatsapp-send',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || _anon_key
    ),
    body := _wa_payload
  );

  RETURN NEW;
END;
$$;
