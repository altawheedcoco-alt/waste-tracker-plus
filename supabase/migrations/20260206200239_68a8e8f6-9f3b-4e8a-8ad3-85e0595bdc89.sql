-- Fix remaining overly permissive RLS policies

-- 1. Fix industrial_facilities insert policy
DROP POLICY IF EXISTS "Authenticated users can insert facilities" ON public.industrial_facilities;

-- Only admins can insert industrial facilities
CREATE POLICY "Admins can insert industrial_facilities"
ON public.industrial_facilities FOR INSERT
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- 2. Fix system_health_metrics service role policy  
DROP POLICY IF EXISTS "Service role can manage health metrics" ON public.system_health_metrics;

-- 3. Fix system_health_summary service role policy
DROP POLICY IF EXISTS "Service role can manage health summary" ON public.system_health_summary;