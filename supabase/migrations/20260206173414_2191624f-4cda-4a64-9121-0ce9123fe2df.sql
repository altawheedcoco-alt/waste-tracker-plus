-- Add recipient name field to deposit links
ALTER TABLE public.organization_deposit_links
ADD COLUMN IF NOT EXISTS preset_recipient_name TEXT;