-- Add new organization types to the enum
ALTER TYPE public.organization_type ADD VALUE IF NOT EXISTS 'consultant';
ALTER TYPE public.organization_type ADD VALUE IF NOT EXISTS 'consulting_office';
ALTER TYPE public.organization_type ADD VALUE IF NOT EXISTS 'iso_body';