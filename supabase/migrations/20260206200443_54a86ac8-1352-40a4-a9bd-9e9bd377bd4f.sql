-- Fix critical security vulnerabilities

-- 1. Fix user_roles - Remove policy that allows users to assign roles to themselves
DROP POLICY IF EXISTS "Anyone can insert their own role" ON public.user_roles;

-- Only admins can manage roles
CREATE POLICY "Only admins can insert roles"
ON public.user_roles FOR INSERT
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- 2. Fix contract_verifications - require proper auth
DROP POLICY IF EXISTS "System can log verifications" ON public.contract_verifications;

-- Only authenticated users can log verifications
CREATE POLICY "Authenticated can log verifications"
ON public.contract_verifications FOR INSERT
TO authenticated
WITH CHECK (true);

-- 3. Fix submission_rate_limits - make it service_role only
DROP POLICY IF EXISTS "System can manage rate limits" ON public.submission_rate_limits;

-- No direct access - managed by edge functions with service_role
-- Table is protected by default when no policies exist for public/authenticated

-- 4. Fix shipments - Remove overly permissive policy
DROP POLICY IF EXISTS "Shipments require authentication" ON public.shipments;

-- 5. Fix chat_rooms - require explicit membership for group rooms
DROP POLICY IF EXISTS "Users can view accessible rooms" ON public.chat_rooms;

CREATE POLICY "Users can view their chat rooms"
ON public.chat_rooms FOR SELECT
TO authenticated
USING (
  -- Admin access
  public.has_role(auth.uid(), 'admin')
  -- Direct chat rooms where user is participant
  OR EXISTS (
    SELECT 1 FROM public.chat_participants
    WHERE room_id = chat_rooms.id AND user_id = auth.uid()
  )
  -- Shipment chat rooms where user has access to the shipment
  OR (type = 'shipment' AND shipment_id IS NOT NULL AND public.can_access_shipment(auth.uid(), shipment_id))
);

-- 6. Fix organization_deposit_links - anonymous should not browse
DROP POLICY IF EXISTS "Anon can access specific deposit link" ON public.organization_deposit_links;

-- Anonymous can only view deposit link via token parameter (needs edge function)
-- For now, restrict to authenticated users only
CREATE POLICY "Authenticated can view deposit links"
ON public.organization_deposit_links FOR SELECT
TO authenticated
USING (
  organization_id IN (
    SELECT organization_id FROM public.profiles WHERE user_id = auth.uid() AND is_active = true
  )
  OR public.has_role(auth.uid(), 'admin')
);