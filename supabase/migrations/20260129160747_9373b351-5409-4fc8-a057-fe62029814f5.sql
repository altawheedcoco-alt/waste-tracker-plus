-- Add request_id column to notifications table for linking to approval requests
ALTER TABLE public.notifications 
ADD COLUMN IF NOT EXISTS request_id uuid REFERENCES public.approval_requests(id) ON DELETE SET NULL;

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_notifications_request_id ON public.notifications(request_id);

-- Add comment
COMMENT ON COLUMN public.notifications.request_id IS 'Links notification to an approval request for direct access';