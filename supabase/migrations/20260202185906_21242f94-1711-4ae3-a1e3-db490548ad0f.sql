-- Add cancellation fields to shipments table
ALTER TABLE public.shipments 
ADD COLUMN IF NOT EXISTS cancelled_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS cancelled_by UUID REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS cancellation_reason TEXT;

-- Create index for cancelled shipments queries
CREATE INDEX IF NOT EXISTS idx_shipments_cancelled_at ON public.shipments(cancelled_at) WHERE cancelled_at IS NOT NULL;