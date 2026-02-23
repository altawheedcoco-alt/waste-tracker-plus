-- Add transport_office to organization_type enum if not exists
ALTER TYPE public.organization_type ADD VALUE IF NOT EXISTS 'transport_office';