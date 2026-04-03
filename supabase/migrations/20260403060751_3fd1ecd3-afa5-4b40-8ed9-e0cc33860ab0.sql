
ALTER TABLE public.call_records
ADD COLUMN receiver_user_id uuid REFERENCES auth.users(id),
ADD COLUMN caller_name text,
ADD COLUMN caller_avatar_url text,
ADD COLUMN receiver_name text,
ADD COLUMN receiver_avatar_url text,
ADD COLUMN busy_message text;

CREATE INDEX idx_call_records_receiver_user ON public.call_records(receiver_user_id) WHERE receiver_user_id IS NOT NULL;
CREATE INDEX idx_call_records_caller_id ON public.call_records(caller_id);
