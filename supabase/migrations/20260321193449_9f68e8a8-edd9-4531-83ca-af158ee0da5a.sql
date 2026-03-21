
ALTER TABLE public.broadcast_posts 
ADD COLUMN IF NOT EXISTS media_urls text[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS media_types text[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS media_names text[] DEFAULT '{}';
