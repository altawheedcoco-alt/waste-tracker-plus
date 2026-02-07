-- منع تكرار الإيداعات بناءً على المبلغ والتاريخ ورقم المرجع والمؤسسة
CREATE UNIQUE INDEX IF NOT EXISTS idx_deposits_unique_transaction 
ON deposits (organization_id, amount, deposit_date, reference_number)
WHERE reference_number IS NOT NULL AND reference_number != '';

-- إضافة تعليق توضيحي
COMMENT ON INDEX idx_deposits_unique_transaction IS 'يمنع تسجيل نفس الإيداع مرتين بناءً على المبلغ والتاريخ ورقم المرجع';