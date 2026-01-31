-- Add pdf_url column to notifications table to store attached PDF files
ALTER TABLE public.notifications 
ADD COLUMN IF NOT EXISTS pdf_url text NULL;

-- Add comment for documentation
COMMENT ON COLUMN public.notifications.pdf_url IS 'URL of attached PDF file (e.g., recycling certificate)';

-- Also add pdf_url to recycling_reports to store the generated PDF
ALTER TABLE public.recycling_reports 
ADD COLUMN IF NOT EXISTS pdf_url text NULL;

COMMENT ON COLUMN public.recycling_reports.pdf_url IS 'URL of the generated PDF report';