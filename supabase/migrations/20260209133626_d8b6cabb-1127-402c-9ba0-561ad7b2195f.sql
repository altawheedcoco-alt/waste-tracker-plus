
-- Table for page password protection
CREATE TABLE public.page_passwords (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  page_path TEXT NOT NULL,
  page_name TEXT NOT NULL,
  password_hash TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(organization_id, page_path)
);

-- Table for recovery methods configuration
CREATE TABLE public.page_password_recovery (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  page_password_id UUID NOT NULL REFERENCES public.page_passwords(id) ON DELETE CASCADE,
  recovery_type TEXT NOT NULL CHECK (recovery_type IN ('email', 'phone', 'security_question', 'backup_code', 'admin_reset', 'otp')),
  recovery_data JSONB DEFAULT '{}',
  is_enabled BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(page_password_id, recovery_type)
);

-- Table for backup codes
CREATE TABLE public.page_password_backup_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  page_password_id UUID NOT NULL REFERENCES public.page_passwords(id) ON DELETE CASCADE,
  code_hash TEXT NOT NULL,
  is_used BOOLEAN DEFAULT false,
  used_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.page_passwords ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.page_password_recovery ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.page_password_backup_codes ENABLE ROW LEVEL SECURITY;

-- RLS policies for page_passwords
CREATE POLICY "Users can view page passwords for their organization"
ON public.page_passwords FOR SELECT TO authenticated
USING (
  organization_id IN (
    SELECT organization_id FROM public.profiles WHERE user_id = auth.uid()
  )
  OR public.has_role(auth.uid(), 'admin')
);

CREATE POLICY "Org managers can manage page passwords"
ON public.page_passwords FOR INSERT TO authenticated
WITH CHECK (
  organization_id IN (
    SELECT organization_id FROM public.profiles WHERE user_id = auth.uid()
  )
  OR public.has_role(auth.uid(), 'admin')
);

CREATE POLICY "Org managers can update page passwords"
ON public.page_passwords FOR UPDATE TO authenticated
USING (
  organization_id IN (
    SELECT organization_id FROM public.profiles WHERE user_id = auth.uid()
  )
  OR public.has_role(auth.uid(), 'admin')
);

CREATE POLICY "Org managers can delete page passwords"
ON public.page_passwords FOR DELETE TO authenticated
USING (
  organization_id IN (
    SELECT organization_id FROM public.profiles WHERE user_id = auth.uid()
  )
  OR public.has_role(auth.uid(), 'admin')
);

-- RLS policies for recovery methods
CREATE POLICY "Users can view recovery for their org"
ON public.page_password_recovery FOR SELECT TO authenticated
USING (
  page_password_id IN (
    SELECT id FROM public.page_passwords WHERE organization_id IN (
      SELECT organization_id FROM public.profiles WHERE user_id = auth.uid()
    )
  )
  OR public.has_role(auth.uid(), 'admin')
);

CREATE POLICY "Org managers can manage recovery"
ON public.page_password_recovery FOR ALL TO authenticated
USING (
  page_password_id IN (
    SELECT id FROM public.page_passwords WHERE organization_id IN (
      SELECT organization_id FROM public.profiles WHERE user_id = auth.uid()
    )
  )
  OR public.has_role(auth.uid(), 'admin')
);

-- RLS policies for backup codes
CREATE POLICY "Users can view backup codes for their org"
ON public.page_password_backup_codes FOR SELECT TO authenticated
USING (
  page_password_id IN (
    SELECT id FROM public.page_passwords WHERE organization_id IN (
      SELECT organization_id FROM public.profiles WHERE user_id = auth.uid()
    )
  )
  OR public.has_role(auth.uid(), 'admin')
);

CREATE POLICY "Org managers can manage backup codes"
ON public.page_password_backup_codes FOR ALL TO authenticated
USING (
  page_password_id IN (
    SELECT id FROM public.page_passwords WHERE organization_id IN (
      SELECT organization_id FROM public.profiles WHERE user_id = auth.uid()
    )
  )
  OR public.has_role(auth.uid(), 'admin')
);

-- Trigger for updated_at
CREATE TRIGGER update_page_passwords_updated_at
BEFORE UPDATE ON public.page_passwords
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_page_password_recovery_updated_at
BEFORE UPDATE ON public.page_password_recovery
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
