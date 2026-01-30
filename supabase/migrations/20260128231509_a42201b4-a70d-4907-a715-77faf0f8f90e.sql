-- Drop existing restrictive policy
DROP POLICY IF EXISTS "Users can insert own participation" ON public.chat_participants;

-- Create new policy that allows users to add participants to rooms they created or are part of
CREATE POLICY "Users can add participants to rooms"
ON public.chat_participants
FOR INSERT
WITH CHECK (
  -- User can add themselves
  user_id = auth.uid()
  OR
  -- User can add others if they are already a participant in the room
  EXISTS (
    SELECT 1 FROM chat_participants cp
    WHERE cp.room_id = chat_participants.room_id
    AND cp.user_id = auth.uid()
  )
  OR
  -- User can add participants when creating a new shipment room
  EXISTS (
    SELECT 1 FROM chat_rooms cr
    WHERE cr.id = chat_participants.room_id
    AND cr.type = 'shipment'
    AND cr.created_at > now() - interval '1 minute'
  )
);

-- Update chat_rooms policy to allow viewing shipment rooms for related organizations
DROP POLICY IF EXISTS "Users can view rooms they participate in" ON public.chat_rooms;

CREATE POLICY "Users can view accessible rooms"
ON public.chat_rooms
FOR SELECT
USING (
  -- User is a participant
  EXISTS (
    SELECT 1 FROM chat_participants
    WHERE chat_participants.room_id = chat_rooms.id
    AND chat_participants.user_id = auth.uid()
  )
  OR
  -- Shipment rooms for user's organization
  (
    type = 'shipment' AND
    EXISTS (
      SELECT 1 FROM shipments s
      JOIN profiles p ON p.user_id = auth.uid()
      WHERE s.id = chat_rooms.shipment_id
      AND (
        s.generator_id = p.organization_id
        OR s.transporter_id = p.organization_id
        OR s.recycler_id = p.organization_id
      )
    )
  )
);

-- Allow update on chat_rooms for updating timestamps
CREATE POLICY "Users can update rooms they participate in"
ON public.chat_rooms
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM chat_participants
    WHERE chat_participants.room_id = chat_rooms.id
    AND chat_participants.user_id = auth.uid()
  )
);