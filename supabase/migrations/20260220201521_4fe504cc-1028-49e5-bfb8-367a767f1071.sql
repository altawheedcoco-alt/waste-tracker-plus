
-- Step 1: Add regulator to enum only
ALTER TYPE public.organization_type ADD VALUE IF NOT EXISTS 'regulator';
