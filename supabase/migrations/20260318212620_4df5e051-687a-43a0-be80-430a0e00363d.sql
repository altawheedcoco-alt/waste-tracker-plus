
-- Table to store all cover and avatar photo history (Facebook-style)
CREATE TABLE public.profile_photos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  photo_type text NOT NULL CHECK (photo_type IN ('cover', 'avatar')),
  photo_url text NOT NULL,
  storage_path text,
  is_current boolean DEFAULT false,
  is_hidden boolean DEFAULT false,
  caption text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Index for fast lookups
CREATE INDEX idx_profile_photos_profile_type ON public.profile_photos(profile_id, photo_type, created_at DESC);
CREATE INDEX idx_profile_photos_user_id ON public.profile_photos(user_id);

-- Enable RLS
ALTER TABLE public.profile_photos ENABLE ROW LEVEL SECURITY;

-- Anyone can view non-hidden photos (for public profiles)
CREATE POLICY "Anyone can view visible profile photos"
  ON public.profile_photos FOR SELECT
  USING (is_hidden = false);

-- Owner can see all their photos (including hidden)
CREATE POLICY "Owner can view all own photos"
  ON public.profile_photos FOR SELECT
  USING (user_id = auth.uid());

-- Owner can insert their own photos
CREATE POLICY "Owner can insert own photos"
  ON public.profile_photos FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- Owner can update their own photos (hide/show, caption, current)
CREATE POLICY "Owner can update own photos"
  ON public.profile_photos FOR UPDATE
  USING (user_id = auth.uid());

-- Owner can delete their own photos
CREATE POLICY "Owner can delete own photos"
  ON public.profile_photos FOR DELETE
  USING (user_id = auth.uid());
