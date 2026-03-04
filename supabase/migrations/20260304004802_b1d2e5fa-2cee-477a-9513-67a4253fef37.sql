
-- Broadcast groups for admin bulk messaging
CREATE TABLE IF NOT EXISTS public.whatsapp_broadcast_groups (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  filter_criteria JSONB DEFAULT '{}',
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.whatsapp_broadcast_groups ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage broadcast groups"
ON public.whatsapp_broadcast_groups FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Message interactions (button clicks, survey responses)
CREATE TABLE IF NOT EXISTS public.whatsapp_message_interactions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  message_id UUID REFERENCES public.whatsapp_messages(id) ON DELETE CASCADE,
  user_id UUID,
  organization_id UUID,
  interaction_type TEXT NOT NULL DEFAULT 'button_click',
  interaction_value TEXT,
  interaction_data JSONB DEFAULT '{}',
  shipment_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.whatsapp_message_interactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view all interactions"
ON public.whatsapp_message_interactions FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Service can insert interactions"
ON public.whatsapp_message_interactions FOR INSERT
TO authenticated
WITH CHECK (true);

-- Add interactive_buttons and attachment_url to whatsapp_templates
ALTER TABLE public.whatsapp_templates
  ADD COLUMN IF NOT EXISTS interactive_type TEXT DEFAULT 'none',
  ADD COLUMN IF NOT EXISTS attachment_url TEXT,
  ADD COLUMN IF NOT EXISTS survey_options JSONB;

-- Add interaction tracking to whatsapp_messages
ALTER TABLE public.whatsapp_messages
  ADD COLUMN IF NOT EXISTS broadcast_group_id UUID REFERENCES public.whatsapp_broadcast_groups(id),
  ADD COLUMN IF NOT EXISTS interactive_buttons JSONB,
  ADD COLUMN IF NOT EXISTS attachment_url TEXT,
  ADD COLUMN IF NOT EXISTS sent_by UUID;
