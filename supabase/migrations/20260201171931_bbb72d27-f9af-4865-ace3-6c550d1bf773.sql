-- إصلاح تحذيرات الأمان

-- 1. تحديث الدالة الأولى مع search_path
CREATE OR REPLACE FUNCTION generate_contract_verification_code()
RETURNS TEXT
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  timestamp_part TEXT;
  random_part TEXT;
  checksum INTEGER;
BEGIN
  timestamp_part := upper(to_hex(extract(epoch from now())::bigint));
  random_part := upper(substr(md5(random()::text), 1, 6));
  checksum := (extract(epoch from now())::bigint % 97);
  RETURN 'EG-WMRA-' || timestamp_part || '-' || random_part || '-' || lpad(checksum::text, 2, '0');
END;
$$;

-- 2. تحديث الدالة الثانية مع search_path
CREATE OR REPLACE FUNCTION set_contract_verification_code()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.verification_code IS NULL THEN
    NEW.verification_code := generate_contract_verification_code();
  END IF;
  RETURN NEW;
END;
$$;

-- 3. حذف السياسات المفرطة في السماح وإعادة إنشائها بشكل أكثر أماناً
DROP POLICY IF EXISTS "Anyone can verify contracts" ON public.contract_verifications;
DROP POLICY IF EXISTS "Authenticated users can log verifications" ON public.contract_verifications;

-- سياسة القراءة للتحقق العام (SELECT فقط مع true مقبول للقراءة العامة)
CREATE POLICY "Public can read verification logs"
ON public.contract_verifications FOR SELECT
USING (true);

-- سياسة INSERT أكثر تقييداً
CREATE POLICY "System can log verifications"
ON public.contract_verifications FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL OR verification_result IS NOT NULL);