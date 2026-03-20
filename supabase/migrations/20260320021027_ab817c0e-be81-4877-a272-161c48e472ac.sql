
CREATE OR REPLACE FUNCTION public.notify_note_created()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  _author_name TEXT;
  _resource_label TEXT;
  _mentioned_id UUID;
BEGIN
  SELECT full_name INTO _author_name FROM public.profiles WHERE id = NEW.author_id;
  
  _resource_label := CASE NEW.resource_type
    WHEN 'shipment' THEN 'شحنة'
    WHEN 'contract' THEN 'عقد'
    WHEN 'invoice' THEN 'فاتورة'
    WHEN 'deposit' THEN 'إيداع'
    WHEN 'vehicle' THEN 'مركبة'
    WHEN 'driver' THEN 'سائق'
    WHEN 'customer' THEN 'عميل'
    WHEN 'award_letter' THEN 'خطاب ترسية'
    WHEN 'signing_request' THEN 'طلب توقيع'
    ELSE 'عنصر'
  END;

  -- Notify mentioned users (only those with valid auth.users entries)
  IF NEW.mentioned_user_ids IS NOT NULL AND array_length(NEW.mentioned_user_ids, 1) > 0 THEN
    BEGIN
      INSERT INTO public.notifications (user_id, organization_id, title, message, type, resource_type, resource_id)
      SELECT 
        u_id,
        NEW.organization_id,
        'إشارة في ملاحظة',
        format('أشار إليك %s في ملاحظة على %s', _author_name, _resource_label),
        'mention',
        NEW.resource_type,
        NEW.resource_id
      FROM unnest(NEW.mentioned_user_ids) AS u_id
      WHERE EXISTS (SELECT 1 FROM auth.users WHERE id = u_id);
    EXCEPTION WHEN OTHERS THEN
      RAISE WARNING 'notify_note_created: failed to notify mentioned users: %', SQLERRM;
    END;
  END IF;

  -- Notify target org if partner visibility (only profiles with valid auth.users entries)
  IF NEW.visibility = 'partner' AND NEW.target_organization_id IS NOT NULL THEN
    BEGIN
      INSERT INTO public.notifications (user_id, organization_id, title, message, type, resource_type, resource_id)
      SELECT 
        p.id,
        NEW.target_organization_id,
        'ملاحظة جديدة من شريك',
        format('أضاف %s ملاحظة على %s', _author_name, _resource_label),
        'partner_note',
        NEW.resource_type,
        NEW.resource_id
      FROM public.profiles p
      INNER JOIN auth.users au ON au.id = p.id
      WHERE p.organization_id = NEW.target_organization_id
      LIMIT 5;
    EXCEPTION WHEN OTHERS THEN
      RAISE WARNING 'notify_note_created: failed to notify partner org: %', SQLERRM;
    END;
  END IF;

  RETURN NEW;
END;
$function$;
