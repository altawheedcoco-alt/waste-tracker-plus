-- Drop the restrictive SELECT policy
DROP POLICY IF EXISTS "Anyone can read published posts" ON platform_posts;

-- Create new SELECT policy: public sees published, admin sees all
CREATE POLICY "Public reads published, admin reads all"
ON platform_posts FOR SELECT
USING (
  is_published = true 
  OR 
  is_current_user_admin()
);