-- Drop the problematic policies
DROP POLICY IF EXISTS "Authenticated users can create rooms" ON public.chat_rooms;
DROP POLICY IF EXISTS "Users can add participants to rooms they're in" ON public.chat_participants;

-- Create better policies for chat_rooms INSERT
CREATE POLICY "Authenticated users can create rooms"
ON public.chat_rooms FOR INSERT
TO authenticated
WITH CHECK (auth.uid() IS NOT NULL);

-- Create better policy for chat_participants INSERT
-- Allow inserting if user is adding themselves OR if room has no participants yet (creator)
CREATE POLICY "Users can add participants"
ON public.chat_participants FOR INSERT
TO authenticated
WITH CHECK (
  user_id = auth.uid() OR 
  NOT EXISTS (
    SELECT 1 FROM public.chat_participants cp
    WHERE cp.room_id = chat_participants.room_id
  )
);