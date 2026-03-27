ALTER TABLE public.sidebar_preferences 
ADD COLUMN IF NOT EXISTS collapsed_sections text[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS pinned_items text[] DEFAULT '{}';