-- Add new waste type enum values for liquid non-hazardous, municipal, and hazardous liquid categories
ALTER TYPE public.waste_type ADD VALUE IF NOT EXISTS 'liquid_non_hazardous';
ALTER TYPE public.waste_type ADD VALUE IF NOT EXISTS 'municipal';
ALTER TYPE public.waste_type ADD VALUE IF NOT EXISTS 'hazardous_liquid';
ALTER TYPE public.waste_type ADD VALUE IF NOT EXISTS 'industrial';