-- Create function to notify admins when new document is uploaded
CREATE OR REPLACE FUNCTION public.notify_admins_new_document()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_admin_user_ids UUID[];
  v_user_id UUID;
  v_org_name TEXT;
  v_doc_type_label TEXT;
  v_title TEXT;
  v_message TEXT;
BEGIN
  -- Get organization name
  SELECT name INTO v_org_name
  FROM organizations
  WHERE id = NEW.organization_id;

  -- Get document type label in Arabic
  v_doc_type_label := CASE NEW.document_type
    WHEN 'commercial_register' THEN 'السجل التجاري'
    WHEN 'environmental_license' THEN 'الترخيص البيئي'
    WHEN 'representative_id' THEN 'هوية الممثل القانوني'
    WHEN 'delegate_id' THEN 'هوية المفوض'
    WHEN 'agent_id' THEN 'هوية الوكيل'
    WHEN 'other' THEN 'وثيقة أخرى'
    ELSE NEW.document_type
  END;

  v_title := 'وثيقة جديدة من ' || COALESCE(v_org_name, 'مؤسسة');
  v_message := 'قامت المؤسسة برفع وثيقة: ' || v_doc_type_label || ' - ' || NEW.file_name;

  -- Get all admin user IDs
  SELECT ARRAY_AGG(ur.user_id) INTO v_admin_user_ids
  FROM user_roles ur
  WHERE ur.role = 'admin';

  -- Send notifications to all admins
  IF v_admin_user_ids IS NOT NULL THEN
    FOREACH v_user_id IN ARRAY v_admin_user_ids
    LOOP
      INSERT INTO notifications (user_id, title, message, type)
      VALUES (v_user_id, v_title, v_message, 'document_uploaded');
    END LOOP;
  END IF;

  RETURN NEW;
END;
$$;

-- Create trigger for new document uploads
DROP TRIGGER IF EXISTS notify_admins_on_document_upload ON organization_documents;
CREATE TRIGGER notify_admins_on_document_upload
  AFTER INSERT ON organization_documents
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_admins_new_document();