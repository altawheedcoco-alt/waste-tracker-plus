-- Drop existing insert policy on organization_posts
DROP POLICY IF EXISTS "Organization members can create posts" ON public.organization_posts;
DROP POLICY IF EXISTS "Admins can create posts for any organization" ON public.organization_posts;

-- Create new policy that allows admins to insert posts for any organization
CREATE POLICY "Admins can create posts for any organization"
ON public.organization_posts
FOR INSERT
TO authenticated
WITH CHECK (
  public.has_role(auth.uid(), 'admin')
);

-- Create policy for organization members to create their own posts
CREATE POLICY "Organization members can create posts"
ON public.organization_posts
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.user_id = auth.uid()
    AND p.organization_id = organization_id
    AND p.is_active = true
  )
);