-- Create organization approval logs table
CREATE TABLE public.organization_approval_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  action TEXT NOT NULL CHECK (action IN ('approved', 'rejected')),
  reason TEXT,
  performed_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.organization_approval_logs ENABLE ROW LEVEL SECURITY;

-- Only admins can view and insert logs
CREATE POLICY "Admins can view approval logs"
ON public.organization_approval_logs
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can insert approval logs"
ON public.organization_approval_logs
FOR INSERT
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Add index for faster queries
CREATE INDEX idx_approval_logs_organization ON public.organization_approval_logs(organization_id);
CREATE INDEX idx_approval_logs_created_at ON public.organization_approval_logs(created_at DESC);