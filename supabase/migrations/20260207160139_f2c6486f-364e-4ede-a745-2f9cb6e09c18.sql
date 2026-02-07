-- حذف القيد السابق
DROP INDEX IF EXISTS idx_deposits_unique_transaction;

-- إنشاء قيد جديد يمنع التكرار فقط للإيداعات البنكية (غير النقدية)
CREATE UNIQUE INDEX idx_deposits_unique_bank_transaction 
ON deposits (organization_id, amount, deposit_date, reference_number)
WHERE reference_number IS NOT NULL 
  AND reference_number != ''
  AND transfer_method != 'cash';

-- إضافة حقل توقيع المودع للإيداعات النقدية
ALTER TABLE deposits ADD COLUMN IF NOT EXISTS depositor_signature_url TEXT;

-- إضافة تعليق توضيحي
COMMENT ON INDEX idx_deposits_unique_bank_transaction IS 'يمنع تكرار الإيداعات البنكية فقط - الإيداعات النقدية يمكن تكرارها';
COMMENT ON COLUMN deposits.depositor_signature_url IS 'توقيع المودع (مطلوب للإيداعات النقدية)';