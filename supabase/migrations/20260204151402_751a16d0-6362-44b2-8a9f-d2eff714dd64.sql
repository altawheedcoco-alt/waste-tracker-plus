-- Create table for 2FA settings
CREATE TABLE public.user_two_factor_auth (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  is_enabled BOOLEAN NOT NULL DEFAULT false,
  secret_encrypted TEXT, -- Encrypted TOTP secret
  backup_codes_encrypted TEXT, -- Encrypted backup codes as JSON array
  verified_at TIMESTAMP WITH TIME ZONE,
  last_used_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

-- Create table for 2FA verification attempts (for rate limiting)
CREATE TABLE public.two_factor_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  attempt_type TEXT NOT NULL CHECK (attempt_type IN ('totp', 'backup_code', 'setup')),
  is_successful BOOLEAN NOT NULL DEFAULT false,
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create index for rate limiting queries
CREATE INDEX idx_two_factor_attempts_user_time 
ON public.two_factor_attempts(user_id, created_at DESC);

-- Create index for user lookup
CREATE INDEX idx_user_two_factor_auth_user_id 
ON public.user_two_factor_auth(user_id);

-- Enable RLS
ALTER TABLE public.user_two_factor_auth ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.two_factor_attempts ENABLE ROW LEVEL SECURITY;

-- RLS policies for user_two_factor_auth
CREATE POLICY "Users can view their own 2FA settings"
ON public.user_two_factor_auth
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own 2FA settings"
ON public.user_two_factor_auth
FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own 2FA settings"
ON public.user_two_factor_auth
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- RLS policies for two_factor_attempts (read-only for users)
CREATE POLICY "Users can view their own 2FA attempts"
ON public.two_factor_attempts
FOR SELECT
USING (auth.uid() = user_id);

-- Function to check if user has 2FA enabled
CREATE OR REPLACE FUNCTION public.has_two_factor_enabled(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(
    (SELECT is_enabled FROM public.user_two_factor_auth WHERE user_id = _user_id),
    false
  );
$$;

-- Function to count recent failed attempts (for rate limiting)
CREATE OR REPLACE FUNCTION public.count_recent_2fa_attempts(_user_id UUID, _minutes INTEGER DEFAULT 15)
RETURNS INTEGER
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COUNT(*)::INTEGER
  FROM public.two_factor_attempts
  WHERE user_id = _user_id
    AND is_successful = false
    AND created_at > now() - make_interval(mins => _minutes);
$$;

-- Trigger to update updated_at
CREATE TRIGGER update_user_two_factor_auth_updated_at
BEFORE UPDATE ON public.user_two_factor_auth
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();