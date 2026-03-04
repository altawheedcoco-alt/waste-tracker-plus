
-- Video meetings table
CREATE TABLE public.video_meetings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE NOT NULL,
  created_by UUID REFERENCES public.profiles(id) NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  room_id TEXT NOT NULL UNIQUE,
  meeting_type TEXT NOT NULL DEFAULT 'video' CHECK (meeting_type IN ('video', 'audio')),
  status TEXT NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'active', 'ended', 'cancelled')),
  scheduled_at TIMESTAMPTZ,
  started_at TIMESTAMPTZ,
  ended_at TIMESTAMPTZ,
  max_participants INT DEFAULT 50,
  is_private BOOLEAN DEFAULT true,
  allow_chat BOOLEAN DEFAULT true,
  recording_enabled BOOLEAN DEFAULT false,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Meeting participants
CREATE TABLE public.video_meeting_participants (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  meeting_id UUID REFERENCES public.video_meetings(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES public.profiles(id) NOT NULL,
  role TEXT NOT NULL DEFAULT 'participant' CHECK (role IN ('host', 'moderator', 'participant')),
  status TEXT NOT NULL DEFAULT 'invited' CHECK (status IN ('invited', 'joined', 'left', 'declined', 'kicked')),
  invited_by UUID REFERENCES public.profiles(id),
  joined_at TIMESTAMPTZ,
  left_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(meeting_id, user_id)
);

-- Meeting chat messages
CREATE TABLE public.video_meeting_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  meeting_id UUID REFERENCES public.video_meetings(id) ON DELETE CASCADE NOT NULL,
  sender_id UUID REFERENCES public.profiles(id) NOT NULL,
  content TEXT NOT NULL,
  message_type TEXT DEFAULT 'text' CHECK (message_type IN ('text', 'system', 'file')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.video_meetings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.video_meeting_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.video_meeting_messages ENABLE ROW LEVEL SECURITY;

-- RLS: Meetings - org members can see their org's meetings
CREATE POLICY "Users can view org meetings" ON public.video_meetings
  FOR SELECT TO authenticated
  USING (
    organization_id IN (
      SELECT organization_id FROM public.profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "Users can create meetings" ON public.video_meetings
  FOR INSERT TO authenticated
  WITH CHECK (created_by = auth.uid());

CREATE POLICY "Creators can update meetings" ON public.video_meetings
  FOR UPDATE TO authenticated
  USING (created_by = auth.uid());

-- RLS: Participants
CREATE POLICY "View meeting participants" ON public.video_meeting_participants
  FOR SELECT TO authenticated
  USING (
    meeting_id IN (
      SELECT id FROM public.video_meetings WHERE organization_id IN (
        SELECT organization_id FROM public.profiles WHERE id = auth.uid()
      )
    )
  );

CREATE POLICY "Host can manage participants" ON public.video_meeting_participants
  FOR INSERT TO authenticated
  WITH CHECK (
    meeting_id IN (
      SELECT id FROM public.video_meetings WHERE created_by = auth.uid()
    ) OR invited_by = auth.uid()
  );

CREATE POLICY "Update own participation" ON public.video_meeting_participants
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid() OR meeting_id IN (
    SELECT id FROM public.video_meetings WHERE created_by = auth.uid()
  ));

-- RLS: Messages
CREATE POLICY "View meeting messages" ON public.video_meeting_messages
  FOR SELECT TO authenticated
  USING (
    meeting_id IN (
      SELECT meeting_id FROM public.video_meeting_participants WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Send meeting messages" ON public.video_meeting_messages
  FOR INSERT TO authenticated
  WITH CHECK (sender_id = auth.uid());

-- Enable realtime for messages and participants
ALTER PUBLICATION supabase_realtime ADD TABLE public.video_meeting_messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.video_meeting_participants;

-- Indexes
CREATE INDEX idx_video_meetings_org ON public.video_meetings(organization_id);
CREATE INDEX idx_video_meetings_status ON public.video_meetings(status);
CREATE INDEX idx_video_meeting_participants_meeting ON public.video_meeting_participants(meeting_id);
CREATE INDEX idx_video_meeting_participants_user ON public.video_meeting_participants(user_id);
CREATE INDEX idx_video_meeting_messages_meeting ON public.video_meeting_messages(meeting_id);
