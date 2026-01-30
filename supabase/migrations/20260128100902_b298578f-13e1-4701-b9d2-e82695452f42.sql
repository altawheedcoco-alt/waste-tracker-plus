-- Fix RLS policies to require authentication for all tables

-- 1. Drop the overly permissive organizations policy and create a proper one
DROP POLICY IF EXISTS "Organizations viewable by authenticated users" ON public.organizations;
CREATE POLICY "Organizations viewable by authenticated users only"
ON public.organizations FOR SELECT
USING (auth.uid() IS NOT NULL);

-- 2. Add authentication requirement to profiles table
DROP POLICY IF EXISTS "Profiles require authentication" ON public.profiles;
CREATE POLICY "Profiles require authentication"
ON public.profiles FOR SELECT
USING (auth.uid() IS NOT NULL);

-- 3. Add authentication requirement to drivers table
DROP POLICY IF EXISTS "Drivers require authentication" ON public.drivers;
CREATE POLICY "Drivers require authentication"
ON public.drivers FOR SELECT
USING (auth.uid() IS NOT NULL);

-- 4. Add authentication requirement to notifications table
DROP POLICY IF EXISTS "Notifications require authentication" ON public.notifications;
CREATE POLICY "Notifications require authentication"
ON public.notifications FOR SELECT
USING (auth.uid() IS NOT NULL);

-- 5. Add authentication requirement to shipments table
DROP POLICY IF EXISTS "Shipments require authentication" ON public.shipments;
CREATE POLICY "Shipments require authentication"
ON public.shipments FOR SELECT
USING (auth.uid() IS NOT NULL);

-- 6. Add authentication requirement to shipment_logs table
DROP POLICY IF EXISTS "Shipment logs require authentication" ON public.shipment_logs;
CREATE POLICY "Shipment logs require authentication"
ON public.shipment_logs FOR SELECT
USING (auth.uid() IS NOT NULL);

-- 7. Add authentication requirement to user_roles table
DROP POLICY IF EXISTS "User roles require authentication" ON public.user_roles;
CREATE POLICY "User roles require authentication"
ON public.user_roles FOR SELECT
USING (auth.uid() IS NOT NULL);