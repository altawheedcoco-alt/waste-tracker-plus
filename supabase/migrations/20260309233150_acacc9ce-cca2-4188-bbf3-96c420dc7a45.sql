
-- Add operator_type to organization_positions
ALTER TABLE public.organization_positions 
  ADD COLUMN IF NOT EXISTS operator_type TEXT NOT NULL DEFAULT 'human' CHECK (operator_type IN ('human', 'ai')),
  ADD COLUMN IF NOT EXISTS auto_email TEXT,
  ADD COLUMN IF NOT EXISTS holder_name TEXT,
  ADD COLUMN IF NOT EXISTS holder_phone TEXT,
  ADD COLUMN IF NOT EXISTS holder_national_id TEXT;
