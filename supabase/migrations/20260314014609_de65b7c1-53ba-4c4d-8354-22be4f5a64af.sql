
ALTER TABLE public.organization_positions 
ADD COLUMN IF NOT EXISTS dashboard_mode TEXT NOT NULL DEFAULT 'workspace' 
CHECK (dashboard_mode IN ('management', 'workspace'));

COMMENT ON COLUMN public.organization_positions.dashboard_mode IS 'Controls whether this member sees full org dashboard (management) or personal workspace (workspace)';
