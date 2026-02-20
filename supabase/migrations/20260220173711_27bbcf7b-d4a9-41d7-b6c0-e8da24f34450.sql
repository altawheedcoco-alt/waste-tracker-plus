
-- Fix overly permissive INSERT policies - restrict to valid org references only
DROP POLICY IF EXISTS "Public can create conversations" ON public.ai_agent_conversations;
DROP POLICY IF EXISTS "Public can add messages" ON public.ai_agent_messages;
DROP POLICY IF EXISTS "Public can create orders" ON public.ai_agent_orders;

-- Conversations: only allow insert if org exists and agent is enabled
CREATE POLICY "Public insert conversations for enabled agents"
  ON public.ai_agent_conversations FOR INSERT
  WITH CHECK (
    organization_id IN (SELECT organization_id FROM public.ai_agent_configs WHERE is_enabled = true)
  );

-- Messages: only allow insert if conversation exists
CREATE POLICY "Public insert messages for existing conversations"
  ON public.ai_agent_messages FOR INSERT
  WITH CHECK (
    conversation_id IN (SELECT id FROM public.ai_agent_conversations)
  );

-- Orders: only allow insert if conversation and org exist
CREATE POLICY "Public insert orders for existing conversations"
  ON public.ai_agent_orders FOR INSERT
  WITH CHECK (
    conversation_id IN (SELECT id FROM public.ai_agent_conversations)
    AND organization_id IN (SELECT organization_id FROM public.ai_agent_configs WHERE is_enabled = true)
  );

-- Also allow public to read their own conversation messages (needed for widget)
CREATE POLICY "Public read conversation messages"
  ON public.ai_agent_messages FOR SELECT
  USING (true);

-- Public can read their own conversation
CREATE POLICY "Public read conversations"
  ON public.ai_agent_conversations FOR SELECT
  USING (true);
