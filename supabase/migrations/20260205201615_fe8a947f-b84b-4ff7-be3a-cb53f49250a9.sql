-- Add sender_name column to organization_shipment_links table
ALTER TABLE public.organization_shipment_links 
ADD COLUMN IF NOT EXISTS sender_name TEXT;

-- Add comment to explain the column
COMMENT ON COLUMN public.organization_shipment_links.sender_name IS 'Name of the person designated by the transporter to submit shipment data via this link';