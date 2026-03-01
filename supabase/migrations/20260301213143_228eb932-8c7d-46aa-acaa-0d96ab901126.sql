-- Add escrow_hold to allowed entry categories
ALTER TABLE public.accounting_ledger DROP CONSTRAINT accounting_ledger_entry_category_check;
ALTER TABLE public.accounting_ledger ADD CONSTRAINT accounting_ledger_entry_category_check 
  CHECK (entry_category = ANY (ARRAY['shipment','payment','deposit','adjustment','opening_balance','escrow_hold','escrow_release']));
