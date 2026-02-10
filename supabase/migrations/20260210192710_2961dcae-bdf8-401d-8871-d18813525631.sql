
-- Create stories table
CREATE TABLE public.stories (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
  media_url TEXT NOT NULL,
  media_type TEXT NOT NULL DEFAULT 'image', -- image, video
  caption TEXT,
  text_content TEXT,
  background_color TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (now() + interval '24 hours'),
  is_active BOOLEAN NOT NULL DEFAULT true,
  view_count INTEGER NOT NULL DEFAULT 0
);

-- Create story views table
CREATE TABLE public.story_views (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  story_id UUID NOT NULL REFERENCES public.stories(id) ON DELETE CASCADE,
  viewer_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  viewer_organization_id UUID REFERENCES public.organizations(id),
  viewed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(story_id, viewer_user_id)
);

-- Enable RLS
ALTER TABLE public.stories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.story_views ENABLE ROW LEVEL SECURITY;

-- Stories RLS: Users can create their own stories
CREATE POLICY "Users can create their own stories"
  ON public.stories FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Stories RLS: Users can view stories from partners
CREATE POLICY "Users can view active stories"
  ON public.stories FOR SELECT
  USING (
    is_active = true 
    AND expires_at > now()
    AND (
      user_id = auth.uid()
      OR organization_id IN (
        SELECT partner_organization_id FROM public.partner_links 
        WHERE organization_id = (SELECT organization_id FROM public.profiles WHERE user_id = auth.uid() LIMIT 1)
        AND status = 'active'
        UNION
        SELECT organization_id FROM public.partner_links 
        WHERE partner_organization_id = (SELECT organization_id FROM public.profiles WHERE user_id = auth.uid() LIMIT 1)
        AND status = 'active'
      )
      OR EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin')
    )
  );

-- Stories RLS: Users can delete their own stories
CREATE POLICY "Users can delete their own stories"
  ON public.stories FOR DELETE
  USING (auth.uid() = user_id);

-- Stories RLS: Users can update their own stories
CREATE POLICY "Users can update their own stories"
  ON public.stories FOR UPDATE
  USING (auth.uid() = user_id);

-- Story Views RLS: Users can insert views
CREATE POLICY "Users can record story views"
  ON public.story_views FOR INSERT
  WITH CHECK (auth.uid() = viewer_user_id);

-- Story Views RLS: Story owners can see who viewed, viewers can see their own views
CREATE POLICY "Story owners and viewers can see views"
  ON public.story_views FOR SELECT
  USING (
    viewer_user_id = auth.uid()
    OR story_id IN (SELECT id FROM public.stories WHERE user_id = auth.uid())
  );

-- Create index for performance
CREATE INDEX idx_stories_user_id ON public.stories(user_id);
CREATE INDEX idx_stories_org_id ON public.stories(organization_id);
CREATE INDEX idx_stories_expires_at ON public.stories(expires_at);
CREATE INDEX idx_story_views_story_id ON public.story_views(story_id);
CREATE INDEX idx_story_views_viewer ON public.story_views(viewer_user_id);

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.stories;

-- Function to increment view count
CREATE OR REPLACE FUNCTION public.increment_story_view_count()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.stories SET view_count = view_count + 1 WHERE id = NEW.story_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER on_story_view_insert
  AFTER INSERT ON public.story_views
  FOR EACH ROW
  EXECUTE FUNCTION public.increment_story_view_count();

-- Storage bucket for story media
INSERT INTO storage.buckets (id, name, public)
VALUES ('stories', 'stories', true);

-- Storage policies
CREATE POLICY "Users can upload story media"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'stories' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Anyone can view story media"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'stories');

CREATE POLICY "Users can delete their own story media"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'stories' AND auth.uid()::text = (storage.foldername(name))[1]);
