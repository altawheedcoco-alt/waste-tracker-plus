-- Create chat rooms table
CREATE TABLE public.chat_rooms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT,
  type TEXT NOT NULL CHECK (type IN ('direct', 'group', 'shipment')),
  shipment_id UUID REFERENCES public.shipments(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create chat participants table
CREATE TABLE public.chat_participants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id UUID REFERENCES public.chat_rooms(id) ON DELETE CASCADE NOT NULL,
  user_id UUID NOT NULL,
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  last_read_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(room_id, user_id)
);

-- Create chat messages table
CREATE TABLE public.chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id UUID REFERENCES public.chat_rooms(id) ON DELETE CASCADE NOT NULL,
  sender_id UUID NOT NULL,
  content TEXT NOT NULL,
  message_type TEXT DEFAULT 'text' CHECK (message_type IN ('text', 'image', 'file', 'system')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.chat_rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;

-- RLS Policies for chat_rooms
CREATE POLICY "Users can view rooms they participate in"
ON public.chat_rooms FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.chat_participants
    WHERE chat_participants.room_id = chat_rooms.id
    AND chat_participants.user_id = auth.uid()
  )
);

CREATE POLICY "Authenticated users can create rooms"
ON public.chat_rooms FOR INSERT
TO authenticated
WITH CHECK (true);

-- RLS Policies for chat_participants
CREATE POLICY "Users can view participants in their rooms"
ON public.chat_participants FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.chat_participants AS cp
    WHERE cp.room_id = chat_participants.room_id
    AND cp.user_id = auth.uid()
  )
);

CREATE POLICY "Users can add participants to rooms they're in"
ON public.chat_participants FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.chat_participants
    WHERE chat_participants.room_id = chat_participants.room_id
    AND chat_participants.user_id = auth.uid()
  ) OR NOT EXISTS (
    SELECT 1 FROM public.chat_participants
    WHERE chat_participants.room_id = chat_participants.room_id
  )
);

CREATE POLICY "Users can update their own participation"
ON public.chat_participants FOR UPDATE
TO authenticated
USING (user_id = auth.uid());

-- RLS Policies for chat_messages
CREATE POLICY "Users can view messages in their rooms"
ON public.chat_messages FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.chat_participants
    WHERE chat_participants.room_id = chat_messages.room_id
    AND chat_participants.user_id = auth.uid()
  )
);

CREATE POLICY "Users can send messages to their rooms"
ON public.chat_messages FOR INSERT
TO authenticated
WITH CHECK (
  sender_id = auth.uid() AND
  EXISTS (
    SELECT 1 FROM public.chat_participants
    WHERE chat_participants.room_id = chat_messages.room_id
    AND chat_participants.user_id = auth.uid()
  )
);

-- Enable realtime for messages
ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_messages;

-- Create indexes for performance
CREATE INDEX idx_chat_messages_room_id ON public.chat_messages(room_id);
CREATE INDEX idx_chat_messages_created_at ON public.chat_messages(created_at DESC);
CREATE INDEX idx_chat_participants_user_id ON public.chat_participants(user_id);
CREATE INDEX idx_chat_participants_room_id ON public.chat_participants(room_id);