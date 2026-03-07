
DROP POLICY "Users can manage own verifications" ON public.signature_verifications;

CREATE POLICY "Users can insert own verifications"
  ON public.signature_verifications FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Users can view verifications by signature"
  ON public.signature_verifications FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can update own verifications"
  ON public.signature_verifications FOR UPDATE
  TO authenticated
  USING (attempts < max_attempts);

DROP POLICY "Users can manage own org OCR results" ON public.ocr_scan_results;

CREATE POLICY "Users can view own org OCR results"
  ON public.ocr_scan_results FOR SELECT
  TO authenticated
  USING (organization_id IN (
    SELECT organization_id FROM public.profiles WHERE id = auth.uid()
  ));

CREATE POLICY "Users can insert own org OCR results"
  ON public.ocr_scan_results FOR INSERT
  TO authenticated
  WITH CHECK (organization_id IN (
    SELECT organization_id FROM public.profiles WHERE id = auth.uid()
  ));

DROP POLICY "Users can manage own org workflow rules" ON public.workflow_rules;

CREATE POLICY "Users can view own org workflow rules"
  ON public.workflow_rules FOR SELECT
  TO authenticated
  USING (organization_id IN (
    SELECT organization_id FROM public.profiles WHERE id = auth.uid()
  ));

CREATE POLICY "Users can insert own org workflow rules"
  ON public.workflow_rules FOR INSERT
  TO authenticated
  WITH CHECK (organization_id IN (
    SELECT organization_id FROM public.profiles WHERE id = auth.uid()
  ));

CREATE POLICY "Users can update own org workflow rules"
  ON public.workflow_rules FOR UPDATE
  TO authenticated
  USING (organization_id IN (
    SELECT organization_id FROM public.profiles WHERE id = auth.uid()
  ));

CREATE POLICY "Users can delete own org workflow rules"
  ON public.workflow_rules FOR DELETE
  TO authenticated
  USING (organization_id IN (
    SELECT organization_id FROM public.profiles WHERE id = auth.uid()
  ));
