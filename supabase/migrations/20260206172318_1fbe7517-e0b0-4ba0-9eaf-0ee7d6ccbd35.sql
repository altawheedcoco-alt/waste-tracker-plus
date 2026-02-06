-- Add new columns for deposit receipt data extraction
ALTER TABLE public.deposits
ADD COLUMN IF NOT EXISTS bank_branch TEXT,
ADD COLUMN IF NOT EXISTS account_number TEXT,
ADD COLUMN IF NOT EXISTS check_number TEXT,
ADD COLUMN IF NOT EXISTS ai_extracted BOOLEAN DEFAULT FALSE;

COMMENT ON COLUMN public.deposits.bank_branch IS 'فرع البنك المستخرج من الإيصال';
COMMENT ON COLUMN public.deposits.account_number IS 'رقم الحساب المستخرج من الإيصال';
COMMENT ON COLUMN public.deposits.check_number IS 'رقم الشيك إن وجد';
COMMENT ON COLUMN public.deposits.ai_extracted IS 'هل تم استخراج البيانات بالذكاء الاصطناعي';