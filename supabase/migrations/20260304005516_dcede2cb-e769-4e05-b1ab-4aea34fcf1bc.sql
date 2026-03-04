
-- Scheduled messages for future delivery
CREATE TABLE IF NOT EXISTS public.whatsapp_scheduled_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  scheduled_at TIMESTAMPTZ NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  message_text TEXT NOT NULL,
  template_id UUID REFERENCES public.whatsapp_templates(id),
  template_params JSONB,
  recipients JSONB NOT NULL DEFAULT '[]',
  recipient_type TEXT DEFAULT 'users',
  interactive_buttons JSONB,
  attachment_url TEXT,
  instance_id TEXT,
  created_by UUID,
  organization_id UUID,
  sent_at TIMESTAMPTZ,
  sent_count INT DEFAULT 0,
  failed_count INT DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.whatsapp_scheduled_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage scheduled messages"
ON public.whatsapp_scheduled_messages FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Quick action presets
CREATE TABLE IF NOT EXISTS public.whatsapp_quick_actions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  action_type TEXT NOT NULL DEFAULT 'broadcast',
  target_filter JSONB DEFAULT '{}',
  template_id UUID REFERENCES public.whatsapp_templates(id),
  message_text TEXT,
  interactive_buttons JSONB,
  is_active BOOLEAN DEFAULT true,
  usage_count INT DEFAULT 0,
  last_used_at TIMESTAMPTZ,
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.whatsapp_quick_actions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage quick actions"
ON public.whatsapp_quick_actions FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));
