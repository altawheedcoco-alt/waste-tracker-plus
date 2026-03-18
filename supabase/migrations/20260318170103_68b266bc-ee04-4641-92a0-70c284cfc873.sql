
-- Fix 1: Drop overly permissive SELECT policy on notifications (public role, auth.uid() IS NOT NULL)
DROP POLICY IF EXISTS "Notifications require authentication" ON public.notifications;

-- Fix 2: Drop overly permissive SELECT policy on shipment_logs (public role, auth.uid() IS NOT NULL)
DROP POLICY IF EXISTS "Shipment logs require authentication" ON public.shipment_logs;

-- Fix 3: Drop overly permissive SELECT policy on user_roles (public role, auth.uid() IS NOT NULL)
-- Replace with: users can view own roles + admins can manage (already exists)
DROP POLICY IF EXISTS "User roles require authentication" ON public.user_roles;
