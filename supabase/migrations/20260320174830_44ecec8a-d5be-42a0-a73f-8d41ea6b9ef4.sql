
-- 3. Broadcast Channels table
CREATE TABLE public.broadcast_channels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  avatar_url TEXT,
  is_active BOOLEAN DEFAULT true,
  subscriber_count INTEGER DEFAULT 0,
  created_by UUID NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.broadcast_channels ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Org members manage channels" ON public.broadcast_channels FOR ALL USING (
  organization_id IN (SELECT organization_id FROM public.profiles WHERE user_id = auth.uid())
);
CREATE POLICY "Partners can view channels" ON public.broadcast_channels FOR SELECT USING (
  organization_id IN (
    SELECT CASE WHEN requester_org_id = (SELECT organization_id FROM public.profiles WHERE user_id = auth.uid() LIMIT 1)
      THEN partner_org_id ELSE requester_org_id END
    FROM public.verified_partnerships
    WHERE status = 'active'
      AND (requester_org_id = (SELECT organization_id FROM public.profiles WHERE user_id = auth.uid() LIMIT 1)
        OR partner_org_id = (SELECT organization_id FROM public.profiles WHERE user_id = auth.uid() LIMIT 1))
  )
);

-- 4. Broadcast Channel Subscribers
CREATE TABLE public.broadcast_channel_subscribers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  channel_id UUID NOT NULL REFERENCES public.broadcast_channels(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES public.organizations(id),
  user_id UUID NOT NULL,
  subscribed_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(channel_id, user_id)
);
ALTER TABLE public.broadcast_channel_subscribers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own subscriptions" ON public.broadcast_channel_subscribers FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Channel owners can view subscribers" ON public.broadcast_channel_subscribers FOR SELECT USING (
  channel_id IN (SELECT id FROM public.broadcast_channels WHERE organization_id IN (SELECT organization_id FROM public.profiles WHERE user_id = auth.uid()))
);

-- 5. Broadcast Posts
CREATE TABLE public.broadcast_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  channel_id UUID NOT NULL REFERENCES public.broadcast_channels(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL,
  content TEXT NOT NULL,
  post_type TEXT DEFAULT 'text',
  file_url TEXT,
  file_name TEXT,
  metadata JSONB DEFAULT '{}',
  views_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.broadcast_posts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Channel members can view posts" ON public.broadcast_posts FOR SELECT USING (
  channel_id IN (SELECT channel_id FROM public.broadcast_channel_subscribers WHERE user_id = auth.uid())
  OR channel_id IN (SELECT id FROM public.broadcast_channels WHERE organization_id IN (SELECT organization_id FROM public.profiles WHERE user_id = auth.uid()))
);
CREATE POLICY "Channel owners can post" ON public.broadcast_posts FOR INSERT WITH CHECK (
  channel_id IN (SELECT id FROM public.broadcast_channels WHERE organization_id IN (SELECT organization_id FROM public.profiles WHERE user_id = auth.uid()))
);

-- 6. Shared Collaboration Files (Live Board)
CREATE TABLE public.shared_collaboration_files (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_key TEXT NOT NULL,
  uploaded_by UUID NOT NULL,
  uploaded_by_org_id UUID,
  file_name TEXT NOT NULL,
  file_url TEXT NOT NULL,
  file_type TEXT,
  file_size INTEGER,
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft','pending','approved','signed','rejected')),
  category TEXT DEFAULT 'general',
  notes TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.shared_collaboration_files ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own collab files" ON public.shared_collaboration_files FOR ALL USING (
  uploaded_by = auth.uid()
);
CREATE POLICY "Partners view shared collab files" ON public.shared_collaboration_files FOR SELECT USING (
  uploaded_by_org_id IN (
    SELECT CASE WHEN requester_org_id = (SELECT organization_id FROM public.profiles WHERE user_id = auth.uid() LIMIT 1)
      THEN partner_org_id ELSE requester_org_id END
    FROM public.verified_partnerships WHERE status = 'active'
      AND (requester_org_id = (SELECT organization_id FROM public.profiles WHERE user_id = auth.uid() LIMIT 1)
        OR partner_org_id = (SELECT organization_id FROM public.profiles WHERE user_id = auth.uid() LIMIT 1))
  )
);

-- 7. Communication Analytics
CREATE TABLE public.communication_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id),
  partner_organization_id UUID REFERENCES public.organizations(id),
  period_date DATE NOT NULL,
  period_type TEXT DEFAULT 'daily',
  messages_sent INTEGER DEFAULT 0,
  messages_received INTEGER DEFAULT 0,
  avg_response_time_minutes NUMERIC,
  documents_shared INTEGER DEFAULT 0,
  invoices_exchanged INTEGER DEFAULT 0,
  signatures_completed INTEGER DEFAULT 0,
  active_conversations INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(organization_id, partner_organization_id, period_date, period_type)
);
ALTER TABLE public.communication_analytics ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Org members view own analytics" ON public.communication_analytics FOR ALL USING (
  organization_id IN (SELECT organization_id FROM public.profiles WHERE user_id = auth.uid())
);

-- Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.broadcast_posts;
ALTER PUBLICATION supabase_realtime ADD TABLE public.shared_collaboration_files;
