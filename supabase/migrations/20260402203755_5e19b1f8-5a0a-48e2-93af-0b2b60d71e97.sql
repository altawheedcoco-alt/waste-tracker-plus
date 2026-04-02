
CREATE TABLE public.call_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  call_id uuid REFERENCES public.call_records(id) ON DELETE CASCADE NOT NULL,
  sender_id uuid NOT NULL,
  content text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_call_messages_call_id ON public.call_messages(call_id);

ALTER TABLE public.call_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Call participants can read messages"
  ON public.call_messages FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.call_records cr
      WHERE cr.id = call_messages.call_id
      AND (cr.caller_id = auth.uid() OR cr.receiver_org_id IN (
        SELECT organization_id FROM public.organization_members WHERE user_id = auth.uid() AND status = 'active'
      ))
    )
  );

CREATE POLICY "Call participants can send messages"
  ON public.call_messages FOR INSERT TO authenticated
  WITH CHECK (sender_id = auth.uid());

ALTER PUBLICATION supabase_realtime ADD TABLE public.call_messages;
