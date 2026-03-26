
-- Campaign tracking table
CREATE TABLE public.push_campaigns (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id uuid NOT NULL,
  title text NOT NULL,
  body text NOT NULL,
  type text DEFAULT 'general',
  priority text DEFAULT 'normal',
  target_type text DEFAULT 'all',
  target_ids text[],
  target_org_type text,
  total_sent int DEFAULT 0,
  total_failed int DEFAULT 0,
  url text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.push_campaigns ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage campaigns"
  ON public.push_campaigns FOR ALL TO authenticated
  USING (true) WITH CHECK (true);

-- Blacklist table
CREATE TABLE public.push_blacklist (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  blocked_by uuid,
  reason text,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id)
);

ALTER TABLE public.push_blacklist ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage blacklist"
  ON public.push_blacklist FOR ALL TO authenticated
  USING (true) WITH CHECK (true);
