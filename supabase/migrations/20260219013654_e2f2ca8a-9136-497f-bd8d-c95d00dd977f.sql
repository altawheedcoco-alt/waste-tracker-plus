
-- Add missing columns to chat_rooms for group/broadcast support
ALTER TABLE public.chat_rooms ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE public.chat_rooms ADD COLUMN IF NOT EXISTS avatar_url TEXT;
ALTER TABLE public.chat_rooms ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES auth.users(id);
ALTER TABLE public.chat_rooms ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES public.organizations(id);
ALTER TABLE public.chat_rooms ADD COLUMN IF NOT EXISTS is_archived BOOLEAN DEFAULT false;
ALTER TABLE public.chat_rooms ADD COLUMN IF NOT EXISTS last_message_at TIMESTAMPTZ DEFAULT now();
ALTER TABLE public.chat_rooms ADD COLUMN IF NOT EXISTS last_message_preview TEXT;
ALTER TABLE public.chat_rooms ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}';

-- Add missing columns to chat_participants
ALTER TABLE public.chat_participants ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES public.organizations(id);
ALTER TABLE public.chat_participants ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'member';
ALTER TABLE public.chat_participants ADD COLUMN IF NOT EXISTS is_muted BOOLEAN DEFAULT false;
ALTER TABLE public.chat_participants ADD COLUMN IF NOT EXISTS is_blocked BOOLEAN DEFAULT false;

-- Add missing columns to chat_messages
ALTER TABLE public.chat_messages ADD COLUMN IF NOT EXISTS sender_organization_id UUID REFERENCES public.organizations(id);
ALTER TABLE public.chat_messages ADD COLUMN IF NOT EXISTS file_url TEXT;
ALTER TABLE public.chat_messages ADD COLUMN IF NOT EXISTS file_name TEXT;
ALTER TABLE public.chat_messages ADD COLUMN IF NOT EXISTS file_size INTEGER;
ALTER TABLE public.chat_messages ADD COLUMN IF NOT EXISTS file_mime_type TEXT;
ALTER TABLE public.chat_messages ADD COLUMN IF NOT EXISTS reply_to_id UUID REFERENCES public.chat_messages(id);
ALTER TABLE public.chat_messages ADD COLUMN IF NOT EXISTS is_edited BOOLEAN DEFAULT false;
ALTER TABLE public.chat_messages ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN DEFAULT false;
ALTER TABLE public.chat_messages ADD COLUMN IF NOT EXISTS is_pinned BOOLEAN DEFAULT false;
ALTER TABLE public.chat_messages ADD COLUMN IF NOT EXISTS is_forwarded BOOLEAN DEFAULT false;
ALTER TABLE public.chat_messages ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}';
ALTER TABLE public.chat_messages ADD COLUMN IF NOT EXISTS receiver_user_id UUID REFERENCES auth.users(id);

-- Broadcast Lists table
CREATE TABLE IF NOT EXISTS public.chat_broadcast_lists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES public.organizations(id),
  created_by UUID REFERENCES auth.users(id),
  name TEXT NOT NULL,
  description TEXT,
  target_type TEXT DEFAULT 'all',
  target_organization_ids UUID[] DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Chat Settings per organization
CREATE TABLE IF NOT EXISTS public.chat_org_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) UNIQUE,
  allow_direct_messages BOOLEAN DEFAULT true,
  allow_group_invites BOOLEAN DEFAULT true,
  auto_reply_enabled BOOLEAN DEFAULT false,
  auto_reply_message TEXT,
  business_hours_only BOOLEAN DEFAULT false,
  business_hours_start TIME DEFAULT '09:00',
  business_hours_end TIME DEFAULT '17:00',
  show_online_status BOOLEAN DEFAULT true,
  show_read_receipts BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Message read receipts
CREATE TABLE IF NOT EXISTS public.chat_message_reads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id UUID NOT NULL REFERENCES public.chat_messages(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id),
  read_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(message_id, user_id)
);

-- Enable RLS on new tables
ALTER TABLE public.chat_broadcast_lists ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_org_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_message_reads ENABLE ROW LEVEL SECURITY;

-- RLS: broadcast lists - admins only
CREATE POLICY "System admins can manage broadcast lists"
ON public.chat_broadcast_lists FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Org members can view broadcast lists"
ON public.chat_broadcast_lists FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.user_id = auth.uid()
    AND profiles.organization_id = chat_broadcast_lists.organization_id
  )
);

-- RLS: chat settings
CREATE POLICY "Org members can view own settings"
ON public.chat_org_settings FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.user_id = auth.uid()
    AND profiles.organization_id = chat_org_settings.organization_id
  )
);

CREATE POLICY "Org members can manage own settings"
ON public.chat_org_settings FOR ALL TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.user_id = auth.uid()
    AND profiles.organization_id = chat_org_settings.organization_id
  )
);

-- RLS: read receipts
CREATE POLICY "Users can view read receipts in their conversations"
ON public.chat_message_reads FOR SELECT TO authenticated USING (true);

CREATE POLICY "Users can mark messages as read"
ON public.chat_message_reads FOR INSERT TO authenticated
WITH CHECK (user_id = auth.uid());

-- Update conversation last message trigger
CREATE OR REPLACE FUNCTION public.update_chat_room_last_message()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.chat_rooms
  SET last_message_at = NEW.created_at,
      last_message_preview = LEFT(NEW.content, 100),
      updated_at = now()
  WHERE id = NEW.room_id;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_new_room_chat_message ON public.chat_messages;
CREATE TRIGGER on_new_room_chat_message
AFTER INSERT ON public.chat_messages
FOR EACH ROW
EXECUTE FUNCTION public.update_chat_room_last_message();

-- Performance indexes
CREATE INDEX IF NOT EXISTS idx_chat_messages_room_created ON public.chat_messages(room_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_chat_participants_user_id ON public.chat_participants(user_id);
CREATE INDEX IF NOT EXISTS idx_direct_messages_orgs ON public.direct_messages(sender_organization_id, receiver_organization_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_chat_rooms_last_msg ON public.chat_rooms(last_message_at DESC);

-- Enable realtime for direct_messages (if not already)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' 
    AND tablename = 'direct_messages'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.direct_messages;
  END IF;
END $$;
