
-- Add AI review and admin review columns to terms_acceptances
ALTER TABLE public.terms_acceptances
  ADD COLUMN IF NOT EXISTS ai_review_score numeric DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS ai_review_status text DEFAULT 'pending' CHECK (ai_review_status IN ('pending', 'auto_approved', 'needs_review', 'admin_approved', 'admin_rejected')),
  ADD COLUMN IF NOT EXISTS ai_review_reasons jsonb DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS ai_review_summary text DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS selfie_url text DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS business_doc_urls jsonb DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS business_doc_type text DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS delegation_data jsonb DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS admin_reviewed_by uuid DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS admin_reviewed_at timestamptz DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS admin_review_notes text DEFAULT NULL;
