-- جدول لتسجيل عمليات مسح QR والتحقق
CREATE TABLE IF NOT EXISTS public.qr_scan_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  scan_type TEXT NOT NULL, -- 'shipment', 'certificate', 'contract', 'receipt', 'report'
  document_reference TEXT NOT NULL, -- رقم المستند
  document_id UUID, -- معرف المستند إذا وجد
  scan_result TEXT NOT NULL DEFAULT 'pending', -- 'valid', 'invalid', 'expired', 'pending'
  scanner_ip INET,
  scanner_user_agent TEXT,
  scanner_user_id UUID,
  scanner_location JSONB, -- إحداثيات الموقع إذا توفرت
  document_data JSONB, -- بيانات المستند المستخرجة
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- فهرس للبحث السريع
CREATE INDEX IF NOT EXISTS idx_qr_scan_logs_reference ON public.qr_scan_logs(document_reference);
CREATE INDEX IF NOT EXISTS idx_qr_scan_logs_type ON public.qr_scan_logs(scan_type);
CREATE INDEX IF NOT EXISTS idx_qr_scan_logs_created ON public.qr_scan_logs(created_at DESC);

-- تفعيل RLS
ALTER TABLE public.qr_scan_logs ENABLE ROW LEVEL SECURITY;

-- سياسة القراءة للجميع (صفحة التحقق عامة)
CREATE POLICY "Anyone can insert scan logs"
  ON public.qr_scan_logs
  FOR INSERT
  WITH CHECK (true);

-- سياسة للمدراء فقط للقراءة
CREATE POLICY "Admins can view all scan logs"
  ON public.qr_scan_logs
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid()
      AND role = 'admin'
    )
  );

-- سياسة للمستخدمين لرؤية سجلاتهم
CREATE POLICY "Users can view their own scans"
  ON public.qr_scan_logs
  FOR SELECT
  USING (scanner_user_id = auth.uid());

-- تفعيل Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.qr_scan_logs;