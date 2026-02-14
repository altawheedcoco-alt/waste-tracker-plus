-- Add transporter approval workflow columns to shipment_receipts
ALTER TABLE public.shipment_receipts 
ADD COLUMN IF NOT EXISTS transporter_approval_status text DEFAULT 'pending' CHECK (transporter_approval_status IN ('pending', 'approved', 'rejected', 'auto_approved')),
ADD COLUMN IF NOT EXISTS transporter_approval_deadline timestamptz,
ADD COLUMN IF NOT EXISTS transporter_approved_at timestamptz,
ADD COLUMN IF NOT EXISTS transporter_rejection_reason text,
ADD COLUMN IF NOT EXISTS transporter_stamp_url text,
ADD COLUMN IF NOT EXISTS transporter_signature_url text;

-- Create index for quick lookup of pending approvals
CREATE INDEX IF NOT EXISTS idx_shipment_receipts_transporter_approval 
ON public.shipment_receipts (transporter_approval_status, transporter_approval_deadline) 
WHERE transporter_approval_status = 'pending';

-- Function to auto-approve expired delivery certificates
CREATE OR REPLACE FUNCTION public.auto_approve_delivery_certificates()
RETURNS void
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  UPDATE shipment_receipts
  SET 
    transporter_approval_status = 'auto_approved',
    transporter_approved_at = now(),
    status = 'confirmed',
    notes = COALESCE(notes, '') || ' | تمت الموافقة تلقائياً بانقضاء المهلة'
  WHERE 
    transporter_approval_status = 'pending'
    AND transporter_approval_deadline IS NOT NULL
    AND transporter_approval_deadline <= now()
    AND generator_id IS NOT NULL;
END;
$$;