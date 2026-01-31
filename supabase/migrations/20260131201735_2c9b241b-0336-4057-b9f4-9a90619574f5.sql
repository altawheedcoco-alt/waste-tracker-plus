-- Create direct_messages table for continuous partner-to-partner messaging
CREATE TABLE public.direct_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  sender_id UUID NOT NULL,
  sender_organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  receiver_organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  message_type TEXT NOT NULL DEFAULT 'text',
  is_read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.direct_messages ENABLE ROW LEVEL SECURITY;

-- Indexes for performance
CREATE INDEX idx_direct_messages_sender_org ON public.direct_messages(sender_organization_id);
CREATE INDEX idx_direct_messages_receiver_org ON public.direct_messages(receiver_organization_id);
CREATE INDEX idx_direct_messages_created_at ON public.direct_messages(created_at);
CREATE INDEX idx_direct_messages_conversation ON public.direct_messages(sender_organization_id, receiver_organization_id);

-- Policy: Users can view messages where their organization is sender or receiver
CREATE POLICY "Users can view their organization messages"
ON public.direct_messages
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles p
    WHERE p.user_id = auth.uid()
    AND (p.organization_id = sender_organization_id OR p.organization_id = receiver_organization_id)
  )
);

-- Policy: Users can send messages from their organization
CREATE POLICY "Users can send messages from their organization"
ON public.direct_messages
FOR INSERT
TO authenticated
WITH CHECK (
  sender_id = auth.uid() AND
  EXISTS (
    SELECT 1 FROM profiles p
    WHERE p.user_id = auth.uid()
    AND p.organization_id = sender_organization_id
  )
);

-- Policy: Users can update read status on messages sent to their organization
CREATE POLICY "Users can mark messages as read"
ON public.direct_messages
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles p
    WHERE p.user_id = auth.uid()
    AND p.organization_id = receiver_organization_id
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM profiles p
    WHERE p.user_id = auth.uid()
    AND p.organization_id = receiver_organization_id
  )
);

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.direct_messages;

-- Trigger for updated_at
CREATE TRIGGER update_direct_messages_updated_at
BEFORE UPDATE ON public.direct_messages
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();