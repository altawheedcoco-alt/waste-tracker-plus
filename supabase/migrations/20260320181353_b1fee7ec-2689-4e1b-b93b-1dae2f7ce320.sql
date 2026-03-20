
-- Message Threads (replies to messages)
CREATE TABLE public.message_threads (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  parent_message_id UUID NOT NULL,
  parent_message_table TEXT NOT NULL DEFAULT 'direct_messages',
  room_id UUID,
  sender_id UUID NOT NULL,
  sender_organization_id UUID,
  content TEXT NOT NULL,
  message_type TEXT NOT NULL DEFAULT 'text',
  file_url TEXT,
  file_name TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.message_threads ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view threads they participate in" ON public.message_threads FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can create thread replies" ON public.message_threads FOR INSERT TO authenticated WITH CHECK (auth.uid() = sender_id);

CREATE INDEX idx_threads_parent ON public.message_threads(parent_message_id);

-- Chat Channels (topic channels within/between orgs)
CREATE TABLE public.chat_channels (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  channel_type TEXT NOT NULL DEFAULT 'internal',
  organization_id UUID NOT NULL,
  partner_organization_id UUID,
  created_by UUID NOT NULL,
  avatar_url TEXT,
  is_archived BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.chat_channels ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Members can view their channels" ON public.chat_channels FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can create channels" ON public.chat_channels FOR INSERT TO authenticated WITH CHECK (auth.uid() = created_by);
CREATE POLICY "Channel creators can update" ON public.chat_channels FOR UPDATE TO authenticated USING (auth.uid() = created_by);

-- Chat Channel Members
CREATE TABLE public.chat_channel_members (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  channel_id UUID NOT NULL REFERENCES public.chat_channels(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  organization_id UUID,
  role TEXT NOT NULL DEFAULT 'member',
  joined_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(channel_id, user_id)
);
ALTER TABLE public.chat_channel_members ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Members can view channel members" ON public.chat_channel_members FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can join channels" ON public.chat_channel_members FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can leave channels" ON public.chat_channel_members FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Chat Channel Messages
CREATE TABLE public.chat_channel_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  channel_id UUID NOT NULL REFERENCES public.chat_channels(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL,
  sender_organization_id UUID,
  content TEXT NOT NULL,
  message_type TEXT NOT NULL DEFAULT 'text',
  file_url TEXT,
  file_name TEXT,
  is_pinned BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.chat_channel_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Members can view channel messages" ON public.chat_channel_messages FOR SELECT TO authenticated USING (true);
CREATE POLICY "Members can send channel messages" ON public.chat_channel_messages FOR INSERT TO authenticated WITH CHECK (auth.uid() = sender_id);

CREATE INDEX idx_channel_msgs ON public.chat_channel_messages(channel_id, created_at);

-- Chat Polls
CREATE TABLE public.chat_polls (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  room_id UUID,
  channel_id UUID,
  direct_message_context JSONB,
  created_by UUID NOT NULL,
  organization_id UUID,
  question TEXT NOT NULL,
  options JSONB NOT NULL DEFAULT '[]',
  poll_type TEXT NOT NULL DEFAULT 'single',
  is_anonymous BOOLEAN DEFAULT false,
  is_closed BOOLEAN DEFAULT false,
  closes_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.chat_polls ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view polls" ON public.chat_polls FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can create polls" ON public.chat_polls FOR INSERT TO authenticated WITH CHECK (auth.uid() = created_by);
CREATE POLICY "Creators can update polls" ON public.chat_polls FOR UPDATE TO authenticated USING (auth.uid() = created_by);

-- Chat Poll Votes
CREATE TABLE public.chat_poll_votes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  poll_id UUID NOT NULL REFERENCES public.chat_polls(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  option_index INTEGER NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(poll_id, user_id, option_index)
);
ALTER TABLE public.chat_poll_votes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view votes" ON public.chat_poll_votes FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can vote" ON public.chat_poll_votes FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can change vote" ON public.chat_poll_votes FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Enable realtime for key tables
ALTER PUBLICATION supabase_realtime ADD TABLE public.message_threads;
ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_channel_messages;
