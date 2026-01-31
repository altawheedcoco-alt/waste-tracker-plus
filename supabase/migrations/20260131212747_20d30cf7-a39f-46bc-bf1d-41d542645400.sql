-- Create report_requests table for tracking document requests
CREATE TABLE public.report_requests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  request_type TEXT NOT NULL, -- 'aggregate_report', 'recycling_certificate', 'shipment_report', 'waste_register', 'operational_plan'
  request_title TEXT NOT NULL,
  requester_user_id UUID NOT NULL,
  requester_organization_id UUID REFERENCES public.organizations(id),
  target_resource_id TEXT, -- shipment_id or report_id
  target_resource_data JSONB DEFAULT '{}', -- Additional data like filters, date ranges
  status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'approved', 'rejected'
  auto_approve_at TIMESTAMPTZ NOT NULL DEFAULT (now() + INTERVAL '5 minutes'),
  approved_at TIMESTAMPTZ,
  approved_by UUID,
  admin_notes TEXT,
  pdf_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.report_requests ENABLE ROW LEVEL SECURITY;

-- Allow users to view their own requests
CREATE POLICY "Users can view their own report requests"
ON public.report_requests
FOR SELECT
USING (requester_user_id = auth.uid());

-- Allow admins to view all requests
CREATE POLICY "Admins can view all report requests"
ON public.report_requests
FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));

-- Allow users to create their own requests
CREATE POLICY "Users can create their own report requests"
ON public.report_requests
FOR INSERT
WITH CHECK (requester_user_id = auth.uid());

-- Allow admins to update any request
CREATE POLICY "Admins can update report requests"
ON public.report_requests
FOR UPDATE
USING (public.has_role(auth.uid(), 'admin'));

-- Allow system to update for auto-approval (via service role)
CREATE POLICY "Users can update their pending requests"
ON public.report_requests
FOR UPDATE
USING (requester_user_id = auth.uid() AND status = 'pending');

-- Create trigger for updated_at
CREATE TRIGGER update_report_requests_updated_at
BEFORE UPDATE ON public.report_requests
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create function to notify admin when new report request is created
CREATE OR REPLACE FUNCTION public.notify_admin_report_request()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_admin_user_ids UUID[];
  v_user_id UUID;
  v_org_name TEXT;
  v_requester_name TEXT;
BEGIN
  -- Get organization name
  IF NEW.requester_organization_id IS NOT NULL THEN
    SELECT name INTO v_org_name FROM organizations WHERE id = NEW.requester_organization_id;
  END IF;

  -- Get requester name
  SELECT full_name INTO v_requester_name FROM profiles WHERE user_id = NEW.requester_user_id;

  -- Get all admin user IDs
  SELECT ARRAY_AGG(ur.user_id) INTO v_admin_user_ids
  FROM user_roles ur
  WHERE ur.role = 'admin';

  -- Send notifications to all admins
  IF v_admin_user_ids IS NOT NULL THEN
    FOREACH v_user_id IN ARRAY v_admin_user_ids
    LOOP
      INSERT INTO notifications (user_id, title, message, type, request_id)
      VALUES (
        v_user_id,
        '📄 طلب مستند جديد',
        'طلب ' || COALESCE(v_requester_name, 'مستخدم') || ' من ' || COALESCE(v_org_name, 'جهة') || ': ' || NEW.request_title,
        'report_request',
        NEW.id
      );
    END LOOP;
  END IF;

  RETURN NEW;
END;
$$;

-- Create trigger for admin notification
CREATE TRIGGER notify_admin_on_report_request
AFTER INSERT ON public.report_requests
FOR EACH ROW
EXECUTE FUNCTION public.notify_admin_report_request();

-- Create function to notify user when request is approved
CREATE OR REPLACE FUNCTION public.notify_user_report_approved()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only trigger when status changes to approved
  IF OLD.status != 'approved' AND NEW.status = 'approved' THEN
    INSERT INTO notifications (user_id, title, message, type, request_id, pdf_url)
    VALUES (
      NEW.requester_user_id,
      '✅ المستند جاهز للطباعة',
      'تمت الموافقة على طلبك: ' || NEW.request_title || '. يمكنك الآن طباعة وتحميل المستند.',
      'report_approved',
      NEW.id,
      NEW.pdf_url
    );
  END IF;

  RETURN NEW;
END;
$$;

-- Create trigger for user notification on approval
CREATE TRIGGER notify_user_on_report_approval
AFTER UPDATE ON public.report_requests
FOR EACH ROW
EXECUTE FUNCTION public.notify_user_report_approved();

-- Enable realtime for report_requests
ALTER PUBLICATION supabase_realtime ADD TABLE public.report_requests;