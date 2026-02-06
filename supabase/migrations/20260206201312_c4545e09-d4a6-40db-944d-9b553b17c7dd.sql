-- Create table for profile posts/stories
CREATE TABLE public.profile_posts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
  content_type TEXT NOT NULL CHECK (content_type IN ('text', 'image', 'video', 'link')),
  content TEXT, -- For text content or link URL
  media_url TEXT, -- For image/video URL from storage
  title TEXT,
  is_pinned BOOLEAN DEFAULT false,
  views_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE -- Optional expiry for stories
);

-- Enable RLS
ALTER TABLE public.profile_posts ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view posts from their organization members
CREATE POLICY "Users can view organization member posts"
ON public.profile_posts FOR SELECT
TO authenticated
USING (
  -- Can view own posts
  auth.uid() = user_id
  OR
  -- Can view posts from same organization
  organization_id IN (
    SELECT organization_id FROM public.user_roles WHERE user_id = auth.uid()
  )
  OR
  -- Admins can view all
  public.has_role(auth.uid(), 'admin')
);

-- Policy: Users can create their own posts
CREATE POLICY "Users can create their own posts"
ON public.profile_posts FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Policy: Users can update their own posts
CREATE POLICY "Users can update their own posts"
ON public.profile_posts FOR UPDATE
TO authenticated
USING (auth.uid() = user_id);

-- Policy: Users can delete their own posts
CREATE POLICY "Users can delete their own posts"
ON public.profile_posts FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- Create storage bucket for profile media
INSERT INTO storage.buckets (id, name, public, file_size_limit)
VALUES ('profile-media', 'profile-media', true, 52428800)
ON CONFLICT (id) DO NOTHING;

-- Storage policies
CREATE POLICY "Anyone can view profile media"
ON storage.objects FOR SELECT
USING (bucket_id = 'profile-media');

CREATE POLICY "Authenticated users can upload profile media"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'profile-media' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can update their own profile media"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'profile-media' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own profile media"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'profile-media' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Add trigger for updated_at
CREATE TRIGGER update_profile_posts_updated_at
BEFORE UPDATE ON public.profile_posts
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Enable realtime for posts
ALTER PUBLICATION supabase_realtime ADD TABLE public.profile_posts;