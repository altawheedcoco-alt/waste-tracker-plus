
-- Create approval requests table for centralized request management
CREATE TABLE public.approval_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  request_type TEXT NOT NULL, -- 'company_registration', 'driver_registration', 'document_upload', 'profile_update', 'shipment_create', 'data_change', 'waste_register'
  request_title TEXT NOT NULL,
  request_description TEXT,
  status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'approved', 'rejected'
  priority TEXT DEFAULT 'normal', -- 'low', 'normal', 'high', 'urgent'
  requester_user_id UUID,
  requester_organization_id UUID REFERENCES public.organizations(id),
  target_resource_type TEXT, -- 'organization', 'driver', 'shipment', 'document', 'profile'
  target_resource_id UUID,
  request_data JSONB DEFAULT '{}',
  admin_notes TEXT,
  reviewed_by UUID,
  reviewed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.approval_requests ENABLE ROW LEVEL SECURITY;

-- Admins can view all requests
CREATE POLICY "Admins can view all requests"
ON public.approval_requests FOR SELECT
USING (has_role(auth.uid(), 'admin'));

-- Admins can update requests (approve/reject)
CREATE POLICY "Admins can update requests"
ON public.approval_requests FOR UPDATE
USING (has_role(auth.uid(), 'admin'));

-- Admins can delete requests
CREATE POLICY "Admins can delete requests"
ON public.approval_requests FOR DELETE
USING (has_role(auth.uid(), 'admin'));

-- Users can insert requests
CREATE POLICY "Authenticated users can create requests"
ON public.approval_requests FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL);

-- Users can view their own requests
CREATE POLICY "Users can view own requests"
ON public.approval_requests FOR SELECT
USING (requester_user_id = auth.uid());

-- Company admins can view their organization requests
CREATE POLICY "Company admins can view org requests"
ON public.approval_requests FOR SELECT
USING (
  requester_organization_id = get_user_org_id_safe(auth.uid()) 
  AND has_role(auth.uid(), 'company_admin')
);

-- Create trigger for updated_at
CREATE TRIGGER update_approval_requests_updated_at
BEFORE UPDATE ON public.approval_requests
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create function to notify admins of new requests
CREATE OR REPLACE FUNCTION public.notify_admins_new_request()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_admin_user_ids UUID[];
  v_user_id UUID;
  v_org_name TEXT;
  v_title TEXT;
  v_message TEXT;
BEGIN
  -- Get organization name if available
  IF NEW.requester_organization_id IS NOT NULL THEN
    SELECT name INTO v_org_name FROM organizations WHERE id = NEW.requester_organization_id;
  END IF;

  v_title := 'طلب جديد: ' || NEW.request_title;
  v_message := COALESCE(NEW.request_description, 'طلب جديد يحتاج للمراجعة');
  
  IF v_org_name IS NOT NULL THEN
    v_message := v_message || ' - من: ' || v_org_name;
  END IF;

  -- Get all admin user IDs
  SELECT ARRAY_AGG(ur.user_id) INTO v_admin_user_ids
  FROM user_roles ur
  WHERE ur.role = 'admin';

  -- Send notifications to all admins
  IF v_admin_user_ids IS NOT NULL THEN
    FOREACH v_user_id IN ARRAY v_admin_user_ids
    LOOP
      INSERT INTO notifications (user_id, title, message, type)
      VALUES (v_user_id, v_title, v_message, 'approval_request');
    END LOOP;
  END IF;

  RETURN NEW;
END;
$$;

-- Create trigger for new request notifications
CREATE TRIGGER notify_admins_on_new_request
AFTER INSERT ON public.approval_requests
FOR EACH ROW
EXECUTE FUNCTION public.notify_admins_new_request();

-- Add index for faster queries
CREATE INDEX idx_approval_requests_status ON public.approval_requests(status);
CREATE INDEX idx_approval_requests_type ON public.approval_requests(request_type);
CREATE INDEX idx_approval_requests_created ON public.approval_requests(created_at DESC);
