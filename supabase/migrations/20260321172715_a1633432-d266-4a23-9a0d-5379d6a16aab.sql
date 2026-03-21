
-- Add cover_url and verified to broadcast_channels
ALTER TABLE public.broadcast_channels ADD COLUMN IF NOT EXISTS cover_url text;
ALTER TABLE public.broadcast_channels ADD COLUMN IF NOT EXISTS is_verified boolean DEFAULT false;
ALTER TABLE public.broadcast_channels ADD COLUMN IF NOT EXISTS channel_visibility text DEFAULT 'public';

-- Create broadcast post reactions table
CREATE TABLE IF NOT EXISTS public.broadcast_post_reactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id uuid NOT NULL REFERENCES public.broadcast_posts(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  reaction_type text NOT NULL DEFAULT 'like',
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(post_id, user_id, reaction_type)
);

ALTER TABLE public.broadcast_post_reactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view reactions"
  ON public.broadcast_post_reactions FOR SELECT
  TO authenticated USING (true);

CREATE POLICY "Users can add reactions"
  ON public.broadcast_post_reactions FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can remove own reactions"
  ON public.broadcast_post_reactions FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

-- Add reactions_summary jsonb to broadcast_posts for caching
ALTER TABLE public.broadcast_posts ADD COLUMN IF NOT EXISTS reactions_count integer DEFAULT 0;
ALTER TABLE public.broadcast_posts ADD COLUMN IF NOT EXISTS reactions_summary jsonb DEFAULT '{}';

-- Add link preview fields
ALTER TABLE public.broadcast_posts ADD COLUMN IF NOT EXISTS link_url text;
ALTER TABLE public.broadcast_posts ADD COLUMN IF NOT EXISTS link_title text;
ALTER TABLE public.broadcast_posts ADD COLUMN IF NOT EXISTS link_preview_image text;
