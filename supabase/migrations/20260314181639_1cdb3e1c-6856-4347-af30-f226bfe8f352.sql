-- Backfill digital identity for existing receipts missing verification_code
UPDATE public.shipment_receipts
SET 
  verification_code = UPPER(
    SUBSTR(md5(random()::text), 1, 4) || '-' || 
    SUBSTR(md5(random()::text), 5, 4) || '-' || 
    SUBSTR(md5(random()::text), 9, 4)
  ),
  barcode_data = 'SHIPMENT_RECEIPT|' || receipt_number || '|' || EXTRACT(EPOCH FROM created_at)::bigint,
  qr_data = jsonb_build_object(
    'platform', 'iRecycle',
    'type', 'shipment_receipt',
    'doc_number', receipt_number,
    'verification_code', UPPER(
      SUBSTR(md5(id::text), 1, 4) || '-' || 
      SUBSTR(md5(id::text), 5, 4) || '-' || 
      SUBSTR(md5(id::text), 9, 4)
    ),
    'issued_at', created_at
  )::text
WHERE verification_code IS NULL;

-- Also backfill delivery_declarations
UPDATE public.delivery_declarations
SET 
  verification_code = UPPER(
    SUBSTR(md5(random()::text), 1, 4) || '-' || 
    SUBSTR(md5(random()::text), 5, 4) || '-' || 
    SUBSTR(md5(random()::text), 9, 4)
  ),
  barcode_data = 'DELIVERY_DECLARATION|' || COALESCE(shipment_number, id::text) || '|' || EXTRACT(EPOCH FROM created_at)::bigint,
  qr_data = jsonb_build_object(
    'platform', 'iRecycle',
    'type', 'delivery_declaration',
    'doc_number', COALESCE(shipment_number, id::text),
    'verification_code', UPPER(
      SUBSTR(md5(id::text), 1, 4) || '-' || 
      SUBSTR(md5(id::text), 5, 4) || '-' || 
      SUBSTR(md5(id::text), 9, 4)
    ),
    'issued_at', created_at
  )::text
WHERE verification_code IS NULL;