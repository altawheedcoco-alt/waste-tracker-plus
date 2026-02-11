
-- Add evidence and review columns to partner_ratings
ALTER TABLE public.partner_ratings 
  ADD COLUMN evidence_photos text[] DEFAULT '{}',
  ADD COLUMN review_status text NOT NULL DEFAULT 'approved',
  ADD COLUMN reviewed_by uuid REFERENCES public.profiles(id),
  ADD COLUMN reviewed_at timestamptz,
  ADD COLUMN review_notes text,
  ADD COLUMN is_public boolean NOT NULL DEFAULT true;

-- Trigger: enforce evidence for low ratings & set pending review
CREATE OR REPLACE FUNCTION public.enforce_rating_evidence()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.overall_rating < 3 THEN
    IF (NEW.comment IS NULL OR trim(NEW.comment) = '') 
       AND (NEW.evidence_photos IS NULL OR array_length(NEW.evidence_photos, 1) IS NULL) THEN
      RAISE EXCEPTION 'التقييمات أقل من 3 نجوم تتطلب تعليقاً أو صورة توضيحية';
    END IF;
    NEW.review_status := 'pending';
    NEW.is_public := false;
  ELSE
    NEW.review_status := 'approved';
    NEW.is_public := true;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER trg_enforce_rating_evidence
  BEFORE INSERT ON public.partner_ratings
  FOR EACH ROW
  EXECUTE FUNCTION public.enforce_rating_evidence();

-- Policy: admins can update review status
CREATE POLICY "Admins can review ratings"
  ON public.partner_ratings
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles ur
      WHERE ur.user_id = auth.uid()
      AND ur.role IN ('admin', 'company_admin')
    )
  );

-- Storage bucket for rating evidence photos
INSERT INTO storage.buckets (id, name, public) 
VALUES ('rating-evidence', 'rating-evidence', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Authenticated users can upload evidence"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'rating-evidence' AND auth.role() = 'authenticated');

CREATE POLICY "Anyone can view evidence photos"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'rating-evidence');
