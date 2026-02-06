-- إضافة قيد فريد لمنع تكرار نفس الإيداع (نفس المبلغ، التاريخ، رقم المرجع، والمنظمة)
CREATE UNIQUE INDEX IF NOT EXISTS idx_deposits_unique_transaction 
ON deposits (organization_id, amount, deposit_date, COALESCE(reference_number, ''))
WHERE reference_number IS NOT NULL AND reference_number != '';

-- إضافة تعليق توضيحي
COMMENT ON INDEX idx_deposits_unique_transaction IS 'يمنع تكرار نفس الإيداع (نفس المبلغ والتاريخ ورقم المرجع)';