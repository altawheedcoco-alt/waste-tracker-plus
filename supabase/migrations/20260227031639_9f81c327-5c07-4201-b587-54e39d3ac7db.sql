-- Allow anonymous/public inserts to qr_scan_logs for verification
DROP POLICY IF EXISTS "Allow public inserts to qr_scan_logs" ON public.qr_scan_logs;
CREATE POLICY "Allow public inserts to qr_scan_logs"
  ON public.qr_scan_logs
  FOR INSERT
  WITH CHECK (true);

-- Allow public select for verification lookups
DROP POLICY IF EXISTS "Allow public select on organization_attestations" ON public.organization_attestations;
CREATE POLICY "Allow public select on organization_attestations"
  ON public.organization_attestations
  FOR SELECT
  USING (true);