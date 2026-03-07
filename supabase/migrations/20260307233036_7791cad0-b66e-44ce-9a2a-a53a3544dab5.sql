
-- Tighten signature_verifications policies
DROP POLICY "Users can insert own verifications" ON public.signature_verifications;
DROP POLICY "Users can view verifications by signature" ON public.signature_verifications;

-- Add created_by column for proper RLS
ALTER TABLE public.signature_verifications ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES auth.users(id);

CREATE POLICY "Users can insert own verifications"
  ON public.signature_verifications FOR INSERT
  TO authenticated
  WITH CHECK (created_by = auth.uid());

CREATE POLICY "Users can view own verifications"
  ON public.signature_verifications FOR SELECT
  TO authenticated
  USING (created_by = auth.uid());

-- Update the update policy too
DROP POLICY "Users can update own verifications" ON public.signature_verifications;
CREATE POLICY "Users can update own verifications"
  ON public.signature_verifications FOR UPDATE
  TO authenticated
  USING (created_by = auth.uid() AND attempts < max_attempts);
