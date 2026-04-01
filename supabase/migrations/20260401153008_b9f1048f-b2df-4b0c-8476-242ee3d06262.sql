
-- Starred/bookmarked messages table
CREATE TABLE public.starred_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  message_id UUID NOT NULL,
  conversation_id UUID NOT NULL,
  message_content TEXT,
  message_type TEXT DEFAULT 'text',
  starred_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, message_id)
);

ALTER TABLE public.starred_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own starred messages"
ON public.starred_messages
FOR ALL
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Add realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.starred_messages;
