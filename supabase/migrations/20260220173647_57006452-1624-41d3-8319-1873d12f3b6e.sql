
-- ============================
-- Smart AI Agent System Tables
-- ============================

-- 1) Agent Configuration per Organization
CREATE TABLE public.ai_agent_configs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  is_enabled BOOLEAN DEFAULT false,
  agent_name TEXT DEFAULT 'وكيل ذكي',
  agent_personality TEXT DEFAULT 'professional',
  welcome_message TEXT DEFAULT 'مرحباً! كيف يمكنني مساعدتك اليوم؟',
  language TEXT DEFAULT 'ar',
  tone TEXT DEFAULT 'friendly_professional',
  auto_create_orders BOOLEAN DEFAULT true,
  notify_on_new_order BOOLEAN DEFAULT true,
  notify_on_new_conversation BOOLEAN DEFAULT false,
  working_hours_start TIME DEFAULT '08:00',
  working_hours_end TIME DEFAULT '22:00',
  outside_hours_message TEXT DEFAULT 'شكراً لتواصلك! سنرد عليك في أقرب وقت خلال ساعات العمل.',
  max_messages_per_conversation INT DEFAULT 50,
  escalation_keywords TEXT[] DEFAULT ARRAY['مدير', 'شكوى', 'مشكلة كبيرة'],
  escalation_message TEXT DEFAULT 'سأحولك لأحد المتخصصين فوراً...',
  -- Channel configs
  whatsapp_enabled BOOLEAN DEFAULT false,
  whatsapp_phone_id TEXT,
  facebook_enabled BOOLEAN DEFAULT false,
  facebook_page_id TEXT,
  telegram_enabled BOOLEAN DEFAULT false,
  telegram_bot_token TEXT,
  website_widget_enabled BOOLEAN DEFAULT true,
  -- Stats
  total_conversations INT DEFAULT 0,
  total_orders_created INT DEFAULT 0,
  avg_response_time_seconds INT DEFAULT 0,
  customer_satisfaction_avg NUMERIC(3,2) DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(organization_id)
);

-- 2) Knowledge Base: docs, FAQs, pricing, custom data the agent learns from
CREATE TABLE public.ai_agent_knowledge (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  knowledge_type TEXT NOT NULL DEFAULT 'faq', -- faq, pricing, catalog, policy, custom
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  category TEXT,
  tags TEXT[],
  is_active BOOLEAN DEFAULT true,
  priority INT DEFAULT 0,
  usage_count INT DEFAULT 0,
  last_used_at TIMESTAMPTZ,
  created_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_agent_knowledge_org ON public.ai_agent_knowledge(organization_id, is_active);
CREATE INDEX idx_agent_knowledge_type ON public.ai_agent_knowledge(organization_id, knowledge_type);

-- 3) Agent Conversations (from any channel)
CREATE TABLE public.ai_agent_conversations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  channel TEXT NOT NULL DEFAULT 'website', -- website, whatsapp, facebook, telegram, internal
  channel_contact_id TEXT, -- phone number, fb user id, telegram id
  contact_name TEXT,
  contact_phone TEXT,
  contact_email TEXT,
  status TEXT NOT NULL DEFAULT 'active', -- active, resolved, escalated, archived
  escalated_to UUID REFERENCES public.profiles(id),
  escalation_reason TEXT,
  order_created BOOLEAN DEFAULT false,
  order_id UUID, -- reference to work_orders or shipments
  satisfaction_rating INT, -- 1-5
  satisfaction_comment TEXT,
  message_count INT DEFAULT 0,
  last_message_at TIMESTAMPTZ DEFAULT now(),
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_agent_conv_org ON public.ai_agent_conversations(organization_id, status);
CREATE INDEX idx_agent_conv_channel ON public.ai_agent_conversations(channel, channel_contact_id);

-- 4) Conversation Messages
CREATE TABLE public.ai_agent_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  conversation_id UUID NOT NULL REFERENCES public.ai_agent_conversations(id) ON DELETE CASCADE,
  role TEXT NOT NULL, -- customer, agent, system
  content TEXT NOT NULL,
  message_type TEXT DEFAULT 'text', -- text, image, file, order_summary, escalation
  metadata JSONB DEFAULT '{}',
  tokens_used INT DEFAULT 0,
  response_time_ms INT,
  knowledge_sources UUID[], -- which knowledge entries were used
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_agent_messages_conv ON public.ai_agent_messages(conversation_id, created_at);

