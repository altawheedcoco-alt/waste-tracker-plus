
-- Drop the overly permissive insert policy and replace with a more specific one
DROP POLICY "Anyone can submit" ON public.quick_link_submissions;

-- Allow anonymous inserts only if the link exists, is active, and not expired/maxed
CREATE POLICY "Submit to valid active links"
  ON public.quick_link_submissions FOR INSERT
  WITH CHECK (
    link_id IN (
      SELECT id FROM public.quick_shipment_links 
      WHERE is_active = true 
        AND (expires_at IS NULL OR expires_at > now())
        AND (max_uses IS NULL OR current_uses < max_uses)
    )
  );
