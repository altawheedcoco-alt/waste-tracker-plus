
-- Add profile customization columns
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS avatar_preset text DEFAULT 'default',
ADD COLUMN IF NOT EXISTS profile_color_theme text DEFAULT 'teal-blue';

-- Update RLS to allow users to update their own customization
CREATE POLICY "Users can update own profile customization" 
ON public.profiles 
FOR UPDATE 
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());
