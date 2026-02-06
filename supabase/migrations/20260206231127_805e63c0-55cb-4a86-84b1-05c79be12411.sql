-- Create biometric credentials table
CREATE TABLE public.biometric_credentials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  credential_id TEXT NOT NULL UNIQUE,
  public_key TEXT NOT NULL,
  device_name TEXT NOT NULL DEFAULT 'Unknown Device',
  biometric_type TEXT NOT NULL DEFAULT 'unknown' CHECK (biometric_type IN ('fingerprint', 'face', 'iris', 'unknown')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_used_at TIMESTAMPTZ
);

-- Create biometric verifications log table
CREATE TABLE public.biometric_verifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  credential_id UUID REFERENCES public.biometric_credentials(id) ON DELETE SET NULL,
  purpose TEXT NOT NULL,
  success BOOLEAN NOT NULL DEFAULT false,
  error_message TEXT,
  device_info TEXT,
  ip_address INET,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.biometric_credentials ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.biometric_verifications ENABLE ROW LEVEL SECURITY;

-- RLS policies for biometric_credentials
CREATE POLICY "Users can view their own biometric credentials"
  ON public.biometric_credentials FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own biometric credentials"
  ON public.biometric_credentials FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own biometric credentials"
  ON public.biometric_credentials FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own biometric credentials"
  ON public.biometric_credentials FOR DELETE
  USING (auth.uid() = user_id);

-- RLS policies for biometric_verifications
CREATE POLICY "Users can view their own biometric verifications"
  ON public.biometric_verifications FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own biometric verifications"
  ON public.biometric_verifications FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Admins can view all verifications
CREATE POLICY "Admins can view all biometric verifications"
  ON public.biometric_verifications FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

-- Create indexes
CREATE INDEX idx_biometric_credentials_user_id ON public.biometric_credentials(user_id);
CREATE INDEX idx_biometric_verifications_user_id ON public.biometric_verifications(user_id);
CREATE INDEX idx_biometric_verifications_created_at ON public.biometric_verifications(created_at DESC);