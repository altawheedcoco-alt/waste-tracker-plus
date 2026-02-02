-- Fix 1: Set search_path for generate_item_code function
CREATE OR REPLACE FUNCTION public.generate_item_code()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $function$
BEGIN
  IF NEW.item_code IS NULL OR NEW.item_code = '' THEN
    NEW.item_code := 'ITM-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' || LPAD(FLOOR(RANDOM() * 10000)::TEXT, 4, '0');
  END IF;
  RETURN NEW;
END;
$function$;

-- Fix 2: Update chat_rooms INSERT policy to be more secure
-- Drop the overly permissive policy
DROP POLICY IF EXISTS "Authenticated users can create chat rooms" ON public.chat_rooms;

-- Create a more restrictive policy that only allows authenticated users to create rooms
CREATE POLICY "Authenticated users can create chat rooms" 
ON public.chat_rooms 
FOR INSERT 
WITH CHECK (auth.uid() IS NOT NULL);