-- Drop and recreate chat_rooms INSERT policy with more permissive rules
DROP POLICY IF EXISTS "Authenticated users can create rooms" ON public.chat_rooms;

-- Allow any authenticated user to create chat rooms
CREATE POLICY "Authenticated users can create chat rooms"
ON public.chat_rooms
FOR INSERT
TO authenticated
WITH CHECK (true);

-- Also add SELECT policy for newly created rooms (so user can see their own room immediately)
DROP POLICY IF EXISTS "Users can view accessible rooms" ON public.chat_rooms;

CREATE POLICY "Users can view accessible rooms"
ON public.chat_rooms
FOR SELECT
TO authenticated
USING (
  -- User is a participant
  EXISTS (
    SELECT 1 FROM chat_participants
    WHERE chat_participants.room_id = chat_rooms.id
    AND chat_participants.user_id = auth.uid()
  )
  OR
  -- User has access to shipment rooms through their organization
  (
    type = 'shipment' AND EXISTS (
      SELECT 1 FROM shipments s
      JOIN profiles p ON p.user_id = auth.uid()
      WHERE s.id = chat_rooms.shipment_id
      AND (s.generator_id = p.organization_id OR s.transporter_id = p.organization_id OR s.recycler_id = p.organization_id)
    )
  )
  OR
  -- Group rooms are visible to all authenticated users
  type = 'group'
);

-- Fix chat_participants INSERT policy to allow adding self to group rooms
DROP POLICY IF EXISTS "Users can add participants to rooms" ON public.chat_participants;

CREATE POLICY "Users can add participants to rooms"
ON public.chat_participants
FOR INSERT
TO authenticated
WITH CHECK (
  -- User can add themselves
  user_id = auth.uid()
  OR
  -- User is already a participant in the room
  EXISTS (
    SELECT 1 FROM chat_participants cp
    WHERE cp.room_id = chat_participants.room_id
    AND cp.user_id = auth.uid()
  )
  OR
  -- Allow adding to recently created shipment rooms
  EXISTS (
    SELECT 1 FROM chat_rooms cr
    WHERE cr.id = chat_participants.room_id
    AND cr.type = 'shipment'
    AND cr.created_at > now() - interval '5 minutes'
  )
);

-- Also allow viewing participants in rooms user has access to
DROP POLICY IF EXISTS "Users can view own participation" ON public.chat_participants;

CREATE POLICY "Users can view room participants"
ON public.chat_participants
FOR SELECT
TO authenticated
USING (
  user_id = auth.uid()
  OR
  EXISTS (
    SELECT 1 FROM chat_participants cp
    WHERE cp.room_id = chat_participants.room_id
    AND cp.user_id = auth.uid()
  )
);