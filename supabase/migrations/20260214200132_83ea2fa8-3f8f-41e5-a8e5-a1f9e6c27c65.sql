
-- Allow users to insert their own certificates
CREATE POLICY "Users can insert own certificates"
ON public.lms_certificates
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Create function to auto-issue certificate and update enrollment on quiz pass
CREATE OR REPLACE FUNCTION public.handle_quiz_passed()
RETURNS TRIGGER AS $$
DECLARE
  cert_number TEXT;
  existing_cert_id UUID;
BEGIN
  -- Only process if passed
  IF NEW.passed = true THEN
    -- Check if certificate already exists
    SELECT id INTO existing_cert_id
    FROM public.lms_certificates
    WHERE user_id = NEW.user_id AND course_id = NEW.course_id;

    IF existing_cert_id IS NULL THEN
      -- Generate unique certificate number
      cert_number := 'CERT-' || TO_CHAR(NOW(), 'YYMM') || '-' || LPAD(FLOOR(RANDOM() * 999999)::TEXT, 6, '0');

      -- Insert certificate
      INSERT INTO public.lms_certificates (user_id, course_id, certificate_number, score, issued_at, is_valid)
      VALUES (NEW.user_id, NEW.course_id, cert_number, COALESCE(NEW.percentage, 0)::INTEGER, NOW(), true);
    END IF;

    -- Update enrollment status to completed
    UPDATE public.lms_enrollments
    SET status = 'completed', updated_at = NOW()
    WHERE user_id = NEW.user_id AND course_id = NEW.course_id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger on quiz attempts
CREATE TRIGGER on_quiz_passed
AFTER INSERT ON public.lms_quiz_attempts
FOR EACH ROW
EXECUTE FUNCTION public.handle_quiz_passed();
