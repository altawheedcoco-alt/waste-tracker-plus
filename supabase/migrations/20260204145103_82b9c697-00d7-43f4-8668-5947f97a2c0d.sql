-- Create enum for API scopes
CREATE TYPE public.api_scope AS ENUM (
  'shipments:read',
  'shipments:write',
  'accounts:read',
  'accounts:write',
  'reports:read',
  'organizations:read',
  'all'
);

-- Create API keys table
CREATE TABLE public.api_keys (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  key_hash TEXT NOT NULL,
  key_prefix TEXT NOT NULL,
  scopes api_scope[] NOT NULL DEFAULT ARRAY['shipments:read'::api_scope],
  is_active BOOLEAN NOT NULL DEFAULT true,
  last_used_at TIMESTAMP WITH TIME ZONE,
  expires_at TIMESTAMP WITH TIME ZONE,
  rate_limit_per_minute INTEGER NOT NULL DEFAULT 60,
  created_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create API request logs table for rate limiting and analytics
CREATE TABLE public.api_request_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  api_key_id UUID NOT NULL REFERENCES public.api_keys(id) ON DELETE CASCADE,
  endpoint TEXT NOT NULL,
  method TEXT NOT NULL,
  status_code INTEGER NOT NULL,
  response_time_ms INTEGER,
  ip_address TEXT,
  user_agent TEXT,
  request_body JSONB,
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create index for rate limiting queries
CREATE INDEX idx_api_request_logs_rate_limit 
ON public.api_request_logs (api_key_id, created_at DESC);

-- Create index for analytics
CREATE INDEX idx_api_request_logs_analytics 
ON public.api_request_logs (api_key_id, endpoint, created_at DESC);

-- Enable RLS
ALTER TABLE public.api_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.api_request_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies for api_keys
CREATE POLICY "Organizations can view their own API keys"
ON public.api_keys
FOR SELECT
USING (organization_id IN (
  SELECT organization_id FROM public.profiles WHERE user_id = auth.uid()
));

CREATE POLICY "Organizations can create their own API keys"
ON public.api_keys
FOR INSERT
WITH CHECK (organization_id IN (
  SELECT organization_id FROM public.profiles WHERE user_id = auth.uid()
));

CREATE POLICY "Organizations can update their own API keys"
ON public.api_keys
FOR UPDATE
USING (organization_id IN (
  SELECT organization_id FROM public.profiles WHERE user_id = auth.uid()
));

CREATE POLICY "Organizations can delete their own API keys"
ON public.api_keys
FOR DELETE
USING (organization_id IN (
  SELECT organization_id FROM public.profiles WHERE user_id = auth.uid()
));

-- RLS Policies for api_request_logs
CREATE POLICY "Organizations can view their API request logs"
ON public.api_request_logs
FOR SELECT
USING (api_key_id IN (
  SELECT id FROM public.api_keys WHERE organization_id IN (
    SELECT organization_id FROM public.profiles WHERE user_id = auth.uid()
  )
));

-- Function to check rate limit
CREATE OR REPLACE FUNCTION public.check_api_rate_limit(p_api_key_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_rate_limit INTEGER;
  v_request_count INTEGER;
BEGIN
  -- Get rate limit for the API key
  SELECT rate_limit_per_minute INTO v_rate_limit
  FROM public.api_keys
  WHERE id = p_api_key_id AND is_active = true;
  
  IF v_rate_limit IS NULL THEN
    RETURN false;
  END IF;
  
  -- Count requests in the last minute
  SELECT COUNT(*) INTO v_request_count
  FROM public.api_request_logs
  WHERE api_key_id = p_api_key_id
    AND created_at > now() - INTERVAL '1 minute';
  
  RETURN v_request_count < v_rate_limit;
END;
$$;

-- Function to validate API key and return organization info
CREATE OR REPLACE FUNCTION public.validate_api_key(p_key_hash TEXT)
RETURNS TABLE(
  api_key_id UUID,
  organization_id UUID,
  scopes api_scope[],
  rate_limit INTEGER
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    ak.id,
    ak.organization_id,
    ak.scopes,
    ak.rate_limit_per_minute
  FROM public.api_keys ak
  WHERE ak.key_hash = p_key_hash
    AND ak.is_active = true
    AND (ak.expires_at IS NULL OR ak.expires_at > now());
END;
$$;

-- Trigger for updated_at
CREATE TRIGGER update_api_keys_updated_at
BEFORE UPDATE ON public.api_keys
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();