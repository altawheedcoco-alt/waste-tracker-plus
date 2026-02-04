-- Drop existing function if exists
DROP FUNCTION IF EXISTS public.check_api_rate_limit(UUID);

-- Create enhanced rate limiting function with sliding window
CREATE OR REPLACE FUNCTION public.check_api_rate_limit(
  p_api_key_id UUID
)
RETURNS TABLE (
  allowed BOOLEAN,
  remaining INTEGER,
  reset_at TIMESTAMPTZ,
  limit_per_minute INTEGER
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_rate_limit INTEGER;
  v_request_count INTEGER;
  v_window_start TIMESTAMPTZ;
  v_reset_at TIMESTAMPTZ;
BEGIN
  -- Get the rate limit for this API key
  SELECT rate_limit_per_minute INTO v_rate_limit
  FROM api_keys
  WHERE id = p_api_key_id AND is_active = true;
  
  IF v_rate_limit IS NULL THEN
    RETURN QUERY SELECT false::BOOLEAN, 0::INTEGER, now()::TIMESTAMPTZ, 0::INTEGER;
    RETURN;
  END IF;
  
  -- Use sliding window: count requests in the last minute
  v_window_start := now() - INTERVAL '1 minute';
  v_reset_at := now() + INTERVAL '1 minute';
  
  SELECT COUNT(*)::INTEGER INTO v_request_count
  FROM api_request_logs
  WHERE api_key_id = p_api_key_id
    AND created_at > v_window_start;
  
  RETURN QUERY SELECT 
    (v_request_count < v_rate_limit)::BOOLEAN,
    GREATEST(0, v_rate_limit - v_request_count)::INTEGER,
    v_reset_at,
    v_rate_limit;
END;
$$;

-- Create function to get rate limit info without checking
CREATE OR REPLACE FUNCTION public.get_rate_limit_info(
  p_api_key_id UUID
)
RETURNS TABLE (
  current_usage INTEGER,
  limit_per_minute INTEGER,
  window_start TIMESTAMPTZ,
  reset_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_rate_limit INTEGER;
  v_request_count INTEGER;
  v_window_start TIMESTAMPTZ;
BEGIN
  v_window_start := now() - INTERVAL '1 minute';
  
  SELECT rate_limit_per_minute INTO v_rate_limit
  FROM api_keys
  WHERE id = p_api_key_id;
  
  SELECT COUNT(*)::INTEGER INTO v_request_count
  FROM api_request_logs
  WHERE api_key_id = p_api_key_id
    AND created_at > v_window_start;
  
  RETURN QUERY SELECT 
    v_request_count,
    COALESCE(v_rate_limit, 60),
    v_window_start,
    now() + INTERVAL '1 minute';
END;
$$;

-- Create index for faster rate limit lookups
CREATE INDEX IF NOT EXISTS idx_api_request_logs_rate_limit 
  ON api_request_logs(api_key_id, created_at DESC);

-- Create function to clean old request logs (older than 7 days)
CREATE OR REPLACE FUNCTION public.cleanup_old_api_request_logs()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM api_request_logs
  WHERE created_at < now() - INTERVAL '7 days';
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$;