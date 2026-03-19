
-- Add profile photo privacy setting to profiles
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS profile_photo_privacy text NOT NULL DEFAULT 'everyone';

-- Add comment
COMMENT ON COLUMN public.profiles.profile_photo_privacy IS 'Controls who can view profile photo: everyone, partners, nobody';
