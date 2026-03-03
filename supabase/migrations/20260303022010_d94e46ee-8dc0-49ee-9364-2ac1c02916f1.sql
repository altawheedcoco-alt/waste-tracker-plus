
-- Fix: restrict insert to service role only (drop the permissive policy)
DROP POLICY IF EXISTS "Service can insert camera events" ON public.camera_arrival_events;

-- Also fix the overlapping ALL policy on facility_cameras
DROP POLICY IF EXISTS "Org members can manage their cameras" ON public.facility_cameras;

CREATE POLICY "Org members can insert cameras"
ON public.facility_cameras FOR INSERT TO authenticated
WITH CHECK (organization_id IN (SELECT organization_id FROM public.profiles WHERE id = auth.uid()));

CREATE POLICY "Org members can update cameras"
ON public.facility_cameras FOR UPDATE TO authenticated
USING (organization_id IN (SELECT organization_id FROM public.profiles WHERE id = auth.uid()));

CREATE POLICY "Org members can delete cameras"
ON public.facility_cameras FOR DELETE TO authenticated
USING (organization_id IN (SELECT organization_id FROM public.profiles WHERE id = auth.uid()));
