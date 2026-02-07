-- Create table for storing user's custom quick action order
CREATE TABLE public.user_quick_action_preferences (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    action_order TEXT[] NOT NULL DEFAULT '{}',
    hidden_actions TEXT[] DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE(user_id)
);

-- Enable RLS
ALTER TABLE public.user_quick_action_preferences ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own preferences" 
ON public.user_quick_action_preferences 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own preferences" 
ON public.user_quick_action_preferences 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own preferences" 
ON public.user_quick_action_preferences 
FOR UPDATE 
USING (auth.uid() = user_id);

-- Add trigger for updated_at
CREATE TRIGGER update_user_quick_action_preferences_updated_at
BEFORE UPDATE ON public.user_quick_action_preferences
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();