-- جدول الردود الجاهزة للدعم الفني
CREATE TABLE public.support_quick_replies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'general',
  shortcut TEXT,
  usage_count INTEGER DEFAULT 0,
  is_global BOOLEAN DEFAULT false,
  created_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- جدول تصنيفات الردود
CREATE TABLE public.support_reply_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  icon TEXT,
  color TEXT,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- جدول ملفات التذاكر المرفقة
CREATE TABLE public.ticket_attachments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id UUID REFERENCES public.support_tickets(id) ON DELETE CASCADE NOT NULL,
  message_id UUID REFERENCES public.ticket_messages(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  file_url TEXT NOT NULL,
  file_type TEXT,
  file_size INTEGER,
  uploaded_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.support_quick_replies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.support_reply_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ticket_attachments ENABLE ROW LEVEL SECURITY;

-- RLS Policies for quick_replies (admin only for global, org for their own)
CREATE POLICY "Admins can manage all quick replies"
ON public.support_quick_replies FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can view global replies"
ON public.support_quick_replies FOR SELECT
TO authenticated
USING (is_global = true);

-- RLS for reply categories
CREATE POLICY "All can view reply categories"
ON public.support_reply_categories FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Admins can manage reply categories"
ON public.support_reply_categories FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- RLS for ticket attachments
CREATE POLICY "Users can view their ticket attachments"
ON public.ticket_attachments FOR SELECT
TO authenticated
USING (
  public.has_role(auth.uid(), 'admin') OR
  EXISTS (
    SELECT 1 FROM public.support_tickets st
    WHERE st.id = ticket_id
    AND st.organization_id IN (
      SELECT organization_id FROM public.profiles WHERE id = auth.uid()
    )
  )
);

CREATE POLICY "Users can upload attachments to their tickets"
ON public.ticket_attachments FOR INSERT
TO authenticated
WITH CHECK (
  public.has_role(auth.uid(), 'admin') OR
  EXISTS (
    SELECT 1 FROM public.support_tickets st
    WHERE st.id = ticket_id
    AND st.organization_id IN (
      SELECT organization_id FROM public.profiles WHERE id = auth.uid()
    )
  )
);

-- Insert default categories
INSERT INTO public.support_reply_categories (name, icon, color, sort_order) VALUES
('ترحيب', 'hand-wave', 'blue', 1),
('استلام الطلب', 'inbox', 'green', 2),
('قيد المعالجة', 'loader', 'yellow', 3),
('طلب معلومات', 'help-circle', 'orange', 4),
('حل المشكلة', 'check-circle', 'green', 5),
('إغلاق التذكرة', 'x-circle', 'gray', 6),
('تقني', 'wrench', 'purple', 7),
('مالي', 'credit-card', 'emerald', 8);

-- Insert default quick replies
INSERT INTO public.support_quick_replies (title, content, category, is_global, shortcut) VALUES
('ترحيب', 'مرحباً بك في الدعم الفني! كيف يمكننا مساعدتك اليوم؟', 'ترحيب', true, '/hi'),
('استلام الطلب', 'شكراً لتواصلك معنا. تم استلام طلبك وسنقوم بمراجعته في أقرب وقت.', 'استلام الطلب', true, '/received'),
('قيد المراجعة', 'طلبك قيد المراجعة حالياً من قبل الفريق المختص. سنوافيك بالتحديثات.', 'قيد المعالجة', true, '/review'),
('طلب تفاصيل', 'نحتاج منك بعض المعلومات الإضافية لمساعدتك بشكل أفضل. يرجى توضيح التالي:', 'طلب معلومات', true, '/info'),
('طلب صورة', 'يرجى إرفاق صورة توضيحية للمشكلة لنتمكن من فهمها بشكل أفضل.', 'طلب معلومات', true, '/img'),
('تم الحل', 'تم حل مشكلتك بنجاح. هل هناك أي شيء آخر يمكننا مساعدتك به؟', 'حل المشكلة', true, '/done'),
('إغلاق مع شكر', 'شكراً لتواصلك معنا. تم إغلاق التذكرة. لا تتردد في التواصل معنا مجدداً.', 'إغلاق التذكرة', true, '/close'),
('مشكلة تقنية', 'نعتذر عن هذه المشكلة التقنية. فريقنا يعمل على حلها وسنوافيك بالتحديثات.', 'تقني', true, '/tech'),
('تحديث النظام', 'يرجى تحديث الصفحة أو تسجيل الخروج ثم الدخول مجدداً لحل المشكلة.', 'تقني', true, '/refresh'),
('مسح ذاكرة التخزين', 'يرجى مسح ذاكرة التخزين المؤقت للمتصفح وإعادة المحاولة.', 'تقني', true, '/cache'),
('استفسار الفاتورة', 'بخصوص استفسارك عن الفاتورة، يمكنك مراجعة التفاصيل من صفحة الفواتير في لوحة التحكم.', 'مالي', true, '/invoice'),
('طريقة الدفع', 'يمكنك الدفع عبر التحويل البنكي أو الدفع الإلكتروني من خلال المنصة.', 'مالي', true, '/pay');

-- Enable realtime for ticket_messages
ALTER PUBLICATION supabase_realtime ADD TABLE public.ticket_attachments;