-- 5) Orders captured by the agent
CREATE TABLE public.ai_agent_orders (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  conversation_id UUID NOT NULL REFERENCES public.ai_agent_conversations(id),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  customer_name TEXT NOT NULL,
  customer_phone TEXT,
  customer_email TEXT,
  customer_address TEXT,
  order_type TEXT DEFAULT 'collection_request', -- collection_request, purchase, inquiry, quote
  items JSONB DEFAULT '[]', -- [{name, quantity, unit, price}]
  total_amount NUMERIC(12,2),
  currency TEXT DEFAULT 'EGP',
  notes TEXT,
  status TEXT DEFAULT 'new', -- new, confirmed, processing, completed, cancelled
  confirmed_by UUID REFERENCES public.profiles(id),
  confirmed_at TIMESTAMPTZ,
  linked_shipment_id UUID,
  linked_work_order_id UUID,
  channel TEXT NOT NULL DEFAULT 'website',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_agent_orders_org ON public.ai_agent_orders(organization_id, status);

-- RLS Policies
ALTER TABLE public.ai_agent_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_agent_knowledge ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_agent_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_agent_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_agent_orders ENABLE ROW LEVEL SECURITY;

-- Configs: org members can view/edit their own
CREATE POLICY "Org members manage agent config"
  ON public.ai_agent_configs FOR ALL
  USING (organization_id IN (SELECT organization_id FROM public.user_organizations WHERE user_id = auth.uid()));

-- Knowledge: org members manage
CREATE POLICY "Org members manage knowledge"
  ON public.ai_agent_knowledge FOR ALL
  USING (organization_id IN (SELECT organization_id FROM public.user_organizations WHERE user_id = auth.uid()));

-- Conversations: org members can view
CREATE POLICY "Org members view conversations"
  ON public.ai_agent_conversations FOR ALL
  USING (organization_id IN (SELECT organization_id FROM public.user_organizations WHERE user_id = auth.uid()));

-- Messages: via conversation access
CREATE POLICY "Access messages via conversation"
  ON public.ai_agent_messages FOR ALL
  USING (conversation_id IN (
    SELECT id FROM public.ai_agent_conversations 
    WHERE organization_id IN (SELECT organization_id FROM public.user_organizations WHERE user_id = auth.uid())
  ));

-- Orders: org members manage
CREATE POLICY "Org members manage orders"
  ON public.ai_agent_orders FOR ALL
  USING (organization_id IN (SELECT organization_id FROM public.user_organizations WHERE user_id = auth.uid()));

-- Admin full access
CREATE POLICY "Admin full access agent configs" ON public.ai_agent_configs FOR ALL USING (public.is_current_user_admin());
CREATE POLICY "Admin full access knowledge" ON public.ai_agent_knowledge FOR ALL USING (public.is_current_user_admin());
CREATE POLICY "Admin full access conversations" ON public.ai_agent_conversations FOR ALL USING (public.is_current_user_admin());
CREATE POLICY "Admin full access messages" ON public.ai_agent_messages FOR ALL USING (public.is_current_user_admin());
CREATE POLICY "Admin full access orders" ON public.ai_agent_orders FOR ALL USING (public.is_current_user_admin());

-- Service role policies for edge functions (anon insert for widget/webhooks)
CREATE POLICY "Public can create conversations"
  ON public.ai_agent_conversations FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Public can add messages"
  ON public.ai_agent_messages FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Public can create orders"
  ON public.ai_agent_orders FOR INSERT
  WITH CHECK (true);

-- Public read for active configs (widget needs to check if agent is enabled)
CREATE POLICY "Public can read enabled configs"
  ON public.ai_agent_configs FOR SELECT
  USING (is_enabled = true);

-- Triggers for updated_at
CREATE TRIGGER update_ai_agent_configs_updated_at
  BEFORE UPDATE ON public.ai_agent_configs
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_ai_agent_knowledge_updated_at
  BEFORE UPDATE ON public.ai_agent_knowledge
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_ai_agent_conversations_updated_at
  BEFORE UPDATE ON public.ai_agent_conversations
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_ai_agent_orders_updated_at
  BEFORE UPDATE ON public.ai_agent_orders
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
