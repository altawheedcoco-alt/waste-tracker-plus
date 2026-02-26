
-- ============================================
-- Phase 1: E2E Encrypted Communication System
-- ============================================

-- 1. E2E Key Pairs - stores public keys (private keys stay on client)
CREATE TABLE public.e2e_key_pairs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  public_key text NOT NULL,
  key_type text NOT NULL DEFAULT 'ECDH-P256',
  device_id text,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  expires_at timestamptz,
  UNIQUE(user_id, device_id)
);

ALTER TABLE public.e2e_key_pairs ENABLE ROW LEVEL SECURITY;

-- Anyone authenticated can read public keys (needed for encryption)
CREATE POLICY "Anyone can read public keys"
  ON public.e2e_key_pairs FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Users manage own keys"
  ON public.e2e_key_pairs FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users update own keys"
  ON public.e2e_key_pairs FOR UPDATE TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users delete own keys"
  ON public.e2e_key_pairs FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

-- 2. Private Conversations (1:1 only, WhatsApp-style)
CREATE TABLE public.private_conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  participant_1 uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  participant_2 uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  last_message_at timestamptz,
  last_message_preview_encrypted text,
  is_blocked_by_1 boolean DEFAULT false,
  is_blocked_by_2 boolean DEFAULT false,
  is_muted_by_1 boolean DEFAULT false,
  is_muted_by_2 boolean DEFAULT false,
  UNIQUE(participant_1, participant_2),
  CHECK (participant_1 < participant_2)
);

ALTER TABLE public.private_conversations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Participants see own conversations"
  ON public.private_conversations FOR SELECT TO authenticated
  USING (auth.uid() = participant_1 OR auth.uid() = participant_2);

CREATE POLICY "Authenticated users create conversations"
  ON public.private_conversations FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = participant_1 OR auth.uid() = participant_2);

CREATE POLICY "Participants update own conversations"
  ON public.private_conversations FOR UPDATE TO authenticated
  USING (auth.uid() = participant_1 OR auth.uid() = participant_2);

-- 3. Encrypted Messages
CREATE TABLE public.encrypted_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid NOT NULL REFERENCES public.private_conversations(id) ON DELETE CASCADE,
  sender_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  encrypted_content text NOT NULL,
  encrypted_content_for_sender text,
  iv text NOT NULL,
  message_type text DEFAULT 'text',
  file_url text,
  file_name text,
  file_size bigint,
  reply_to_id uuid REFERENCES public.encrypted_messages(id) ON DELETE SET NULL,
  status text DEFAULT 'sent' CHECK (status IN ('sent', 'delivered', 'read')),
  delivered_at timestamptz,
  read_at timestamptz,
  is_edited boolean DEFAULT false,
  edited_at timestamptz,
  is_deleted boolean DEFAULT false,
  deleted_at timestamptz,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX idx_encrypted_messages_conversation ON public.encrypted_messages(conversation_id, created_at DESC);
CREATE INDEX idx_encrypted_messages_sender ON public.encrypted_messages(sender_id);

ALTER TABLE public.encrypted_messages ENABLE ROW LEVEL SECURITY;

-- Security definer to check conversation membership
CREATE OR REPLACE FUNCTION public.is_conversation_participant(_user_id uuid, _conversation_id uuid)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.private_conversations
    WHERE id = _conversation_id
    AND (participant_1 = _user_id OR participant_2 = _user_id)
  );
$$;

CREATE POLICY "Participants read messages"
  ON public.encrypted_messages FOR SELECT TO authenticated
  USING (public.is_conversation_participant(auth.uid(), conversation_id));

CREATE POLICY "Participants send messages"
  ON public.encrypted_messages FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = sender_id AND public.is_conversation_participant(auth.uid(), conversation_id));

CREATE POLICY "Senders edit own messages"
  ON public.encrypted_messages FOR UPDATE TO authenticated
  USING (auth.uid() = sender_id);

-- 4. Message Archive / History Export
CREATE TABLE public.chat_history_exports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  conversation_id uuid REFERENCES public.private_conversations(id) ON DELETE SET NULL,
  export_type text DEFAULT 'conversation',
  file_url text,
  file_format text DEFAULT 'json',
  message_count integer DEFAULT 0,
  date_from timestamptz,
  date_to timestamptz,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  created_at timestamptz DEFAULT now(),
  completed_at timestamptz
);

ALTER TABLE public.chat_history_exports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own exports"
  ON public.chat_history_exports FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- 5. Message read receipts tracking
CREATE TABLE public.message_read_receipts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id uuid NOT NULL REFERENCES public.encrypted_messages(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  read_at timestamptz DEFAULT now(),
  UNIQUE(message_id, user_id)
);

ALTER TABLE public.message_read_receipts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Participants manage read receipts"
  ON public.message_read_receipts FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- 6. Update conversation last_message on new message
CREATE OR REPLACE FUNCTION public.update_conversation_last_message()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.private_conversations
  SET last_message_at = NEW.created_at,
      last_message_preview_encrypted = LEFT(NEW.encrypted_content, 100)
  WHERE id = NEW.conversation_id;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_update_conversation_last_message
  AFTER INSERT ON public.encrypted_messages
  FOR EACH ROW
  EXECUTE FUNCTION public.update_conversation_last_message();

-- 7. Enable realtime for messages
ALTER PUBLICATION supabase_realtime ADD TABLE public.encrypted_messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.private_conversations;
ALTER PUBLICATION supabase_realtime ADD TABLE public.message_read_receipts;
