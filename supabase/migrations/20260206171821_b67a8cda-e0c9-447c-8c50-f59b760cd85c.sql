-- Add preset fields for deposit receipt data
ALTER TABLE public.organization_deposit_links
ADD COLUMN IF NOT EXISTS preset_amount NUMERIC,
ADD COLUMN IF NOT EXISTS preset_bank_name TEXT,
ADD COLUMN IF NOT EXISTS preset_account_number TEXT,
ADD COLUMN IF NOT EXISTS preset_depositor_name TEXT,
ADD COLUMN IF NOT EXISTS preset_branch TEXT,
ADD COLUMN IF NOT EXISTS preset_reference_number TEXT,
ADD COLUMN IF NOT EXISTS preset_payment_method TEXT DEFAULT 'bank_transfer';

COMMENT ON COLUMN public.organization_deposit_links.preset_amount IS 'المبلغ المحدد مسبقاً';
COMMENT ON COLUMN public.organization_deposit_links.preset_bank_name IS 'اسم البنك المحدد مسبقاً';
COMMENT ON COLUMN public.organization_deposit_links.preset_account_number IS 'رقم الحساب المحدد مسبقاً';
COMMENT ON COLUMN public.organization_deposit_links.preset_depositor_name IS 'اسم المودع المحدد مسبقاً';
COMMENT ON COLUMN public.organization_deposit_links.preset_branch IS 'فرع البنك المحدد مسبقاً';
COMMENT ON COLUMN public.organization_deposit_links.preset_reference_number IS 'رقم الإيصال المحدد مسبقاً';
COMMENT ON COLUMN public.organization_deposit_links.preset_payment_method IS 'طريقة الدفع المحددة مسبقاً';