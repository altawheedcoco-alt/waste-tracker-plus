-- Create activity logs table for comprehensive audit trail
CREATE TABLE public.activity_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  organization_id UUID REFERENCES public.organizations(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  action_type TEXT NOT NULL, -- login, logout, create, update, delete, view, etc.
  resource_type TEXT, -- shipment, document, profile, etc.
  resource_id UUID,
  details JSONB DEFAULT '{}',
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create indexes for efficient queries
CREATE INDEX idx_activity_logs_user_id ON public.activity_logs(user_id);
CREATE INDEX idx_activity_logs_organization_id ON public.activity_logs(organization_id);
CREATE INDEX idx_activity_logs_action_type ON public.activity_logs(action_type);
CREATE INDEX idx_activity_logs_created_at ON public.activity_logs(created_at DESC);
CREATE INDEX idx_activity_logs_resource ON public.activity_logs(resource_type, resource_id);

-- Enable RLS
ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;

-- Only admins can view activity logs
CREATE POLICY "Admins can view all activity logs"
ON public.activity_logs
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

-- System can insert activity logs (using service role or authenticated users for their own actions)
CREATE POLICY "Users can insert own activity logs"
ON public.activity_logs
FOR INSERT
WITH CHECK (user_id = auth.uid() OR has_role(auth.uid(), 'admin'::app_role));

-- Admins can insert any activity log
CREATE POLICY "Admins can insert activity logs"
ON public.activity_logs
FOR INSERT
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Create password change history table (stores only metadata, NOT actual passwords)
CREATE TABLE public.password_change_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  changed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  changed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL, -- null if self-changed
  change_type TEXT NOT NULL DEFAULT 'self_change', -- self_change, admin_reset
  ip_address TEXT
);

-- Enable RLS
ALTER TABLE public.password_change_logs ENABLE ROW LEVEL SECURITY;

-- Only admins can view password change logs
CREATE POLICY "Admins can view password change logs"
ON public.password_change_logs
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

-- Users can insert their own password change log
CREATE POLICY "Users can insert own password change log"
ON public.password_change_logs
FOR INSERT
WITH CHECK (user_id = auth.uid());

-- Admins can insert password change logs
CREATE POLICY "Admins can insert password change logs"
ON public.password_change_logs
FOR INSERT
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));