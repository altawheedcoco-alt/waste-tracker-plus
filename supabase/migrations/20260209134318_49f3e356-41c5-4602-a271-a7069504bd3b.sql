
-- Table for user personal PIN codes
CREATE TABLE public.user_pin_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  pin_hash TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  failed_attempts INTEGER DEFAULT 0,
  locked_until TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id)
);

-- Recovery methods for PIN
CREATE TABLE public.pin_recovery_methods (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_pin_id UUID NOT NULL REFERENCES public.user_pin_codes(id) ON DELETE CASCADE,
  recovery_type TEXT NOT NULL CHECK (recovery_type IN ('email', 'phone', 'security_question', 'backup_code', 'admin_reset', 'otp')),
  recovery_data JSONB DEFAULT '{}',
  is_enabled BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_pin_id, recovery_type)
);

-- Backup codes for PIN
CREATE TABLE public.pin_backup_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_pin_id UUID NOT NULL REFERENCES public.user_pin_codes(id) ON DELETE CASCADE,
  code_hash TEXT NOT NULL,
  is_used BOOLEAN DEFAULT false,
  used_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.user_pin_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pin_recovery_methods ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pin_backup_codes ENABLE ROW LEVEL SECURITY;

-- RLS: users can only access their own PIN
CREATE POLICY "Users can view own pin" ON public.user_pin_codes FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Users can insert own pin" ON public.user_pin_codes FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can update own pin" ON public.user_pin_codes FOR UPDATE TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Users can delete own pin" ON public.user_pin_codes FOR DELETE TO authenticated USING (user_id = auth.uid());

-- RLS: recovery methods
CREATE POLICY "Users can view own pin recovery" ON public.pin_recovery_methods FOR SELECT TO authenticated
USING (user_pin_id IN (SELECT id FROM public.user_pin_codes WHERE user_id = auth.uid()));
CREATE POLICY "Users can manage own pin recovery" ON public.pin_recovery_methods FOR ALL TO authenticated
USING (user_pin_id IN (SELECT id FROM public.user_pin_codes WHERE user_id = auth.uid()));

-- RLS: backup codes
CREATE POLICY "Users can view own pin backup codes" ON public.pin_backup_codes FOR SELECT TO authenticated
USING (user_pin_id IN (SELECT id FROM public.user_pin_codes WHERE user_id = auth.uid()));
CREATE POLICY "Users can manage own pin backup codes" ON public.pin_backup_codes FOR ALL TO authenticated
USING (user_pin_id IN (SELECT id FROM public.user_pin_codes WHERE user_id = auth.uid()));

-- Triggers
CREATE TRIGGER update_user_pin_codes_updated_at BEFORE UPDATE ON public.user_pin_codes FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_pin_recovery_methods_updated_at BEFORE UPDATE ON public.pin_recovery_methods FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
