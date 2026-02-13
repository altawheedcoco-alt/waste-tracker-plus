
-- =====================================================
-- COMPREHENSIVE SECURITY FIX MIGRATION
-- =====================================================

-- ===== 1. STORAGE BUCKETS: Make sensitive buckets private =====
UPDATE storage.buckets SET public = false WHERE id IN (
  'id-cards',
  'organization-stamps',
  'weighbridge-photos',
  'payment-receipts'
);

DROP POLICY IF EXISTS "Public can view organization stamps" ON storage.objects;
DROP POLICY IF EXISTS "Public can view id cards" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can view id cards" ON storage.objects;

CREATE POLICY "Org members can view stamps"
ON storage.objects FOR SELECT TO authenticated
USING (
  bucket_id = 'organization-stamps'
  AND (storage.foldername(name))[1] IN (
    SELECT organization_id::text FROM public.profiles WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Org members can view id cards"
ON storage.objects FOR SELECT TO authenticated
USING (
  bucket_id = 'id-cards'
  AND (storage.foldername(name))[1] IN (
    SELECT organization_id::text FROM public.profiles WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Org members can view weighbridge photos"
ON storage.objects FOR SELECT TO authenticated
USING (
  bucket_id = 'weighbridge-photos'
  AND (storage.foldername(name))[1] IN (
    SELECT organization_id::text FROM public.profiles WHERE user_id = auth.uid()
  )
);

-- ===== 2. FIX PERMISSIVE RLS POLICIES =====

DROP POLICY IF EXISTS "Authenticated users can view disposal facilities" ON public.disposal_facilities;
CREATE POLICY "Org members can view disposal facilities"
ON public.disposal_facilities FOR SELECT TO authenticated
USING (
  organization_id IN (
    SELECT organization_id FROM public.profiles WHERE user_id = auth.uid()
  )
  OR public.has_role(auth.uid(), 'admin'::public.app_role)
);

DROP POLICY IF EXISTS "device_types_public_read" ON public.gps_device_types;
DROP POLICY IF EXISTS "Authenticated users can view GPS device types" ON public.gps_device_types;
CREATE POLICY "Authenticated users can view GPS device types"
ON public.gps_device_types FOR SELECT TO authenticated
USING (true);

DROP POLICY IF EXISTS "gps_location_logs_insert" ON public.gps_location_logs;
CREATE POLICY "gps_location_logs_insert"
ON public.gps_location_logs FOR INSERT TO authenticated
WITH CHECK (
  driver_id IN (
    SELECT id FROM public.drivers WHERE profile_id IN (
      SELECT id FROM public.profiles WHERE user_id = auth.uid()
    )
  )
);

DROP POLICY IF EXISTS "System can insert readings" ON public.iot_readings;
CREATE POLICY "Authenticated can insert readings"
ON public.iot_readings FOR INSERT TO authenticated
WITH CHECK (true);

DROP POLICY IF EXISTS "System can insert transactions" ON public.points_transactions;
CREATE POLICY "Authenticated can insert transactions"
ON public.points_transactions FOR INSERT TO authenticated
WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Anyone can insert scan logs" ON public.qr_scan_logs;
CREATE POLICY "Authenticated can insert scan logs"
ON public.qr_scan_logs FOR INSERT TO authenticated
WITH CHECK (true);

DROP POLICY IF EXISTS "Users can insert audit log" ON public.signature_audit_log;
CREATE POLICY "Users can insert own audit log"
ON public.signature_audit_log FOR INSERT TO authenticated
WITH CHECK (actor_user_id = auth.uid());

DROP POLICY IF EXISTS "Anyone can read platform settings" ON public.platform_settings;
CREATE POLICY "Admins can read platform settings"
ON public.platform_settings FOR SELECT TO authenticated
USING (
  public.has_role(auth.uid(), 'admin'::public.app_role)
);

DROP POLICY IF EXISTS "Anyone can view badges" ON public.badges;
CREATE POLICY "Authenticated can view badges"
ON public.badges FOR SELECT TO authenticated
USING (true);

DROP POLICY IF EXISTS "Anyone can view leaderboard" ON public.leaderboard_cache;
CREATE POLICY "Authenticated can view leaderboard"
ON public.leaderboard_cache FOR SELECT TO authenticated
USING (true);

DROP POLICY IF EXISTS "Public can read verification logs" ON public.contract_verifications;
CREATE POLICY "Authenticated can read verification logs"
ON public.contract_verifications FOR SELECT TO authenticated
USING (true);

-- ===== 3. FIX FUNCTION SEARCH PATHS =====
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

CREATE OR REPLACE FUNCTION public.get_user_organization_id(_user_id uuid)
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT organization_id
  FROM public.profiles
  WHERE user_id = _user_id
  LIMIT 1
$$;

-- Fix the no-argument version too
CREATE OR REPLACE FUNCTION public.get_user_organization_id()
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT organization_id FROM public.profiles WHERE id = auth.uid() LIMIT 1
$$;
