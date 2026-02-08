-- جدول محادثات خدمة العملاء
CREATE TABLE public.customer_conversations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  organization_id UUID REFERENCES public.organizations(id),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'closed', 'escalated')),
  context JSONB DEFAULT '{}',
  started_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  ended_at TIMESTAMP WITH TIME ZONE,
  escalated_at TIMESTAMP WITH TIME ZONE,
  escalated_to_ticket_id UUID REFERENCES public.support_tickets(id),
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  rating_feedback TEXT,
  rated_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- جدول رسائل المحادثات
CREATE TABLE public.customer_conversation_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  conversation_id UUID NOT NULL REFERENCES public.customer_conversations(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  content TEXT NOT NULL,
  suggestions JSONB,
  actions JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.customer_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customer_conversation_messages ENABLE ROW LEVEL SECURITY;

-- RLS Policies للمحادثات - المستخدمين يرون محادثاتهم
CREATE POLICY "Users can view their own conversations"
ON public.customer_conversations FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own conversations"
ON public.customer_conversations FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own conversations"
ON public.customer_conversations FOR UPDATE
USING (auth.uid() = user_id);

-- RLS Policies للرسائل
CREATE POLICY "Users can view messages of their conversations"
ON public.customer_conversation_messages FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.customer_conversations c
    WHERE c.id = conversation_id AND c.user_id = auth.uid()
  )
);

CREATE POLICY "Users can create messages in their conversations"
ON public.customer_conversation_messages FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.customer_conversations c
    WHERE c.id = conversation_id AND c.user_id = auth.uid()
  )
);

-- Service role can view all (for edge functions and admin)
CREATE POLICY "Service role full access conversations"
ON public.customer_conversations FOR ALL
USING (auth.jwt() ->> 'role' = 'service_role');

CREATE POLICY "Service role full access messages"
ON public.customer_conversation_messages FOR ALL
USING (auth.jwt() ->> 'role' = 'service_role');

-- Indexes
CREATE INDEX idx_customer_conversations_user ON public.customer_conversations(user_id);
CREATE INDEX idx_customer_conversations_org ON public.customer_conversations(organization_id);
CREATE INDEX idx_customer_conversations_status ON public.customer_conversations(status);
CREATE INDEX idx_customer_messages_conversation ON public.customer_conversation_messages(conversation_id);

-- Trigger for updated_at
CREATE TRIGGER update_customer_conversations_updated_at
BEFORE UPDATE ON public.customer_conversations
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Enable realtime for live updates
ALTER PUBLICATION supabase_realtime ADD TABLE public.customer_conversations;
ALTER PUBLICATION supabase_realtime ADD TABLE public.customer_conversation_messages;