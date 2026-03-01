-- Table to track executed actions and prevent duplicates
CREATE TABLE public.action_execution_log (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  action_type TEXT NOT NULL,
  resource_type TEXT NOT NULL,
  resource_id TEXT NOT NULL,
  action_value TEXT,
  organization_id UUID,
  executed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  metadata JSONB DEFAULT '{}'
);

-- Unique constraint: same user can't perform same action+value on same resource
CREATE UNIQUE INDEX idx_action_execution_unique 
  ON public.action_execution_log (user_id, action_type, resource_type, resource_id, COALESCE(action_value, '__null__'));

-- Index for fast lookups
CREATE INDEX idx_action_execution_lookup 
  ON public.action_execution_log (resource_type, resource_id, action_type);

CREATE INDEX idx_action_execution_user 
  ON public.action_execution_log (user_id, executed_at DESC);

-- Enable RLS
ALTER TABLE public.action_execution_log ENABLE ROW LEVEL SECURITY;

-- Users can read their own action logs
CREATE POLICY "Users can view own action logs"
  ON public.action_execution_log FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert their own action logs
CREATE POLICY "Users can insert own action logs"
  ON public.action_execution_log FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Enable realtime for instant UI updates
ALTER PUBLICATION supabase_realtime ADD TABLE public.action_execution_log;

-- Helper function to check if action was already executed
CREATE OR REPLACE FUNCTION public.check_action_executed(
  p_user_id UUID,
  p_action_type TEXT,
  p_resource_type TEXT,
  p_resource_id TEXT,
  p_action_value TEXT DEFAULT NULL
) RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.action_execution_log
    WHERE user_id = p_user_id
      AND action_type = p_action_type
      AND resource_type = p_resource_type
      AND resource_id = p_resource_id
      AND COALESCE(action_value, '__null__') = COALESCE(p_action_value, '__null__')
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Function to record action execution (returns false if already exists)
CREATE OR REPLACE FUNCTION public.record_action_execution(
  p_user_id UUID,
  p_action_type TEXT,
  p_resource_type TEXT,
  p_resource_id TEXT,
  p_action_value TEXT DEFAULT NULL,
  p_organization_id UUID DEFAULT NULL,
  p_metadata JSONB DEFAULT '{}'
) RETURNS BOOLEAN AS $$
BEGIN
  INSERT INTO public.action_execution_log (
    user_id, action_type, resource_type, resource_id, 
    action_value, organization_id, metadata
  ) VALUES (
    p_user_id, p_action_type, p_resource_type, p_resource_id,
    p_action_value, p_organization_id, p_metadata
  );
  RETURN true;
EXCEPTION WHEN unique_violation THEN
  RETURN false;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;