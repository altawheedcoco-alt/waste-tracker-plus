-- Add unique constraint for room_id and user_id to prevent duplicate participants
ALTER TABLE public.chat_participants 
ADD CONSTRAINT chat_participants_room_user_unique UNIQUE (room_id, user_id);