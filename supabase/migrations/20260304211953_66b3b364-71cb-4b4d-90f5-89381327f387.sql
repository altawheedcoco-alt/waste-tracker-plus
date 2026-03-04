
-- Add AI summary columns to video_meetings
ALTER TABLE public.video_meetings 
ADD COLUMN IF NOT EXISTS ai_summary TEXT,
ADD COLUMN IF NOT EXISTS ai_key_points JSONB DEFAULT '[]',
ADD COLUMN IF NOT EXISTS ai_action_items JSONB DEFAULT '[]',
ADD COLUMN IF NOT EXISTS summary_generated_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS summary_generated_by TEXT,
ADD COLUMN IF NOT EXISTS meeting_duration_minutes INTEGER;

-- Create meeting notes table for detailed timestamped records
CREATE TABLE IF NOT EXISTS public.meeting_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  meeting_id UUID NOT NULL REFERENCES public.video_meetings(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id),
  user_name TEXT NOT NULL,
  content TEXT NOT NULL,
  note_type TEXT NOT NULL DEFAULT 'message', -- message, action, decision, note
  timestamp_in_meeting INTEGER, -- seconds from meeting start
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- RLS for meeting_notes
ALTER TABLE public.meeting_notes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view meeting notes in their org"
ON public.meeting_notes FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.video_meetings vm
    JOIN public.profiles p ON p.organization_id = vm.organization_id
    WHERE vm.id = meeting_notes.meeting_id AND p.id = auth.uid()
  )
);

CREATE POLICY "Users can insert meeting notes"
ON public.meeting_notes FOR INSERT TO authenticated
WITH CHECK (user_id = auth.uid());

-- Enable realtime for meeting_notes
ALTER PUBLICATION supabase_realtime ADD TABLE public.meeting_notes;
