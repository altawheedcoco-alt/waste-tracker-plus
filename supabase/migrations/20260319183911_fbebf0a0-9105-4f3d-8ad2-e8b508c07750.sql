
-- Add pinned and disappearing message support to direct_messages
ALTER TABLE public.direct_messages 
  ADD COLUMN IF NOT EXISTS is_pinned boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS is_starred boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS expires_at timestamp with time zone,
  ADD COLUMN IF NOT EXISTS file_url text,
  ADD COLUMN IF NOT EXISTS file_name text;

-- Create push subscriptions table
CREATE TABLE IF NOT EXISTS public.push_subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  endpoint text NOT NULL,
  p256dh text NOT NULL,
  auth_key text NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  UNIQUE(user_id, endpoint)
);

ALTER TABLE public.push_subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own push subscriptions"
  ON public.push_subscriptions FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Index for expired messages cleanup
CREATE INDEX IF NOT EXISTS idx_direct_messages_expires_at 
  ON public.direct_messages(expires_at) WHERE expires_at IS NOT NULL;

-- Index for pinned messages
CREATE INDEX IF NOT EXISTS idx_direct_messages_pinned 
  ON public.direct_messages(sender_organization_id, receiver_organization_id) WHERE is_pinned = true;
